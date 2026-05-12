import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import type { ScrapedVendor } from '../types';

// ─── Supabase Admin Client (service role, bypasses RLS) ───
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing env vars. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── US State Abbreviation Map ───
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  'puerto rico': 'PR', 'guam': 'GU', 'virgin islands': 'VI',
};

// ─── Helpers ───

function parseLocation(locationStr: string): { city: string; state: string; stateAbbr: string } {
  if (!locationStr) return { city: '', state: '', stateAbbr: '' };

  const lastComma = locationStr.lastIndexOf(',');
  if (lastComma === -1) {
    return { city: locationStr.trim(), state: '', stateAbbr: '' };
  }

  const city = locationStr.slice(0, lastComma).trim();
  const state = locationStr.slice(lastComma + 1).trim();
  const stateAbbr = STATE_ABBREVIATIONS[state.toLowerCase()] || '';

  return { city, state, stateAbbr };
}

function cleanContactName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\s+/g, ' ').trim();
}

function isPlaceholderLogo(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.includes('admin_assets/img/location.svg');
}

async function generateUniqueSlug(companyName: string): Promise<string> {
  const base = slugify(companyName, { lower: true, strict: true, trim: true });
  let slug = base;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('vendors')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

// ─── Main Seed Function ───

async function seedVendors() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  HotelVendors.com — Vendor Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Read vendors.json
  const filePath = resolve(process.cwd(), 'vendors.json');
  let rawVendors: ScrapedVendor[];
  try {
    const raw = readFileSync(filePath, 'utf-8');
    rawVendors = JSON.parse(raw);
  } catch (err: any) {
    console.error(`❌ Could not read vendors.json at ${filePath}`);
    console.error(err.message);
    process.exit(1);
  }

  if (!Array.isArray(rawVendors)) {
    console.error('❌ vendors.json must be a JSON array');
    process.exit(1);
  }

  console.log(`\n📂 Loaded ${rawVendors.length} vendors from vendors.json\n`);

  const stats = { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  const errorLog = [];

  for (let i = 0; i < rawVendors.length; i++) {
    const raw = rawVendors[i];

    // ── Skip if no company_name ──
    if (!raw.company_name || !raw.company_name.trim()) {
      stats.skipped++;
      continue;
    }

    const companyName = raw.company_name.trim();

    try {
      // ── Check if vendor already exists ──
      const { data: existing } = await supabase
        .from('vendors')
        .select('id')
        .eq('company_name', companyName)
        .maybeSingle();

      const isUpdate = !!existing;

      // ── Parse fields ──
      const { city, state, stateAbbr } = parseLocation(raw.location);
      const contactName = cleanContactName(raw.contact_name);
      const logoUrl = isPlaceholderLogo(raw.logo_url) ? null : raw.logo_url;
      const phone = raw.phone?.trim() || null;

      let vendorId;

      if (isUpdate) {
        // Update existing vendor
        vendorId = existing.id;
        await supabase
          .from('vendors')
          .update({
            logo_url: logoUrl,
            source: 'scraped',
            status: 'approved',
          })
          .eq('id', vendorId);

        stats.updated++;
      } else {
        // Generate slug and insert new vendor
        const slug = await generateUniqueSlug(companyName);

        const { data: vendorData, error: vendorErr } = await supabase
          .from('vendors')
          .insert({
            company_name: companyName,
            slug,
            logo_url: logoUrl,
            status: 'approved',
            source: 'scraped',
            is_featured: false,
          })
          .select('id')
          .single();

        if (vendorErr) throw vendorErr;
        vendorId = vendorData.id;
        stats.inserted++;
      }

      // ── Upsert location ──
      if (city || state) {
        // Delete existing primary location then re-insert to keep it clean on re-runs
        await supabase
          .from('vendor_locations')
          .delete()
          .eq('vendor_id', vendorId)
          .eq('is_primary', true);

        await supabase.from('vendor_locations').insert({
          vendor_id: vendorId,
          city,
          state,
          state_abbreviation: stateAbbr || null,
          country: 'United States',
          is_primary: true,
        });
      }

      // ── Upsert contact ──
      if (contactName || phone) {
        await supabase
          .from('vendor_contacts')
          .delete()
          .eq('vendor_id', vendorId)
          .eq('is_primary', true);

        await supabase.from('vendor_contacts').insert({
          vendor_id: vendorId,
          contact_name: contactName || null,
          phone: phone || null,
          is_primary: true,
        });
      }

      // ── Progress log every 50 vendors ──
      if ((i + 1) % 50 === 0) {
        console.log(`  ⏳ Progress: ${i + 1} / ${rawVendors.length} processed`);
      }
    } catch (err: any) {
      stats.errors++;
      errorLog.push({ company_name: companyName, error: err.message });
    }
  }

  // ── Final Summary ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SEED COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total in file:  ${rawVendors.length}`);
  console.log(`  ✅ Inserted:    ${stats.inserted}`);
  console.log(`  🔄 Updated:     ${stats.updated}`);
  console.log(`  ⏭️  Skipped:     ${stats.skipped} (no company name)`);
  console.log(`  ❌ Errors:      ${stats.errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errorLog.length > 0) {
    console.log('Error details:');
    errorLog.forEach((e, idx) => console.log(`  ${idx + 1}. ${e.company_name}: ${e.error}`));
    console.log('');
  }
}

seedVendors().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
