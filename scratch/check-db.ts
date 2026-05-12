import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '')

async function checkVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, company_name, status')
  
  if (error) {
    console.error('Error fetching vendors:', error)
  } else {
    console.log('Vendors in DB:', data)
  }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
  
  if (catError) {
    console.error('Error fetching categories:', catError)
  } else {
    console.log('Categories in DB:', categories)
  }
}

checkVendors()
