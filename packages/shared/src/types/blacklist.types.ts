export type BlacklistType = 'email' | 'domain';

export interface BlacklistEntry {
  id: number;
  type: BlacklistType;
  value: string;
  reason: string | null;
  created_at: string;
}

export interface BlacklistResponse {
  entries: BlacklistEntry[];
  total: number;
}
