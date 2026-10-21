
import os
import re

import mysql.connector
from flask import Flask, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET_KEY"]
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = (
    os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
)


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "appuser"),
        password=os.getenv("DB_PASSWORD", "apppassword"),
        database=os.getenv("DB_NAME", "taskdb"),
    )


def current_user():
    return session.get("user")


def login_required():
    if not current_user():
        return jsonify({"error": "Please log in first"}), 401
    return None


@app.get("/api/health")
def health():
    connection = get_db_connection()
    try:
        connection.ping(reconnect=True, attempts=1, delay=0)
        return jsonify({"status": "healthy", "database": "connected"})
    finally:
        connection.close()


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,80}", username):
        return jsonify({"error": "Username must be 3–80 characters"}), 400
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Enter a valid email"}), 400
    if not isinstance(password, str) or len(password) < 12:
        return jsonify({"error": "Password must be at least 12 characters"}), 400

    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM users")
        is_first_user = cursor.fetchone()["total"] == 0

        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) "
            "VALUES (%s, %s, %s, %s)",
            (username, email, generate_password_hash(password),
             "admin" if is_first_user else "user"),
        )
        user_id = cursor.lastrowid

        if is_first_user:
            cursor.execute(
                "UPDATE tasks SET user_id=%s WHERE user_id IS NULL",
                (user_id,),
            )

        connection.commit()
        session.clear()
        session["user"] = {
            "id": user_id,
            "username": username,
            "email": email,
            "role": "admin" if is_first_user else "user",
        }
        return jsonify({"message": "Registered successfully", "user": session["user"]}), 201
    except mysql.connector.IntegrityError:
        connection.rollback()
        return jsonify({"error": "Username or email already exists"}), 409
    finally:
        connection.close()


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, username, email, password_hash, role "
            "FROM users WHERE email=%s",
            (email,),
        )
        user = cursor.fetchone()

        if not user or not isinstance(password, str) or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({"error": "Invalid email or password"}), 401

        session.clear()
        session["user"] = {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        }
        return jsonify({"message": "Login successful", "user": session["user"]})
    finally:
        connection.close()


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.get("/api/auth/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"user": None}), 200
    return jsonify({"user": user})


@app.post("/api/tasks")
def create_task():
    if error := login_required():
        return error

    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    if not title or len(title) > 255:
        return jsonify({"error": "Task title is required"}), 400

    user = current_user()
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO tasks (title, description, user_id) VALUES (%s,%s,%s)",
            (title, description, user["id"]),
        )
        connection.commit()
        return jsonify({"id": cursor.lastrowid, "title": title}), 201
    finally:
        connection.close()


def task_access(cursor, task_id, user):
    cursor.execute("SELECT id,user_id FROM tasks WHERE id=%s", (task_id,))
    task = cursor.fetchone()
    if not task:
        return False, (jsonify({"error": "Task not found"}), 404)
    if user["role"] != "admin" and task[1] != user["id"]:
        return False, (jsonify({"error": "Access denied"}), 403)
    return True, None


@app.patch("/api/tasks/<int:task_id>")
def update_task(task_id):
    if error := login_required():
        return error

    data = request.get_json(silent=True) or {}
    updates = {key: data[key] for key in ("title", "description", "completed") if key in data}
    if not updates:
        return jsonify({"error": "Provide a field to update"}), 400
    if "title" in updates and not str(updates["title"]).strip():
        return jsonify({"error": "Title cannot be empty"}), 400
    if "completed" in updates and not isinstance(updates["completed"], bool):
        return jsonify({"error": "completed must be true or false"}), 400

    user = current_user()
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        allowed, response = task_access(cursor, task_id, user)
        if not allowed:
            return response

        updates = {
            key: (int(value) if key == "completed" else str(value).strip() if key == "title" else value)
            for key, value in updates.items()
        }
        assignments = ", ".join(f"{key}=%s" for key in updates)
        cursor.execute(
            f"UPDATE tasks SET {assignments} WHERE id=%s",
            (*updates.values(), task_id),
        )
        connection.commit()
        return jsonify({"message": "Task updated"})
    finally:
        connection.close()


@app.delete("/api/tasks/<int:task_id>")
def delete_task(task_id):
    if error := login_required():
        return error

    user = current_user()
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        allowed, response = task_access(cursor, task_id, user)
        if not allowed:
            return response
        cursor.execute("DELETE FROM tasks WHERE id=%s", (task_id,))
        connection.commit()
        return jsonify({"message": "Task deleted"})
    finally:
        connection.close()


@app.get("/api/tasks")
def list_tasks():
    if error := login_required():
        return error

    user = current_user()
    connection = get_db_connection()

    try:
        cursor = connection.cursor(dictionary=True)

        if user["role"] == "admin":
            cursor.execute(
                """
                SELECT
                    t.id,
                    t.title,
                    t.description,
                    t.completed,
                    t.created_at,
                    t.user_id,
                    u.username AS assigned_user
                FROM tasks AS t
                LEFT JOIN users AS u ON u.id = t.user_id
                ORDER BY t.id DESC
                """
            )
        else:
            cursor.execute(
                """
                SELECT
                    t.id,
                    t.title,
                    t.description,
                    t.completed,
                    t.created_at,
                    t.user_id,
                    u.username AS assigned_user
                FROM tasks AS t
                LEFT JOIN users AS u ON u.id = t.user_id
                WHERE t.user_id = %s
                ORDER BY t.id DESC
                """,
                (user["id"],),
            )

        tasks = cursor.fetchall()

        for task in tasks:
            task["completed"] = bool(task["completed"])
            task["created_at"] = (
                task["created_at"].isoformat()
                if task["created_at"] else None
            )

        return jsonify(tasks)

    finally:
        connection.close()


@app.get("/api/admin/summary")
def admin_summary():
    if error := login_required():
        return error

    user = current_user()
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    connection = get_db_connection()

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                u.id AS user_id,
                u.username,
                u.email,
                u.role,
                COUNT(t.id) AS total_tasks,
                COALESCE(SUM(
                    CASE WHEN t.completed = 1 THEN 1 ELSE 0 END
                ), 0) AS completed_tasks,
                COALESCE(SUM(
                    CASE WHEN t.id IS NOT NULL AND t.completed = 0
                         THEN 1 ELSE 0 END
                ), 0) AS pending_tasks
            FROM users AS u
            LEFT JOIN tasks AS t ON t.user_id = u.id
            GROUP BY u.id, u.username, u.email, u.role
            ORDER BY u.id
            """
        )

        users = cursor.fetchall()

        for item in users:
            total = item["total_tasks"]
            completed = item["completed_tasks"]
            item["completion_rate"] = (
                round(completed * 100 / total) if total else 0
            )

        return jsonify({
            "total_users": len(users),
            "total_tasks": sum(u["total_tasks"] for u in users),
            "completed_tasks": sum(u["completed_tasks"] for u in users),
            "pending_tasks": sum(u["pending_tasks"] for u in users),
            "users": users,
        })

    finally:
        connection.close()



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
