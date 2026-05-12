import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '')

async function checkLocations() {
  const { data, error, count } = await supabase
    .from('vendor_locations')
    .select('*', { count: 'exact' })
    .limit(5)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Location count:', count)
    console.log('Sample locations:', data)
  }
}

checkLocations()
