-- ============================================================
-- Migration 004: Human Handling Log
-- Tracks escalations to human support from both WISMO and
-- open-session processors.
-- ============================================================

CREATE TABLE IF NOT EXISTS human_handling (
  id            SERIAL PRIMARY KEY,
  thread_id     VARCHAR NOT NULL,
  sender_email  VARCHAR,
  subject       VARCHAR,
  reason        TEXT NOT NULL,
  source        VARCHAR NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_human_handling_thread_id  ON human_handling(thread_id);
CREATE INDEX IF NOT EXISTS idx_human_handling_created_at ON human_handling(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_human_handling_source     ON human_handling(source);
