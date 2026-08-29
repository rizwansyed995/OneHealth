# OneHealth

A unified digital health-records platform. Patients get one secure place to store medical
reports, track fitness/vitals, and manage appointments; doctors get approved, scoped access
to their patients' data.

## Stack

**Backend** — FastAPI, MongoDB (Motor/async), JWT auth, AWS S3 + KMS, Google Gemini, Google Fit API
**Frontend** — Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion

## Features

- **Auth & roles** — JWT-based register/login with bcrypt password hashing. Two roles,
  `patient` and `doctor`; doctors only get access to patients that have approved them.
- **Encrypted file storage** — uploaded reports are encrypted client-side with AES-256-GCM
  using a per-file data key from AWS KMS (envelope encryption), then stored in S3. Metadata
  is tracked in MongoDB. Files are decrypted on demand for viewing/downloading.
- **AI report summarization** — pulls a user's uploaded PDFs, decrypts them, extracts text
  (PyMuPDF), summarizes each individually and as a combined report using Gemini, and renders
  the result as a downloadable PDF (ReportLab).
- **AI health insights** — analyzes an uploaded report PDF to extract health data, compute a
  basic risk score, and return an AI-generated suggestion.
- **Google Fit sync** — OAuth flow to pull steps, heart rate, and weight into the dashboard.
- **Dashboard** — step/heart-rate/blood-sugar charts, simple reminders widget.
- **Reports & appointments UI** — upload/view/download reports; appointment booking UI
  (calendar-based, currently front-end only).

## Project structure

```
backend/
  main.py                 # FastAPI app, router registration, CORS
  auth.py                 # password hashing + JWT create/verify + current-user dependency
  database.py             # MongoDB connection & collections
  models.py                # Pydantic models (Patient, Report, User)
  routes/
    auth_routes.py         # /auth  — register, login, me
    patients.py             # /patients — profile get/update, access control
    reports.py               # /reports — structured report records
    upload_routes.py         # /upload — encrypted file upload/download + AI summarization
    ai_routes.py              # /ai — report analysis & risk scoring
  api/
    google_fit_routes.py     # /fit — Google Fit OAuth + metrics
  utils/
    pdf_parser.py, health_extract.py, ai_suggestions.py

frontend/
  app/
    page.tsx                 # marketing landing page
    login/, register/         # auth pages (two-step registration)
    dashboard/
      page.tsx                 # charts + reminders
      reports/page.tsx           # upload/view/download/summarize reports
      appointments/page.tsx      # booking UI
  components/                # shared UI (Navbar, Sidebar, forms) + shadcn/ui primitives
  context/AuthContext.tsx    # client-side auth state (JWT, user, name) via localStorage
  lib/api.ts                 # API client helpers
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```
GOOGLE_API_KEY=
MONGO_URI=
SECRET_KEY=
DB_NAME=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
AWS_KMS_KEY_ID=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GEMINI_API_KEY=
```

Also place a Google OAuth `client_secret.json` in `backend/` (needed for the Google Fit
connect flow — generates `token.json` on first auth).

Run:

```bash
uvicorn main:app --reload
```

API docs at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000`. Backend URL is currently hardcoded to
`http://127.0.0.1:8000` in the frontend pages — update if deploying.

## Known gaps / not yet wired up

- Appointments page is UI-only — no backend endpoint or persistence yet.
- Dashboard heart-rate and blood-sugar values are hardcoded/mocked.
- Reminders are client-side state only (lost on refresh).
- `backend/token.json` and `client_secret.json` are gitignored but should never be committed
  since they contain live OAuth credentials.
