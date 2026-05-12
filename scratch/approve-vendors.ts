import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVendors() {
  console.log('Checking vendor statuses in database...');
  
  const { data, error, count } = await supabase
    .from('vendors')
    .select('id, company_name, status', { count: 'exact' });

  if (error) {
    console.error('Error fetching vendors:', error);
    return;
  }

  console.log(`Total vendors found: ${count}`);
  
  const statusCounts = data.reduce((acc: any, v: any) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  console.log('Status breakdown:', statusCounts);

  if (statusCounts['pending'] > 0) {
    console.log('Found pending vendors. Approving them so they show up on the site...');
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ status: 'approved' })
      .eq('status', 'pending');
    
    if (updateError) {
      console.error('Error updating vendors:', updateError);
    } else {
      console.log('Successfully approved all pending vendors.');
    }
  } else {
    console.log('No pending vendors found. All vendors should already be visible if status is "approved".');
  }
}

checkVendors();
