import { query } from '../db/postgres.js';
import type { HumanHandlingEntry } from '@oytiot/shared';

export async function logHumanHandling(entry: {
  thread_id: string;
  sender_email?: string;
  subject?: string;
  reason: string;
  source: 'wismo' | 'open_session';
}): Promise<void> {
  try {
    await query(
      `INSERT INTO human_handling (thread_id, sender_email, subject, reason, source)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.thread_id,
        entry.sender_email ?? null,
        entry.subject ?? null,
        entry.reason,
        entry.source,
      ],
    );
  } catch (err) {
    console.error('Failed to write human_handling entry:', err);
  }
}

export async function listHumanHandling(params: {
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: HumanHandlingEntry[]; total: number }> {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.source) {
    conditions.push(`source = $${idx++}`);
    values.push(params.source);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [entries, countRows] = await Promise.all([
    query<HumanHandlingEntry>(
      `SELECT * FROM human_handling ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM human_handling ${where}`,
      values,
    ),
  ]);

  return { entries, total: parseInt(countRows[0]?.count ?? '0', 10) };
}
