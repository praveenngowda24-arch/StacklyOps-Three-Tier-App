
import os

from flask import Flask, jsonify
from flask_login import LoginManager
import mysql.connector

app = Flask(__name__)

secret_key = os.environ.get("FLASK_SECRET_KEY")
if not secret_key:
    raise RuntimeError("FLASK_SECRET_KEY must be configured.")

app.config.update(
    SECRET_KEY=secret_key,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get(
        "SESSION_COOKIE_SECURE", "false"
    ).lower() == "true",
)

login_manager = LoginManager()
login_manager.init_app(app)


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "appuser"),
        password=os.getenv("DB_PASSWORD", "apppassword"),
        database=os.getenv("DB_NAME", "taskdb"),
    )


@app.get("/api/auth/status")
def auth_status():
    return jsonify({"authentication": "setup_in_progress"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
