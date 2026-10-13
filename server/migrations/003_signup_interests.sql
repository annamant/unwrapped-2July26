-- Optional broad interests chosen next to the signup "which shops?" step.
-- Safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signup_interests text[] NOT NULL DEFAULT '{}';
