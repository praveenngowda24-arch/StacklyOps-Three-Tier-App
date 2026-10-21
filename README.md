# StacklyOps — Three-Tier Task Management Application

A containerized task management application built to demonstrate three-tier architecture, backend API development, database integration, and DevOps practices.

## Project Overview

StacklyOps is a web-based task management application with a frontend, backend API, and MySQL database. Docker Compose runs the application services together in a local development environment.

## Architecture

```text
                     Users / Web Browser
                             |
                             v
                   Frontend — Nginx
                     Port 8080
                             |
                             v
                   Backend — Flask API
                     Port 5000
                             |
                             v
                      MySQL Database
                        Port 3306
```

### Application Tiers

- **Presentation tier:** HTML, CSS, JavaScript, and Nginx.
- **Application tier:** Python and Flask REST API.
- **Data tier:** MySQL database for application data.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Web server | Nginx |
| Backend | Python, Flask |
| Database | MySQL 8.4 |
| Containerization | Docker |
| Service orchestration | Docker Compose |
| Version control | Git and GitHub |

## Features

- User registration and login
- Task creation and task listing
- Task status tracking
- Task assignment display
- Database-backed application data
- Containerized frontend, backend, and database services

## Prerequisites

Install the following before running the project:

- Docker Desktop
- Git
- A GitHub account (for repository access)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/praveenngowda24-arch/StacklyOps-Three-Tier-App.git
cd StacklyOps-Three-Tier-App
```

### 2. Configure environment variables

Create a local `.env` file in the project root using `.env.example` as a reference.

Set the following variables with appropriate local values:

- `FLASK_SECRET_KEY`
- `SESSION_COOKIE_SECURE`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`

Use strong local credentials. Do not commit `.env` or publish real passwords, tokens, or secret keys.

### 3. Start the application

```bash
docker compose up -d --build
```

### 4. Access the application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000

The database runs as an internal Docker Compose service.

### 5. Check service status

```bash
docker compose ps
```

### 6. View application logs

```bash
docker compose logs -f
```

### 7. Stop the application

```bash
docker compose down
```

To also delete the persistent database volume and its stored data, use `docker compose down -v` only when you intentionally want to erase that data.

## Project Structure

```text
StacklyOps-Three-Tier-App/
├── BACKEND/
│   ├── app.py
│   ├── auth_app.py
│   ├── migrate_auth.py
│   └── Dockerfile
├── FRONTEND/
│   ├── assets/
│   │   ├── css/
│   │   ├── images/
│   │   └── js/
│   ├── index.html
│   ├── login.html
│   ├── projects.html
│   ├── register.html
│   ├── reports.html
│   ├── tasks.html
│   ├── nginx.conf
│   └── Dockerfile
├── .env.example
├── .gitignore
├── docker-compose.yml
└── requirements.txt
```

## DevOps Learning Objectives

This project is a practical foundation for learning and demonstrating:

- Git version control and GitHub workflows
- Docker image creation and container management
- Docker Compose service orchestration
- Environment-based configuration and secret management
- Application logs and troubleshooting
- CI/CD pipeline automation with Jenkins
- Deployment automation and cloud hosting

**Planned enhancements:** Jenkins pipeline, automated testing, CI/CD integration, and deployment to AWS.

## Security Notes

- Keep `.env` out of version control.
- Use unique, strong secrets and database passwords.
- Avoid publishing credentials in source code, screenshots, logs, or documentation.
- Configure HTTPS and secure session cookies appropriately before production deployment.

## Author

**Praveen N.**  
DevOps Engineer

GitHub: [praveenngowda24-arch](https://github.com/praveenngowda24-arch)
