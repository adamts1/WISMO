-- ============================================================
-- Migration 001: Initial schema for Oytiot WISMO
-- Run this once against your PostgreSQL database.
-- The customer_sessions table may already exist — the CREATE
-- uses IF NOT EXISTS to be safe.
-- ============================================================

-- Existing table (safe to re-run)
CREATE TABLE IF NOT EXISTS customer_sessions (
  id               SERIAL PRIMARY KEY,
  customer_email   VARCHAR NOT NULL,
  thread_id        VARCHAR UNIQUE NOT NULL,
  status           VARCHAR NOT NULL DEFAULT 'waiting_for_order_number',
  attempts         INTEGER NOT NULL DEFAULT 0,
  last_interaction TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_thread_id ON customer_sessions(thread_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_status ON customer_sessions(status);

-- New audit log table for admin dashboard
CREATE TABLE IF NOT EXISTS email_log (
  id                SERIAL PRIMARY KEY,
  thread_id         VARCHAR NOT NULL,
  sender_email      VARCHAR,
  subject           VARCHAR,
  ai_classification JSONB,
  route_taken       VARCHAR,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error             TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_log_thread_id   ON email_log(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_log_processed_at ON email_log(processed_at DESC);
