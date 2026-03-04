import type { CustomerSession } from './session.types.js';

export interface EmailLogEntry {
  id: number;
  thread_id: string;
  sender_email: string | null;
  subject: string | null;
  ai_classification: Record<string, unknown> | null;
  route_taken: string | null;
  processed_at: string;
  error: string | null;
}

export interface DashboardStats {
  active_sessions: number;
  emails_today: number;
  errors_today: number;
  last_history_id: string;
}

export interface SessionsResponse {
  sessions: CustomerSession[];
  total: number;
}

export interface EmailsResponse {
  emails: EmailLogEntry[];
  total: number;
}
