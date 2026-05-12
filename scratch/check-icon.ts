import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '')

async function checkIcon() {
  const { data, error } = await supabase
    .from('categories')
    .select('icon')
    .limit(1)
  
  if (error) {
    console.error('Error selecting icon:', error)
  } else {
    console.log('Successfully selected icon')
  }
}

checkIcon()
