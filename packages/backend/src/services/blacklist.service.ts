import { query, queryOne } from '../db/postgres.js';
import { env } from '../config/env.js';
import type { BlacklistEntry } from '@oytiot/shared';

// ── Hardcoded fallback (always checked first) ───────────────────────────

const BLOCKED_DOMAINS = ['info.printful.com'];

function getBlockedEmails(): string[] {
  return [
    'tsityat.ai.agency@gmail.com',
    env.EMAIL_TEST,
    env.EMAIL_PROD,
  ].filter((e): e is string => Boolean(e));
}

// ── Blacklist check (hardcoded + DB) ────────────────────────────────────

export async function isBlacklisted(senderEmail: string, senderDomain: string): Promise<boolean> {
  const email = senderEmail.toLowerCase();
  const domain = senderDomain.toLowerCase();

  // 1. Hardcoded check (fast, no DB)
  if (
    getBlockedEmails().includes(email) ||
    BLOCKED_DOMAINS.includes(domain)
  ) {
    return true;
  }

  // 2. Database check
  const row = await queryOne<{ id: number }>(
    `SELECT id FROM blacklist
     WHERE (type = 'email' AND value = $1)
        OR (type = 'domain' AND value = $2)
     LIMIT 1`,
    [email, domain],
  );

  return row !== null;
}

// ── Admin CRUD ──────────────────────────────────────────────────────────

export async function listBlacklistEntries(params: {
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: BlacklistEntry[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.type) {
    conditions.push(`type = $${idx++}`);
    values.push(params.type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const countValues = [...values];
  const queryValues = [...values, limit, offset];

  const [entries, countRows] = await Promise.all([
    query<BlacklistEntry>(
      `SELECT * FROM blacklist ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      queryValues,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM blacklist ${where}`,
      countValues,
    ),
  ]);

  return { entries, total: parseInt(countRows[0]?.count ?? '0', 10) };
}

export async function addBlacklistEntry(
  type: 'email' | 'domain',
  value: string,
  reason?: string,
): Promise<BlacklistEntry> {
  const rows = await query<BlacklistEntry>(
    `INSERT INTO blacklist (type, value, reason)
     VALUES ($1, $2, $3)
     ON CONFLICT (type, value) DO NOTHING
     RETURNING *`,
    [type, value.toLowerCase(), reason ?? null],
  );

  if (!rows[0]) {
    throw new Error(`Entry already exists: ${type} "${value}"`);
  }

  return rows[0];
}

export async function removeBlacklistEntry(id: number): Promise<void> {
  await query(`DELETE FROM blacklist WHERE id = $1`, [id]);
}
