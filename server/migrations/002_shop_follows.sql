-- Follow curated directory pins before a shop has a business row,
-- then attach those follows when the shop claims or joins.
-- Safe to re-run.

ALTER TABLE follows
  ALTER COLUMN business_id DROP NOT NULL;

ALTER TABLE follows
  ADD COLUMN IF NOT EXISTS directory_pin_id text;

ALTER TABLE follows
  ADD COLUMN IF NOT EXISTS requested_at_signup boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE follows
    ADD CONSTRAINT follows_target_present
    CHECK (business_id IS NOT NULL OR directory_pin_id IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS follows_user_pin_unique
  ON follows (user_id, directory_pin_id)
  WHERE directory_pin_id IS NOT NULL;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS directory_pin_id text;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_directory_pin_unique
  ON businesses (directory_pin_id)
  WHERE directory_pin_id IS NOT NULL;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS drop_alerts_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS drop_alert_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS drop_alert_sends_drop_user_unique
  ON drop_alert_sends (drop_id, user_id);
