import { supabaseAdmin } from './lib/supabase/admin';

async function checkBuckets() {
  const { data, error } = await supabaseAdmin.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Buckets:', JSON.stringify(data, null, 2));
}

checkBuckets();
