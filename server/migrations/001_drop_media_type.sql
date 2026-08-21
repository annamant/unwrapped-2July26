-- Additive: short-clip media type for drop photos/videos (Phase 1 white paper).
-- Safe to re-run.
DO $$ BEGIN
  CREATE TYPE drop_media_type AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE drops
  ADD COLUMN IF NOT EXISTS media_type drop_media_type NOT NULL DEFAULT 'image';
