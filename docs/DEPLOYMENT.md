## Deployment

### Frontend (Cloudflare Pages)

- **Framework preset**: Vite
- **Build command**: `npm --workspace frontend run build`
- **Build output directory**: `frontend/dist`
- **Environment variables** (Cloudflare Pages → Settings → Environment variables):
  - `VITE_API_URL` = your backend public URL + `/api/v1`
  - `VITE_SUPABASE_URL` (optional, future)
  - `VITE_SUPABASE_ANON_KEY` (optional, future)

### Backend (Render)

Create a **Web Service** from this repo.

- **Root directory**: `backend`
- **Build command**: `npm install --workspaces=false && npm run build`
- **Start command**: `npm run start`
- **Environment variables**:
  - `PORT` (Render sets it automatically; keep code reading it)
  - `DATABASE_URL` (Supabase/Postgres connection string)
  - `JWT_SECRET`
  - `SMS_PROVIDER` = `mock` | `fast2sms` | `msg91`
  - `SMS_API_KEY` (if not mock)
  - `SMS_SENDER_ID` (if not mock)

### Database (Supabase Postgres)

- Create project in Supabase
- Copy connection string to `DATABASE_URL`
- Run migrations + seed locally or in CI:

```bash
cd backend
npm run prisma:migrate
npm run seed
```

### Post-deploy smoke checks

- Backend Swagger: `GET /api/v1/docs`
- Health: `GET /api/v1/health`
- Login: `POST /api/v1/auth/login`

