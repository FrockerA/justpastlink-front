# JustPastLink Frontend

React + Vite + TypeScript frontend for JustPastLink.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

During development, Vite proxies API routes to `http://localhost:8000`.

Optional local env:

```env
VITE_API_URL=http://localhost:8000
```

If `VITE_API_URL` is not set, requests use the same origin. That works in development through the Vite proxy and in production when FastAPI serves `frontend/dist`.
