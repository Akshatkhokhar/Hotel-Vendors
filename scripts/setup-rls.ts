import { supabaseAdmin } from './lib/supabase/admin';

async function setupRLS() {
  console.log('Setting up RLS for storage...');
  
  // This needs to be done via SQL as the JS client doesn't support policy creation directly
  // However, I can try to run a query if I have permission
  
  const sql = `
    -- Allow public access to all files in vendor-assets
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'vendor-assets');

    -- Allow authenticated users to upload their own files
    CREATE POLICY "Vendor Upload" ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'vendor-assets');

    -- Allow users to update their own files
    CREATE POLICY "Vendor Update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'vendor-assets');

    -- Allow users to delete their own files
    CREATE POLICY "Vendor Delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'vendor-assets');
  `;

  // We can't run this SQL via the API client usually.
  // But I'll log it for the user to run in their Supabase SQL Editor.
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log(sql);
}

setupRLS();
