-- Seed roles + super admin (manual)
-- NOTE: You must provide a bcrypt hash for password_hash OR run backend seed script.

BEGIN;

INSERT INTO roles (name, description)
VALUES
  ('SUPER_ADMIN', 'Super Admin'),
  ('ADMIN', 'Admin'),
  ('OPERATOR', 'Operator'),
  ('STAFF', 'Staff')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Example: create user (replace email + password_hash)
-- Password hashing: use backend `npm run seed` OR generate bcrypt hash elsewhere.
-- INSERT INTO users (email, name, password_hash, status, role_id)
-- SELECT
--   'admin@mahadev.local',
--   'Super Admin',
--   '$2b$12$REPLACE_WITH_BCRYPT_HASH',
--   'ACTIVE',
--   r.id
-- FROM roles r
-- WHERE r.name = 'SUPER_ADMIN'
-- ON CONFLICT (email) DO NOTHING;

COMMIT;

