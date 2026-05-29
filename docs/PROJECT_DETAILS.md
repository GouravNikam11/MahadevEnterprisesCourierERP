## Mahadev Enterprises Courier ERP System — Project Details

### 1) What is this project?

**Mahadev Enterprises Courier ERP System** is a web-based Courier Management / ERP application used to manage:

- customer/account parties (clients)
- courier companies and tracking configuration
- pincodes / service areas (master data)
- booking entries (account bookings and cash bookings)
- courier status updates with a timeline history
- reports (daily bookings)
- users and role-based access (Admin/Super Admin controls)
- billing/invoicing (restricted to Super Admin)

It is built as a **monorepo** with a React frontend and an Express + Prisma backend.

---

### 2) Purpose / why this project exists

The purpose of the system is to **digitize and control day-to-day courier operations**:

- capture bookings in a consistent format (Account vs Cash)
- reduce manual register work and errors (pincode, parties, courier companies as masters)
- generate receipts/prints and exports for office work
- provide tracking links and customer communication (SMS where configured)
- keep an auditable timeline of status changes
- provide daily operational reporting
- restrict access by role so staff only sees what they should

---

### 3) Who will use it (roles)

Roles are enforced in the UI and API:

- **SUPER_ADMIN**: full access (including Billing + Settings)
- **ADMIN**: manages most operations + Users
- **OPERATOR**: performs masters + bookings + status + reports
- **STAFF**: mainly bookings + status + dashboard (limited)

Frontend RBAC is in `frontend/src/constants/rbac.ts` (menu visibility + URL protection).

---

### 4) What is included in this project (modules/features)

#### A) Authentication & session

- Login with email/password
- Access token + refresh token flow
- “Forgot password / Reset password / Change password”
- Route protection (`/app/*` requires login)

