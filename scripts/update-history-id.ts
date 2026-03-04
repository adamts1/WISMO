import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
  const { error } = await supabase
    .from('app_kv')
    .upsert({ key: 'gmail_last_history_id', value: '218337' }, { onConflict: 'key' });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  console.log('Updated gmail_last_history_id to 218337');
}

main();
