-- Mahadev Enterprises Courier ERP
-- PostgreSQL schema (manual execution)
-- Compatible with Supabase Postgres / standard Postgres

BEGIN;

-- UUID generator
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'BOOKED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'NOT_DELIVERED',
    'RETURNED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Masters / Auth
CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text,
  phone         text,
  password_hash text NOT NULL,
  status        user_status NOT NULL DEFAULT 'ACTIVE',
  role_id       uuid NOT NULL REFERENCES roles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Account Party
CREATE TABLE IF NOT EXISTS account_parties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  address     text,
  phone       text,
  gst_number  text,
  state       text,
  rate        numeric(12,2),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_account_parties_name ON account_parties(name);
CREATE INDEX IF NOT EXISTS idx_account_parties_phone ON account_parties(phone);
CREATE INDEX IF NOT EXISTS idx_account_parties_gst ON account_parties(gst_number);

-- Courier Company Master
CREATE TABLE IF NOT EXISTS courier_companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  tracking_url  text,
  support_phone text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_courier_companies_name ON courier_companies(name);

-- Pincode Master
CREATE TABLE IF NOT EXISTS pincodes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name  text NOT NULL,
  pincode    text NOT NULL,
  city       text,
  state      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_pincodes_pincode_area UNIQUE (pincode, area_name)
);
CREATE INDEX IF NOT EXISTS idx_pincodes_pincode ON pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_pincodes_area_name ON pincodes(area_name);

-- Bookings
CREATE TABLE IF NOT EXISTS account_bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date      timestamptz NOT NULL DEFAULT now(),
  account_party_id  uuid NOT NULL REFERENCES account_parties(id),
  customer_name     text NOT NULL,
  customer_phone    text,
  courier_company_id uuid NOT NULL REFERENCES courier_companies(id),
  courier_number    text NOT NULL,
  parcel_type       text,
  destination       text,
  weight            numeric(12,3),
  charges           numeric(12,2),
  status            booking_status NOT NULL DEFAULT 'BOOKED',
  remarks           text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_account_bookings_booking_date ON account_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_account_bookings_courier_number ON account_bookings(courier_number);
CREATE INDEX IF NOT EXISTS idx_account_bookings_status ON account_bookings(status);

CREATE TABLE IF NOT EXISTS cash_bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_date      timestamptz NOT NULL DEFAULT now(),
  from_name         text NOT NULL,
  to_name           text NOT NULL,
  mobile_number     text,
  location          text,
  pincode_id        uuid REFERENCES pincodes(id),
  courier_company_id uuid NOT NULL REFERENCES courier_companies(id),
  courier_number    text NOT NULL,
  weight            numeric(12,3),
  amount            numeric(12,2),
  status            booking_status NOT NULL DEFAULT 'BOOKED',
  remarks           text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX IF NOT EXISTS idx_cash_bookings_booking_date ON cash_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_cash_bookings_courier_number ON cash_bookings(courier_number);
CREATE INDEX IF NOT EXISTS idx_cash_bookings_status ON cash_bookings(status);

-- Status timeline
CREATE TABLE IF NOT EXISTS courier_status_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_booking_id uuid REFERENCES account_bookings(id) ON DELETE CASCADE,
  cash_booking_id    uuid REFERENCES cash_bookings(id) ON DELETE CASCADE,
  status             booking_status NOT NULL,
  remarks            text,
  occurred_at        timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_logs_occurred_at ON courier_status_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_status_logs_status ON courier_status_logs(status);

-- SMS logs
CREATE TABLE IF NOT EXISTS sms_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           text NOT NULL,
  to_phone           text NOT NULL,
  template           text,
  message            text NOT NULL,
  status             text NOT NULL,
  provider_msg_id    text,
  account_booking_id uuid REFERENCES account_bookings(id) ON DELETE SET NULL,
  cash_booking_id    uuid REFERENCES cash_bookings(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_phone ON sms_logs(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at);

COMMIT;

