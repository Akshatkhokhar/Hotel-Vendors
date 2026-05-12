import { supabaseAdmin } from './lib/supabase/admin';

async function setupStorage() {
  console.log('Setting up storage...');
  
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucketName = 'vendor-assets';
  const exists = buckets.some(b => b.name === bucketName);

  if (!exists) {
    console.log(`Creating bucket: ${bucketName}`);
    const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Bucket created successfully:', data);
    }
  } else {
    console.log(`Bucket ${bucketName} already exists.`);
    
    // Ensure it's public
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, {
      public: true
    });
    if (updateError) console.error('Error updating bucket to public:', updateError);
    else console.log('Bucket ensured to be public.');
  }
}

setupStorage();
