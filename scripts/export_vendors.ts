import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportVendors() {
  console.log('Fetching all vendors from database...');
  
  // 1. Fetch all vendors
  const { data: vendors, error: vendorError, count } = await supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('status', 'approved');

  if (vendorError) {
    console.error('Error fetching vendors:', vendorError);
    return;
  }

  console.log(`Found ${count} approved vendors.`);

  const vendorIds = vendors.map(v => v.id);

  // 2. Fetch all locations for these vendors
  const { data: locations, error: locError } = await supabase
    .from('vendor_locations')
    .select('*')
    .in('vendor_id', vendorIds);

  if (locError) console.error('Error fetching locations:', locError);

  // 3. Fetch all contacts for these vendors
  const { data: contacts, error: contactError } = await supabase
    .from('vendor_contacts')
    .select('*')
    .in('vendor_id', vendorIds);

  if (contactError) console.error('Error fetching contacts:', contactError);

  // 4. Fetch all categories for these vendors
  const { data: vendorCategories, error: catError } = await supabase
    .from('vendor_categories')
    .select(`
      vendor_id,
      categories(id, name, slug)
    `)
    .in('vendor_id', vendorIds);

  if (catError) console.error('Error fetching categories:', catError);

  // 5. Transform and combine data
  const fullVendors = vendors.map(vendor => {
    const vLocations = locations?.filter(l => l.vendor_id === vendor.id) || [];
    const vContacts = contacts?.filter(c => c.vendor_id === vendor.id) || [];
    const vCategories = vendorCategories
      ?.filter(vc => vc.vendor_id === vendor.id)
      ?.map(vc => vc.categories) || [];

    return {
      ...vendor,
      locations: vLocations,
      contacts: vContacts,
      categories: vCategories
    };
  });

  const outputPath = path.resolve(process.cwd(), 'all_vendors.json');
  fs.writeFileSync(outputPath, JSON.stringify(fullVendors, null, 2));
  
  console.log(`Successfully exported ${fullVendors.length} vendors to ${outputPath}`);
}

exportVendors();