API (backend):

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`
- `GET  /api/v1/auth/me`

#### B) Masters

Masters keep your day-to-day entry clean and consistent.

- **Account Party**
  - Create/Edit/Delete (soft delete), Search, Pagination
  - API: `/api/v1/account-party`, `/api/v1/account-party/:id`
- **Courier Company**
  - Create/Edit/Delete, Search, Pagination
  - Tracking URL template supports placeholder like `{tracking_number}`
  - API: `/api/v1/courier-company`, `/api/v1/courier-company/:id`
- **Pincode Master**
  - Create/Edit/Delete, Search, Pagination
  - API: `/api/v1/pincode`, `/api/v1/pincode/:id`

#### C) Bookings (operations)

There are two booking flows.

- **Account Booking**
  - For account customers/parties
  - API: `GET/POST /api/v1/account-booking`, `PUT /api/v1/account-booking/:id`
- **Cash Booking**
  - For walk-in / cash customers
  - API: `GET/POST /api/v1/cash-booking`

Common operational outcomes:

- booking is saved in the database
- tracking link can be generated (based on courier company template)
- receipt/print and CSV export support exists in UI
- SMS attempt + logging can happen where mobile numbers exist (based on backend provider configuration)

#### D) Courier Status (timeline)

- Update courier/booking status
- View a complete timeline history for a booking

API:

- `POST /api/v1/status` (updates status and inserts timeline log; may attempt SMS + logs it)
- `GET  /api/v1/status/timeline?bookingType=account|cash&bookingId=<uuid>`

#### E) Reports

- Daily bookings report (starter report)

API:

- `GET /api/v1/reports/daily-bookings?date=YYYY-MM-DD`
- `GET /api/v1/reports/daily-bookings?date=YYYY-MM-DD&format=csv`

#### F) Users (Admin)

- Create user
- List users

API:

- `GET /api/v1/users`
- `POST /api/v1/users`

#### G) Billing / Invoicing (Super Admin only)

Billing is restricted to **SUPER_ADMIN** in both UI and API.

API:

- `GET  /api/v1/billing/preview`
- `POST /api/v1/billing/invoices`
- `GET  /api/v1/billing/invoices`
- `GET  /api/v1/billing/invoices/:id`
- `PUT  /api/v1/billing/invoices/:id`
- `DELETE /api/v1/billing/invoices/:id`
- `POST /api/v1/billing/invoices/:id/items`
- `PUT  /api/v1/billing/invoices/:id/items/:itemId`
- `DELETE /api/v1/billing/invoices/:id/items/:itemId`

#### H) Lookup endpoints (for dropdowns/search)

These power dropdowns and quick selectors in UI:

- `GET /api/v1/lookup/account-party`
- `GET /api/v1/lookup/courier-company`
- `GET /api/v1/lookup/pincode`

#### I) Health & documentation

- Health check: `GET /api/v1/health`
- Swagger API docs: `GET /api/v1/docs`

---

### 5) Menus / pages in the application (what user sees)

The current sidebar/navigation items (based on RBAC) are:

- **Dashboard** (Super Admin, Admin, Operator, Staff)
- **Account Party** (Super Admin, Admin, Operator)
- **Account Booking** (Super Admin, Admin, Operator, Staff)
- **Courier Company** (Super Admin, Admin, Operator)
- **Cash Booking** (Super Admin, Admin, Operator, Staff)
- **Pincode Master** (Super Admin, Admin, Operator)
- **Courier Status** (Super Admin, Admin, Operator, Staff)
- **Reports** (Super Admin, Admin, Operator)
- **Users** (Super Admin, Admin)
- **Billing** (Super Admin only)
- **Settings** (Super Admin only)

Other important screens:

- Login
- Forgot Password / Reset Password
- Change Password
- Unauthorized page (when user tries to access a URL outside their permissions)

---

### 6) How the system works (end-to-end flow)

#### Step 1: User login

- User logs in from the frontend (`/login`)
- Frontend calls backend login API
- Backend returns tokens + user info (role)
- Frontend stores session and starts allowing `/app/*` routes

#### Step 2: Prepare masters (one-time / occasional)

Before daily operations, admin/operator usually maintains:

- Account Parties
- Courier Companies (including tracking template)
- Pincode Master

This ensures booking entry stays fast and accurate.

#### Step 3: Create bookings (daily)

Depending on type:

- **Account Booking**: select Account Party and enter booking details
- **Cash Booking**: enter customer details directly

During booking:

- the system saves booking in database
- tracking link can be generated (if courier company template is present)
- receipt/print/export can be used for documentation
- optional SMS attempt can happen (configured by backend env)

#### Step 4: Update courier status & view timeline

When courier status changes (picked, in transit, delivered, etc.):

- operator/staff updates status in **Courier Status**
- the system stores the new status and adds a timeline record
- optional SMS attempt can be triggered, and the result is logged

#### Step 5: Reporting

At end of day:

- user runs **Daily Bookings** report
- downloads CSV if needed for accounts/management

#### Step 6: Billing (Super Admin)

Super Admin can:

- preview billable items
- generate invoices
- update/delete invoices and items

---

### 7) Architecture / technical overview (simple)

#### Frontend

- React + Vite + TypeScript
- Routes under `/app/*` guarded by:
  - authentication check (token present)
  - role check (RBAC per-path)
- Uses Axios for API calls
- Has PWA setup via `vite-plugin-pwa`

#### Backend

- Node.js + Express + TypeScript
- REST API under `/api/v1/*`
- Prisma ORM connected to Postgres (Supabase or local docker Postgres)
- Security/ops middleware: Helmet, CORS, rate limiting, logging
- Swagger docs automatically generated

---

### 8) Advantages / benefits of this project

- **Centralized operations**: masters + bookings + status + reports in one place
- **Faster entry**: dropdown lookups + consistent masters reduce mistakes
- **Role-based security**: menus and URLs restricted per role
- **Traceability**: status timeline keeps a history of changes
- **Automation support**: tracking link generation and SMS integration (where configured)
- **Exportable data**: CSV downloads and printable receipts support office workflows
- **Modern web stack**: easy deployment (frontend + backend separately), maintainable TypeScript codebase

---

### 9) How to run it (quick)

See:

- `docs/SETUP.md` (local setup)
- `docs/DEPLOYMENT.md` (Cloudflare Pages + Render + Supabase)

Common local URLs:

- Frontend: `http://localhost:5173`
- Backend base: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/v1/docs`
- Health: `http://localhost:4000/api/v1/health`

