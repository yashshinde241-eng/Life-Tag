# Life-Tag

Life-Tag is a medical-records sharing app with a Node/Express backend (Sequelize + Postgres) and a React frontend. The backend stores encrypted file blobs (uses S3-compatible storage such as MinIO or AWS S3), secures routes with JWT, and supports doctor/patient access flows.

This README explains how to set up the project locally (Windows/PowerShell), what environment variables are required, and how to run both backend and frontend for development and production builds.

---

## Table of contents

- Project status
- Prerequisites
- Quick start (recommended)
- Manual setup (detailed)
	- Backend
	- Frontend
	- Environment variables (.env example)
- Database sync and seed
- Storage (MinIO / AWS S3)
- API health checks and testing
- Troubleshooting
- Next steps

## Project status

- Backend: Node + Express (see `backend/package.json`). Use `npm run dev` for development with nodemon.
- Frontend: React (Create React App) in `frontend`. Use `npm start` for local development.

## Prerequisites

- Node.js (LTS recommended) — v16+ / v18+ recommended
- npm (bundled with Node)
- Postgres (local or remote)
- (Optional for S3-compatible local storage) MinIO

On Windows PowerShell, run commands as shown below.

## Quick start (run dev locally)

1. Open two terminals (PowerShell): one for backend, one for frontend.

2. Install dependencies and start backend (terminal A):

```powershell
cd c:\dev\Life-Tag\backend
npm install
# create a .env next to index.js (see example below)
npm run dev
```

3. Install dependencies and start frontend (terminal B):

```powershell
cd c:\dev\Life-Tag\frontend
npm install
npm start
```

4. Visit the frontend at http://localhost:3000 and the backend health-check at http://localhost:5000 (default backend port).

Note: If you change backend `PORT` via `.env`, use that port for endpoints.

## Manual setup and details

### Backend

Project location: `backend/`

- Install dependencies:

```powershell
cd c:\dev\Life-Tag\backend
npm install
```

- Scripts (in `backend/package.json`):
	- `npm start` — runs `node index.js` (production)
	- `npm run dev` — runs `nodemon index.js` (development, auto-reload)
	- `npm run sync` — runs `node models/syncModels.js` (syncs Sequelize models to the DB)

- Start (dev): `npm run dev` — the server will attempt to connect to Postgres and then start (default port 5000). See `backend/index.js`.

### Frontend

Project location: `frontend/`

- Install dependencies and run in dev mode:

```powershell
cd c:\dev\Life-Tag\frontend
npm install
npm start
```

- Build for production:

```powershell
npm run build
```

The frontend expects the backend API at a relative path or configured base URL inside `src/api.js` — adjust if your backend runs on a different host/port.

## Environment variables

Create a `.env` file in `backend/` next to `index.js`. Below is a minimal example that covers local development.

```
# Backend server
PORT=5000

# Postgres (create database/user as needed)
DB_NAME=LifeTagDB
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=127.0.0.1
DB_PORT=5432

# JWT
JWT_SECRET=replace-with-a-strong-secret

# Encryption used to encrypt file blobs before upload
ENCRYPTION_KEY=replace-with-a-32-or-stronger-key

# S3 / MinIO settings (use either MinIO locally or AWS credentials)
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
AWS_S3_BUCKET_NAME=lifetag-records

# (Optional) Mailer / SMTP values if your codebase requires them
# MAIL_HOST=smtp.example.com
# MAIL_PORT=587
# MAIL_USER=your-email@example.com
# MAIL_PASS=your-email-password
```

Notes:
- `ENCRYPTION_KEY` is used by the backend when encrypting and decrypting file contents. Keep it secret and consistent between restarts.
- If you use AWS S3 instead of MinIO, point `MINIO_ENDPOINT` to AWS settings or update code to use AWS SDK credentials.

## Database: Postgres

1. Install Postgres locally or use a hosted database.
2. Create a database matching `DB_NAME` (or let the app try to connect to the default name and create tables with `npm run sync`).

Example (psql):

```powershell
# Run these in PowerShell (adjust paths/credentials as needed)
# Start psql and create DB if user has permissions
psql -U postgres -c "CREATE DATABASE LifeTagDB;"
```

Then run the model sync (this will create tables defined by Sequelize models):

```powershell
cd c:\dev\Life-Tag\backend
npm run sync
```

The `sync` script calls `models/syncModels.js` in this repo and will create tables using your active DB connection.

## Storage: MinIO (local S3) or AWS S3

This project expects an S3-compatible endpoint in the backend. For local development you can use MinIO:

1. Download and run MinIO (https://min.io/). Example quickstart:

```powershell
# Download minio.exe or use a container. Example (PowerShell, once minio.exe available):
minio server D:\minio-data --console-address ":9001"
```

2. Create a bucket named as in `AWS_S3_BUCKET_NAME` (e.g., `lifetag-records`).

3. Set `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and `MINIO_USE_SSL` in your `.env`.

If you use AWS S3 instead, provide valid AWS credentials and ensure the bucket exists.

## API health checks and quick verification

- Backend health: GET / -> { message: 'Life-Tag backend: healthy ✅' }

Example (PowerShell using Invoke-WebRequest):

```powershell
Invoke-WebRequest -Uri http://localhost:5000 -UseBasicParsing | Select-Object -ExpandProperty Content
```

Try fetching a protected endpoint after you register & authenticate via the frontend or API routes.

## Common troubleshooting

- Problem: Backend fails with DB connection error.
	- Check `.env` DB_* values and that Postgres is running and accessible from your machine.

- Problem: Missing JWT secret / 401 errors.
	- Ensure `JWT_SECRET` is set and consistent across processes.

- Problem: File uploads failing to S3/MinIO.
	- Verify `MINIO_ENDPOINT`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` and that the bucket exists. Check `MINIO_USE_SSL` (should be `false` for local HTTP endpoints).

- Problem: Encryption/decryption fails.
	- Ensure `ENCRYPTION_KEY` matches the key used to encrypt files.

## Development notes & useful commands

- Start backend (dev):

```powershell
cd backend; npm run dev
```

- Sync DB models:

```powershell
cd backend; npm run sync
```

- Start frontend:

```powershell
cd frontend; npm start
```

## Next steps / suggestions

- Add a sample `.env.example` file (we included a sample above — consider committing as `.env.example`).
- Add instructions or scripts for creating local test data (seed script).
- Add Docker Compose to run Postgres + MinIO + backend + frontend together for full reproducible local environment.

## License

This repository does not include a license file; add one if you plan to open-source the project (e.g., MIT).

---

If you'd like, I can:

- Add a `.env.example` file to the repo using the values shown above.
- Add a Docker Compose file for Postgres + MinIO + backend + frontend for one-command local startup.

Tell me which of those you'd like next and I will add them.

