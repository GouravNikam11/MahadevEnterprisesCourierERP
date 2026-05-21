## Mahadev Enterprises Courier ERP System — Project Handoff

Use this document to brief another developer/ChatGPT about the project and how to run it locally.

---

### What this project is

- **Name**: Mahadev Enterprises Courier ERP System
- **Type**: Courier Management ERP (web)
- **Goal**: Booking (account + cash), masters, courier status timeline, tracking link generation, SMS notifications/logs, basic reports, admin-style dashboard UI.

---

### Tech stack

- **Frontend**: React + Vite + TypeScript
  - TailwindCSS
  - React Router
  - Redux Toolkit (auth session persistence)
  - React Hook Form + Zod
  - Axios
  - PWA via `vite-plugin-pwa`
- **Backend**: Node.js + Express (TypeScript ESM)
  - Prisma ORM
  - Swagger docs
  - Winston + Morgan logging
  - Helmet, CORS, Rate limiting
- **Database**: PostgreSQL (Supabase or local Postgres)
- **Auth**: Email/password login + JWT access token + refresh tokens (DB table)
- **SMS**: Provider abstraction with `mock` fallback; best-effort integration for `fast2sms`/`msg91` + always logs to DB.

---

### Monorepo structure

- `frontend/`: React UI
- `backend/`: Express REST API under `/api/v1/*`
- `database/`: manual SQL scripts
  - `database/schema.sql`
  - `database/seed.sql`
- `docs/`: setup/deployment docs
  - `docs/SETUP.md`
  - `docs/DEPLOYMENT.md`
- `docker/`: docker compose
- `.github/workflows/ci.yml`: GitHub Actions CI build pipeline

---

### What is implemented (features)

#### Authentication (backend + frontend)

- API endpoints:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me` (Bearer access token)
- Frontend:
  - Login page calls backend login
  - Auth session stored in Redux and persisted to localStorage
  - `/app/*` routes are protected

#### Masters (UI + API)

- Account Party
  - API: `/api/v1/account-party` (list/create), `/api/v1/account-party/:id` (get/update/delete soft)
  - UI: create/edit/delete + search + pagination + CSV export
- Courier Company
  - API: `/api/v1/courier-company` and `/api/v1/courier-company/:id`
  - UI: create/edit/delete + search + pagination + CSV export
  - Tracking URL template supports `{tracking_number}`
- Pincode Master
  - API: `/api/v1/pincode` and `/api/v1/pincode/:id`
  - UI: create/edit/delete + search + pagination + CSV export

#### Bookings (UI + API)

- Account Booking
  - API: `GET/POST /api/v1/account-booking`
  - UI: create form + list + CSV export + receipt print
  - On create: tracking link generated (if courier company has template)
  - On create: SMS attempt + DB log (if customer phone exists)
- Cash Booking
  - API: `GET/POST /api/v1/cash-booking`
  - UI: create form + list + CSV export + receipt print
  - Includes pincode lookup + search filter in UI
  - On create: tracking link generated (if courier company has template)
  - On create: SMS attempt + DB log (if mobile number exists)

#### Status tracking (UI + API)

- API:
  - `POST /api/v1/status` (updates booking status + inserts timeline log + SMS attempt/log)
  - `GET /api/v1/status/timeline?bookingType=account|cash&bookingId=<uuid>`
- UI:
  - `/app/status` page for status update + timeline viewer

#### Reports (starter)

- API:
  - `GET /api/v1/reports/daily-bookings?date=YYYY-MM-DD`
  - CSV: `GET /api/v1/reports/daily-bookings?date=YYYY-MM-DD&format=csv`
- UI:
  - `/app/reports` page runs report + CSV download

#### Lookup endpoints (for dropdowns)

- `GET /api/v1/lookup/account-party`
- `GET /api/v1/lookup/courier-company`
- `GET /api/v1/lookup/pincode`

---

### Important URLs (local)

- Frontend: `http://localhost:5173`
- Backend base: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/v1/docs`
- Health: `http://localhost:4000/api/v1/health`

---

### Environment variables

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

#### Backend (`backend/.env`)

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/courier_erp?schema=public
JWT_SECRET=dev-only-change-me-dev-only

SMS_PROVIDER=mock
SMS_API_KEY=
SMS_SENDER_ID=

SUPER_ADMIN_EMAIL=admin@mahadev.local
SUPER_ADMIN_PASSWORD=ChangeMe@12345
```

---

### Database: manual scripts

- Schema script: `database/schema.sql`
- Seed script: `database/seed.sql`

**Notes**
- `seed.sql` seeds roles only; to create an admin user manually you need a bcrypt hash.
- Easiest admin setup: run backend seeder after setting `DATABASE_URL`:

```bash
cd backend
npm run seed
```

---

## Local run (step-by-step)

### Option A (recommended): Docker DB + run apps with Node

#### 1) Start Postgres

```bash
cd docker
docker compose up -d db
```

DB connection:
- host: `localhost`
- port: `5432`
- user: `postgres`
- password: `postgres`
- database: `courier_erp`

#### 2) Create schema manually

Using `psql`:

```bash
psql "postgresql://postgres:postgres@localhost:5432/courier_erp" -f database/schema.sql
psql "postgresql://postgres:postgres@localhost:5432/courier_erp" -f database/seed.sql
```

#### 3) Run backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Optional (creates roles + super admin with bcrypt):

```bash
cd backend
npm run seed
```

#### 4) Run frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open:
- `http://localhost:5173`

---

### Option B: Full Docker (db + backend + frontend)

```bash
cd docker
docker compose up -d --build
```

Then execute schema scripts against dockerized Postgres:

```bash
psql "postgresql://postgres:postgres@localhost:5432/courier_erp" -f database/schema.sql
psql "postgresql://postgres:postgres@localhost:5432/courier_erp" -f database/seed.sql
```

Open:
- UI: `http://localhost:5173`
- Swagger: `http://localhost:4000/api/v1/docs`

---

### Prisma on Windows note

If you run Prisma CLI commands manually, stop the backend dev server first (Windows can lock Prisma engine files).

---

### Deployment (summary)

See `docs/DEPLOYMENT.md`:
- Frontend: Cloudflare Pages (Vite build)
- Backend: Render (Node build/start)
- DB: Supabase Postgres

