const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("pdf_cover_templates:", await supabase.from('pdf_cover_templates').select('*').limit(1));
}
test();
