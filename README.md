# DevOps Practice User Directory

A small local application for practicing React with Vite, FastAPI, and PostgreSQL.
The backend creates the `users` table when it starts. Passwords are stored as
bcrypt hashes; the API only returns usernames.

## Project layout

```text
.env               Local backend and Vite configuration (not committed)
frontend/
  src/App.jsx       React registration and lookup interface
  src/main.jsx      Vite/React entry point
  src/App.css       Simple app styling
  vite.config.js    Loads Vite variables from the project root
backend/
  main.py           FastAPI endpoints and database initialization
  init_db.sql       SQL schema (also run automatically at backend startup)
  requirements.txt  Python dependencies
```

## Environment configuration

Create a single `.env` file in the project root:

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for the
backend. `CORS_ORIGINS` configures allowed browser origins. `VITE_API_URL`
sets the frontend API URL and defaults to `http://127.0.0.1:8000`. Keep real
credentials in `.env` only; it is excluded from Git.

## Run locally (Windows PowerShell)

1. Create the database with PostgreSQL installed and running:

   ```powershell
   psql -U postgres -c "CREATE DATABASE devops_practice;"
   psql -U postgres -d devops_practice -f backend/init_db.sql
   ```

   The second command is optional if you start the backend, because it runs the
   same schema file automatically.

2. Configure and start the backend:

   ```powershell
   cd backend
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   python -m uvicorn main:app --reload
   ```

   The API is available at `http://localhost:8000`; its health endpoint is
   `http://localhost:8000/health`.

3. In another PowerShell window, configure and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

## Run the backend in Docker

Build the image from the `backend` directory as the build context, then pass
the root `.env` file to the container at runtime. The image copies only the
backend application files; database credentials are not included in it.

```powershell
docker build -f backend/Dockerfile -t devops-backend backend
docker run --rm --env-file .env -p 8000:8000 devops-backend
```

The container receives `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and
`DB_PASSWORD` from `.env`. For a Supabase Session Pooler connection, use the
pooler host and port and set `PGSSLMODE=require` in the root `.env`.
