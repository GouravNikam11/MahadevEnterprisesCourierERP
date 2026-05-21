# Mahadev Enterprises Courier ERP System

Monorepo for Mahadev Enterprises Courier ERP.

## Repo layout

- `frontend/`: React + Vite + TypeScript + Tailwind + shadcn/ui
- `backend/`: Node.js + Express + TypeScript + Prisma + Swagger
- `database/`: schema, seeds, migrations (Prisma lives in backend initially)
- `docs/`: architecture, setup, deployment notes
- `docker/`: local docker-compose and Dockerfiles

## Prerequisites

- Node.js LTS
- npm (or pnpm/yarn)

## Quick start (local dev)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Environment variables

- Frontend env lives in `frontend/.env.example`
- Backend env lives in `backend/.env.example`

