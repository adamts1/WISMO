export type HumanHandlingSource = 'wismo' | 'open_session';

export interface HumanHandlingEntry {
  id: number;
  thread_id: string;
  sender_email: string | null;
  subject: string | null;
  reason: string;
  source: HumanHandlingSource;
  created_at: string;
}

export interface HumanHandlingResponse {
  entries: HumanHandlingEntry[];
  total: number;
}
