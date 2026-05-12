import { createClient } from '@supabase/supabase-js';

// ─── Supabase Admin Client ───
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing env vars. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Keyword → Category Slug Mapping ───
// Each entry: [array of keywords (lowercase), category_slug]
const KEYWORD_MAP: [string[], string][] = [
  [['insurance', 'risk', 'compliance'], 'safety-security'],
  [['linen', 'laundry', 'unimac', 'textile', 'towel', 'bedding'], 'linen-bedding'],
  [['furniture', 'ff&e', 'décor', 'decor', 'mattress', 'seating'], 'furniture-fixtures'],
  [['tech', 'software', 'pms', 'cloud', 'digital', 'wifi', 'internet', 'broadband'], 'technology-av'],
  [['food', 'catering', 'inspire brands', 'restaurant', 'kitchen', 'dining'], 'food-catering'],
  [['water', 'plumbing', 'cleaning', 'janitorial', 'sanitation', 'hvac'], 'cleaning-supplies'],
  [['lock', 'security', 'dormakaba', 'surveillance', 'camera', 'alarm', 'fire', 'safe'], 'safety-security'],
  [['coffee', 'beverage', 'drink', 'tea', 'vending'], 'coffee-beverages'],
  [['amenities', 'toiletries', 'soap', 'shampoo', 'bath', 'dispenser'], 'toiletries-amenities'],
  [['accounting', 'payroll', 'adp', 'm3', 'financial', 'tax', 'bookkeeping'], 'financial-services'],
  [['paint', 'flooring', 'carpet', 'renovation', 'remodel'], 'renovation-supplies'],
  [['signage', 'sign', 'printing', 'branding', 'marketing'], 'marketing-services'],
  [['pest', 'exterminator'], 'pest-control'],
  [['pool', 'spa', 'fitness', 'gym', 'equipment'], 'fitness-recreation'],
  [['uniform', 'apparel', 'workwear'], 'uniforms-apparel'],
];

// ─── Main ───

async function categorizeVendors() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  HotelVendors.com — Auto-Categorization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1 — Load all categories from DB and build slug→id map
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, slug');

  if (catErr) {
    console.error('❌ Could not fetch categories:', catErr.message);
    process.exit(1);
  }

  const categoryMap = new Map<string, string>();
  categories?.forEach((c) => categoryMap.set(c.slug, c.id));

  console.log(`\n📂 Loaded ${categories?.length || 0} categories from DB`);

  // Validate that all slugs referenced in KEYWORD_MAP exist
  const missingSlugs = new Set<string>();
  KEYWORD_MAP.forEach(([, slug]) => {
    if (!categoryMap.has(slug)) missingSlugs.add(slug);
  });

  if (missingSlugs.size > 0) {
    console.warn(`\n⚠️  These category slugs from the keyword map do NOT exist in DB yet:`);
    missingSlugs.forEach((s) => console.warn(`   • ${s}`));
    console.warn('   Vendors matching these keywords will be skipped.\n');
  }

  // Step 2 — Load all vendors
  const { data: vendors, error: vendErr } = await supabase
    .from('vendors')
    .select('id, company_name');

  if (vendErr) {
    console.error('❌ Could not fetch vendors:', vendErr.message);
    process.exit(1);
  }

  console.log(`📂 Loaded ${vendors.length} vendors from DB\n`);

  let categorized = 0;
  let skipped = 0;
  let errors = 0;
  let alreadyDone = 0;

  for (const vendor of vendors) {
    const nameLower = vendor.company_name.toLowerCase();

    // Find all matching category slugs
    const matchedSlugs = new Set();
    for (const [keywords, slug] of KEYWORD_MAP) {
      for (const kw of keywords) {
        if (nameLower.includes(kw)) {
          matchedSlugs.add(slug);
          break; // one keyword match per rule is enough
        }
      }
    }

    if (matchedSlugs.size === 0) {
      skipped++;
      continue;
    }

    // Resolve slugs to IDs, skipping missing ones
    const categoryIds: string[] = [];
    for (const slug of matchedSlugs) {
      const id = categoryMap.get(slug as string);
      if (id) categoryIds.push(id);
    }

    if (categoryIds.length === 0) {
      skipped++;
      continue;
    }

    try {
      // Check for existing associations to avoid duplicates
      const { data: existingAssocs } = await supabase
        .from('vendor_categories')
        .select('category_id')
        .eq('vendor_id', vendor.id);

      const existingIds = new Set((existingAssocs || []).map((a) => a.category_id));
      const newIds = categoryIds.filter((id) => !existingIds.has(id));

      if (newIds.length === 0) {
        alreadyDone++;
        continue;
      }

      await supabase.from('vendor_categories').insert(
        newIds.map((category_id) => ({
          vendor_id: vendor.id,
          category_id,
        }))
      );

      categorized++;
    } catch (err: any) {
      errors++;
      console.error(`  ❌ Error for "${vendor.company_name}": ${err.message}`);
    }
  }

  // ── Summary ──
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CATEGORIZATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total vendors:          ${vendors.length}`);
  console.log(`  ✅ Newly categorized:   ${categorized}`);
  console.log(`  ⏭️  Already categorized: ${alreadyDone}`);
  console.log(`  🔍 No match (skipped):  ${skipped}`);
  console.log(`  ❌ Errors:              ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

categorizeVendors().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
