import { query, queryOne } from '../db/postgres.js';
import type { CustomerSession, SessionStatus } from '@oytiot/shared';

export async function getSessionByThreadId(threadId: string): Promise<CustomerSession | null> {
  return queryOne<CustomerSession>(
    `SELECT id, customer_email, thread_id, status, attempts, last_interaction, created_at
     FROM customer_sessions
     WHERE thread_id = $1
     LIMIT 1`,
    [threadId],
  );
}

export async function createSession(
  customerEmail: string,
  threadId: string,
  status: SessionStatus = 'waiting_for_order_number',
): Promise<void> {
  await query(
    `INSERT INTO customer_sessions (customer_email, thread_id, status, last_interaction)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (thread_id) DO UPDATE
       SET last_interaction = EXCLUDED.last_interaction,
           status = EXCLUDED.status`,
    [customerEmail, threadId, status],
  );
}

export async function updateSessionStatus(
  threadId: string,
  status: SessionStatus,
): Promise<void> {
  await query(
    `UPDATE customer_sessions
     SET status = $1, last_interaction = NOW()
     WHERE thread_id = $2`,
    [status, threadId],
  );
}

export async function incrementAttempts(threadId: string): Promise<void> {
  await query(
    `UPDATE customer_sessions
     SET attempts = COALESCE(attempts, 0) + 1, last_interaction = NOW()
     WHERE thread_id = $1`,
    [threadId],
  );
}

export async function closeSession(threadId: string): Promise<void> {
  await query(
    `UPDATE customer_sessions
     SET status = 'close', last_interaction = NOW()
     WHERE thread_id = $1`,
    [threadId],
  );
}

// ── Admin API queries ──────────────────────────────────────────────────────

export async function listSessions(params: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: CustomerSession[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.status) {
    conditions.push(`status = $${idx++}`);
    values.push(params.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const [sessions, countRows] = await Promise.all([
    query<CustomerSession>(
      `SELECT * FROM customer_sessions ${where} ORDER BY last_interaction DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM customer_sessions ${where}`,
      values,
    ),
  ]);

  return { sessions, total: parseInt(countRows[0]?.count ?? '0', 10) };
}
