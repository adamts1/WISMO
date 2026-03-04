import { supabase } from '../db/supabase.js';
import { query } from '../db/postgres.js';

const TABLE = 'app_kv';

export async function storageGet(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return String(data.value);
}

export async function storageSet(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) throw new Error(`storageSet failed for key "${key}": ${error.message}`);
}

/**
 * Atomically claim a key. Returns true if this caller got the claim (first),
 * false if another caller already claimed it (idempotency / dedup guard).
 * Uses raw SQL INSERT … ON CONFLICT DO NOTHING RETURNING so there is no
 * race condition and no dependency on Supabase error-code formatting.
 */
export async function storageClaim(key: string): Promise<boolean> {
  const rows = await query<{ key: string }>(
    `INSERT INTO app_kv (key, value) VALUES ($1, '1') ON CONFLICT DO NOTHING RETURNING key`,
    [key],
  );
  return rows.length > 0; // true = we inserted (claimed); false = already existed
}
