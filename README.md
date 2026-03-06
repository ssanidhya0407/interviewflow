# InterviewFlow

AI interview practice platform with a Next.js frontend and FastAPI backend.

## Quick Links
- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Run With Docker](#run-with-docker)
- [Deploy (Railway + Vercel)](#deploy-railway--vercel)
- [Troubleshooting](#troubleshooting)

## What It Does
- Role-based mock interviews
- AI interviewer chat flow
- Voice-enabled interview session
- Interview report with scoring + feedback
- Resume/JD parsing support

## Architecture
- Frontend: `frontend/` (Next.js 14, Tailwind, Framer Motion)
- Backend: `backend/` (FastAPI, Pydantic models, Firestore integration)
- Runtime flow:
  1. Frontend calls backend APIs (`/api/...`)
  2. Backend runs interview/session logic
  3. Frontend renders interview + report UI

## Quick Start

<details open>
<summary><strong>1) Backend (Terminal A)</strong></summary>

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.
</details>

<details open>
<summary><strong>2) Frontend (Terminal B)</strong></summary>

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.
</details>

<details>
<summary><strong>3) First Local Smoke Test</strong></summary>

- Open `http://localhost:3000`
- Start an interview from setup
- Confirm report page loads after ending interview
</details>

## Environment Variables

### Backend (`backend/.env`)

Required (core):
```env
# JWT auth
JWT_SECRET_KEY=change-me

# Firebase (pick one approach)
# 1) Place serviceAccountKey.json in backend/
# or 2) set FIREBASE_CREDENTIALS_JSON as JSON string in env
FIREBASE_CREDENTIALS_JSON=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
# Optional for preview domains
CORS_ALLOWED_ORIGIN_REGEX=
```

Optional (mail/reminders):
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_STARTTLS=True
MAIL_FROM=noreply@interviewflow.ai
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Run With Docker

```bash
docker-compose up --build
```

## Deploy (Railway + Vercel)

<details>
<summary><strong>Backend on Railway</strong></summary>

1. Create Railway project from repo.
2. Set **Root Directory** to `backend`.
3. Add env vars (at least):
   - `FIREBASE_CREDENTIALS_JSON`
   - `JWT_SECRET_KEY`
   - `CORS_ALLOWED_ORIGINS` (your Vercel domain)
   - Optional: `CORS_ALLOWED_ORIGIN_REGEX=^https://.*\.vercel\.app$`
4. Deploy and copy Railway public URL.
</details>

<details>
<summary><strong>Frontend on Vercel</strong></summary>

1. Create Vercel project from repo.
2. Set **Root Directory** to `frontend`.
3. Add env var:
   - `NEXT_PUBLIC_API_URL=https://<railway-backend-domain>`
4. Deploy.
</details>

## Troubleshooting

<details>
<summary><strong>OPTIONS /api/auth/login returns 400</strong></summary>

Cause is usually CORS origin mismatch.

Check:
- `CORS_ALLOWED_ORIGINS` matches exact frontend origin (no trailing slash)
- If using Vercel previews, set `CORS_ALLOWED_ORIGIN_REGEX`
- Backend redeployed after env/code changes
</details>

<details>
<summary><strong>First AI question appears in transcript but no audio</strong></summary>

The project now stores the initial interview message and plays it after user joins the interview view (browser gesture-safe flow). If it still fails, verify frontend is deployed with latest code.
</details>

## Scripts

### Backend
```bash
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
npm run lint
```

## License
MIT
