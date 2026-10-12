# Schedule App Backend

Run all backend commands in this folder:

```powershell
cd C:\D\AAjavascript\backend
```

## 1. Install dependencies

```powershell
npm install
```

## 2. Create local environment file

Copy `.env.example` to `.env`, then set your PostgreSQL password:

```powershell
Copy-Item .env.example .env
```

Required values:

- `DB_NAME=schedule_app`
- `DB_USER=postgres`
- `DB_PASSWORD=your_postgres_password`
- `PORT=3000`

## 3. Start backend

```powershell
npm start
```

The frontend pages call `http://<host>:3000/api`, so keep the backend on port `3000`.

## Project structure

- `app.js` - Express application entry point
- `config/db.js` - PostgreSQL connection and schema initialization
- `controllers/` - AuthController, ScheduleController, TaskController, SettingsController
- `models/` - database access for users, schedules, and tasks
- `routes/` - REST API route definitions
- `middleware/auth.js` - session authentication guard

## API implemented

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/password`
- `GET /api/settings`
- `PUT /api/settings/language`
- `GET /api/tasks/month/:year/:month`
- `GET /api/tasks/date/:date`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/health`
