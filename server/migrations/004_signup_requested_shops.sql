-- Optional free-text shop names from signup ("shops you'd follow that aren't listed").
-- Safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signup_requested_shops text[] NOT NULL DEFAULT '{}';
