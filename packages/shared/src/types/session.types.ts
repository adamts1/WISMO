export type SessionStatus =
  | 'waiting_for_order_number'
  | 'searching'
  | 'close';

export interface CustomerSession {
  id: number;
  customer_email: string;
  thread_id: string;
  status: SessionStatus;
  attempts: number;
  last_interaction: string;
  created_at: string;
}

export type SessionRoute =
  | 'searchOrder'
  | 'guideMail'
  | 'needHumanSupport'
  | 'onlyReply';
