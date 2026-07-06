require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url.replace(/\/rest\/v1\/?$/, ''), key);
async function run() {
  const { data, error } = await supabase.from('proposals').select('*').limit(1);
  console.log('Error:', error);
}
run();
