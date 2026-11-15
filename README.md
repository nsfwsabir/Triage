# Triage

Full-stack helpdesk and issue ticketing system: users submit and track support tickets, admins triage, assign, prioritize and resolve them through a validated lifecycle.

## Stack
- **Backend:** Java 17+, Spring Boot 3.x (Web, Data JPA, Security, Validation), stateless JWT auth with `USER`/`ADMIN` roles, MariaDB/MySQL.
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, Framer Motion, React Router, Axios, Lucide.

## Running locally
1. Start MariaDB and create `triage_db` + user `triage`/`triage` (see `backend/src/main/resources/application.yml`).
2. Backend:
   ```bash
   cd backend
   mvn spring-boot:run   # http://localhost:8080
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev           # http://localhost:5173 (proxies /api to :8080)
   ```

On first startup the backend seeds: `admin@triage.dev / admin123` (ADMIN), `student@triage.dev / student123` (USER), and four sample tickets.

## API
Base URL `/api/v1`. Public: `POST /auth/register`, `POST /auth/login`. Authenticated: `GET/POST /tickets`, `GET /tickets/stats`, `GET/PATCH/DELETE /tickets/{id}`, `POST /tickets/{id}/comments`, `GET /users/admins` (ADMIN).

Ticket lifecycle: `OPEN → IN_PROGRESS|CLOSED`, `IN_PROGRESS → RESOLVED|OPEN`, `RESOLVED → CLOSED|IN_PROGRESS`, `CLOSED → OPEN` (ADMIN only).
