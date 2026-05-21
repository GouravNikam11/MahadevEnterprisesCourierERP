## Local setup

### 1) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3) Database (Supabase Postgres)

- Create a Supabase project
- Copy the Postgres connection string into `backend/.env` as `DATABASE_URL`

### 4) Local Postgres with Docker (optional)

```bash
cd docker
docker compose up -d
```

Then set `DATABASE_URL` like:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/courier_erp?schema=public
```

Run Prisma:

```bash
cd backend
npm run prisma:migrate
npm run seed
```

