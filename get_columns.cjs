require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url.replace(/\/rest\/v1\/?$/, ''), key);

async function run() {
  const { data, error } = await supabase.from('pdf_templates').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No data, try insert and fail to see columns");
    const { error: e2 } = await supabase.from('pdf_templates').insert({}).select();
    console.log(e2);
  }
}
run();
