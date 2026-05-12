# justpastlink

Full-stack app split into two top-level workspaces:

```text
backend/   FastAPI app, migrations, Python requirements, tests, uploads
frontend/  React + Vite + TypeScript app
```

## Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend reads environment variables from `backend/.env`. See `backend/.env.example`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies API routes to `http://localhost:8000`.

## Production-style local run

```bash
cd frontend
npm run build

cd ../backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

When `frontend/dist` exists, FastAPI serves the built frontend from the backend process.

The project intentionally stores quiz data in the `quizzes` table only as a JSON payload per video. The old `quiz_questions` table is removed by migration `010_drop_quiz_questions.up.sql`.
