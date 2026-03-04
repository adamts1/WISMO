import { query } from '../db/postgres.js';
import type { EmailLogEntry } from '@oytiot/shared';

export async function logEmail(entry: {
  thread_id: string;
  sender_email?: string;
  subject?: string;
  ai_classification?: Record<string, unknown>;
  route_taken?: string;
  error?: string;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO email_log (thread_id, sender_email, subject, ai_classification, route_taken, error)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.thread_id,
        entry.sender_email ?? null,
        entry.subject ?? null,
        entry.ai_classification ? JSON.stringify(entry.ai_classification) : null,
        entry.route_taken ?? null,
        entry.error ?? null,
      ],
    );
  } catch (err) {
    // Never let logging failures break the main flow
    console.error('Failed to write email_log entry:', err);
  }
}

export async function listEmailLogs(params: {
  limit?: number;
  offset?: number;
}): Promise<{ emails: EmailLogEntry[]; total: number }> {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const [emails, countRows] = await Promise.all([
    query<EmailLogEntry>(
      `SELECT * FROM email_log ORDER BY processed_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM email_log`),
  ]);

  return { emails, total: parseInt(countRows[0]?.count ?? '0', 10) };
}

export async function getDashboardStats(): Promise<{
  active_sessions: number;
  emails_today: number;
  errors_today: number;
}> {
  const [sessionsRows, emailsRows, errorsRows] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM customer_sessions WHERE status != 'close'`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM email_log WHERE processed_at >= NOW() - INTERVAL '24 hours'`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM email_log WHERE error IS NOT NULL AND processed_at >= NOW() - INTERVAL '24 hours'`,
    ),
  ]);

  return {
    active_sessions: parseInt(sessionsRows[0]?.count ?? '0', 10),
    emails_today: parseInt(emailsRows[0]?.count ?? '0', 10),
    errors_today: parseInt(errorsRows[0]?.count ?? '0', 10),
  };
}
