require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url.replace(/\/rest\/v1\/?$/, ''), key);
async function run() {
  const { data, error } = await supabase.from('proposals').select('*').limit(1);
  if (error) {
    console.log('Select Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Available columns in proposals:', Object.keys(data[0]));
  } else {
    console.log('No proposal rows found.');
  }
  
  const { error: updateError } = await supabase
    .from('proposals')
    .update({ pdf_storage_path: 'test.pdf' })
    .eq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Update pdf_storage_path error:', updateError);
}
run();
