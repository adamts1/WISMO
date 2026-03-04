-- Migration 002: Add language column to customer_sessions
ALTER TABLE customer_sessions
  ADD COLUMN IF NOT EXISTS language VARCHAR NOT NULL DEFAULT 'en';
