import type {
  DashboardStats,
  SessionsResponse,
  EmailsResponse,
  BlacklistResponse,
  BlacklistEntry,
  CustomerSession,
  ShopifyOrder,
  HumanHandlingResponse,
} from '@oytiot/shared';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  getDashboard(): Promise<DashboardStats> {
    return get('/dashboard');
  },

  getSessions(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<SessionsResponse> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return get(`/sessions${query}`);
  },

  closeSession(threadId: string): Promise<{ ok: boolean }> {
    return patch(`/sessions/${encodeURIComponent(threadId)}/close`);
  },

  getEmails(params?: { limit?: number; offset?: number }): Promise<EmailsResponse> {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return get(`/emails${query}`);
  },

  lookupOrder(q: string, type: 'name' | 'email' = 'name'): Promise<{ orders: ShopifyOrder[] }> {
    return get(`/orders/lookup?q=${encodeURIComponent(q)}&type=${type}`);
  },

  getBlacklist(params?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<BlacklistResponse> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return get(`/blacklist${query}`);
  },

  addBlacklistEntry(body: {
    type: 'email' | 'domain';
    value: string;
    reason?: string;
  }): Promise<BlacklistEntry> {
    return post('/blacklist', body);
  },

  removeBlacklistEntry(id: number): Promise<{ ok: boolean }> {
    return del(`/blacklist/${id}`);
  },

  getHumanHandling(params?: {
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<HumanHandlingResponse> {
    const qs = new URLSearchParams();
    if (params?.source) qs.set('source', params.source);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return get(`/human-handling${query}`);
  },
};
