
import os
import time

import mysql.connector
from mysql.connector import Error


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "appuser"),
        password=os.getenv("DB_PASSWORD", "apppassword"),
        database=os.getenv("DB_NAME", "taskdb"),
    )


def migrate():
    connection = None

    for attempt in range(30):
        try:
            connection = get_db_connection()
            break
        except Error as error:
            print(f"MySQL connection attempt {attempt + 1}/30: {error}")
            time.sleep(2)

    if connection is None:
        raise RuntimeError("Could not connect to MySQL.")

    cursor = connection.cursor()

    try:
        # Create the user table without changing existing task records.
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(80) NOT NULL,
                email VARCHAR(254) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_username (username)
            )
        """)

        # Add ownership only if the column does not already exist.
        cursor.execute("SHOW COLUMNS FROM tasks LIKE 'user_id'")
        if cursor.fetchone() is None:
            cursor.execute("""
                ALTER TABLE tasks
                ADD COLUMN user_id INT NULL
            """)

        # Check whether the ownership foreign key already exists.
        cursor.execute("""
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'tasks'
              AND COLUMN_NAME = 'user_id'
              AND REFERENCED_TABLE_NAME = 'users'
        """)

        if cursor.fetchone() is None:
            cursor.execute("""
                ALTER TABLE tasks
                ADD CONSTRAINT fk_tasks_user
                FOREIGN KEY (user_id) REFERENCES users(id)
                ON DELETE RESTRICT
            """)

        connection.commit()
        print("Migration completed: users table and task ownership are ready.")
        print("Existing tasks have been preserved.")
        print("Create the first admin account before assigning existing tasks.")

    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    migrate()
