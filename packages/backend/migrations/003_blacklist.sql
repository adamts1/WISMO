-- Migration 003: Blacklist table for email/domain blocking
CREATE TABLE IF NOT EXISTS blacklist (
  id         SERIAL PRIMARY KEY,
  type       VARCHAR NOT NULL CHECK (type IN ('email', 'domain')),
  value      VARCHAR NOT NULL,
  reason     VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type, value)
);

CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);
