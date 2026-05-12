const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncLogos() {
  try {
    const sampleData = JSON.parse(fs.readFileSync('vendors.sample.json', 'utf8'));
    const { data: dbVendors, error } = await supabase.from('vendors').select('id, company_name, logo_url');
    
    if (error) throw error;

    console.log(`Total in DB: ${dbVendors.length}`);
    console.log(`Total in Sample: ${sampleData.length}`);

    let updatedCount = 0;
    let missingInSample = 0;
    let locationSvgCount = 0;

    for (const dbVendor of dbVendors) {
      const match = sampleData.find(s => s.company_name.trim().toLowerCase() === dbVendor.company_name.trim().toLowerCase());
      
      if (!match) {
        missingInSample++;
        continue;
      }

      if (match.logo_url && match.logo_url.includes('location.svg')) {
        locationSvgCount++;
      }

      // If we find a match in the sample file that has a valid logo URL
      if (match && match.logo_url) {
        // Even if it's location.svg, let's see what's in DB
        if (dbVendor.logo_url !== match.logo_url) {
          const { error: updateError } = await supabase
            .from('vendors')
            .update({ logo_url: match.logo_url })
            .eq('id', dbVendor.id);
            
          if (updateError) {
            console.error(`Error updating ${dbVendor.company_name}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }
    }
    console.log(`Successfully synchronized ${updatedCount} logos.`);
    console.log(`Missing in Sample: ${missingInSample}`);
    console.log(`Location SVG in Sample: ${locationSvgCount}`);
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

syncLogos();
