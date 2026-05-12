# justpastlink

Full-stack app split into two top-level workspaces:

```text
backend/   FastAPI app, migrations, Python requirements, Celery tasks
frontend/  React + Vite + TypeScript app
```

## What Runs Where

- FastAPI receives uploads and returns API responses.
- PostgreSQL stores users, videos, processing jobs, transcripts, lectures, and quizzes.
- Redis is the Celery broker/result backend.
- Celery worker processes videos in the background.
- Frontend talks to FastAPI through Vite proxy in development.

## Requirements

Install these before first run:

- Python 3.11 or 3.12
- Node.js 20+ and npm
- Docker Desktop, or local PostgreSQL + Redis
- FFmpeg with `ffmpeg` and `ffprobe` available in PATH
- A DashScope API key for Qwen generation

On Windows, FFmpeg can be installed with:

```powershell
winget install Gyan.FFmpeg
```

Restart the terminal after installing FFmpeg, then check:

```bash
ffmpeg -version
ffprobe -version
```

## 1. Start PostgreSQL And Redis

Recommended local setup:

```bash
docker compose up -d postgres redis
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

If you do not use Docker, start your own PostgreSQL and Redis services and update `backend/.env` accordingly.

## 2. Configure Backend Environment

Create a local env file:

```bash
cd backend
cp .env.example .env
```

For Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Default local values work with `docker-compose.yml`:

```env
DATABASE_URL=postgresql://postgres:123@localhost:5432/justpastlink
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
PROCESSING_QUEUE_NAME=video-processing
```

You must set:

```env
DASHSCOPE_API_KEY=your_key_here
SECRET_KEY=replace_this_for_real_deployments
```

Optional for local smoke tests without Redis/Celery:

```env
PROCESSING_TASK_ALWAYS_EAGER=true
```

Use that only for quick local checks. Normal development should use Redis + Celery worker.

## 3. Install Backend Dependencies

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

On macOS/Linux activation is:

```bash
source .venv/bin/activate
```

## 4. Apply Database Migrations

From `backend/`:

```bash
python apply_sql_migrations.py
```

This creates/updates the PostgreSQL tables, including the processing job fields used by Celery diagnostics.

## 5. Run Backend API

Open a terminal in `backend/` with the virtualenv activated:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API will run on:

```text
http://127.0.0.1:8000
```

## 6. Run Celery Worker

Open a second terminal in `backend/` with the same virtualenv activated:

```bash
celery -A app.tasks.celery_app.celery_app worker --loglevel=info -Q video-processing --pool=solo
```

This worker consumes jobs from Redis. If it is not running, uploads can be queued, but videos will not be processed.

## 7. Run Frontend

Open a third terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

Vite proxies API routes to `http://localhost:8000`.

## Processing Flow

When a user uploads a file or submits a YouTube link:

1. FastAPI validates the input.
2. FastAPI creates a `videos` row.
3. FastAPI creates or reuses an idempotent `processing_jobs` row.
4. FastAPI sends a Celery task to Redis.
5. Celery worker picks up the task.
6. The worker runs stages:
   - `download`
   - `transcribe`
   - `summarize`
   - `quiz`
7. Each stage stores start time, finish time, duration, attempts, and error code/message.
8. Frontend polls status and shows progress, ETA, and failed stage details.

## Useful URLs

- Processing status: `GET /processing/{video_id}/status`
- Job diagnostics: `GET /processing/{video_id}/diagnostics`
- Videos list: `GET /videos/`

## Common Problems

### Redis is not running

Symptom: upload fails with a queue/Celery/Redis error.

Fix:

```bash
docker compose up -d redis
```

Then restart the Celery worker.

### Celery worker is not running

Symptom: video stays in `queued`.

Fix:

```bash
cd backend
.venv\Scripts\activate
celery -A app.tasks.celery_app.celery_app worker --loglevel=info -Q video-processing
```

### FFmpeg is missing

Symptom: YouTube download or transcription fails.

Fix: install FFmpeg and verify:

```bash
ffmpeg -version
ffprobe -version
```

### PostgreSQL is not reachable

Symptom: backend fails at startup or migrations fail.

Fix:

```bash
docker compose up -d postgres
```

Check that `DATABASE_URL` in `backend/.env` matches the running database.

### PowerShell blocks npm

Symptom: `npm` cannot load `npm.ps1`.

Use:

```powershell
npm.cmd run dev
npm.cmd run build
```

## Production-Style Local Run

Build frontend:

```bash
cd frontend
npm run build
```

Run backend:

```bash
cd ../backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

When `frontend/dist` exists, FastAPI serves the built frontend from the backend process.

Production still needs PostgreSQL, Redis, and a Celery worker running separately.

## Notes

The project stores quiz data in the `quizzes` table as a JSON payload per video. The old `quiz_questions` table is removed by migration `010_drop_quiz_questions.up.sql`.
