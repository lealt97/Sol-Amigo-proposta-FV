const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles:", { data, error });
  const { data: d2, error: e2 } = await supabase.from('clients').select('*').limit(1);
  console.log("Clients:", { data: d2, error: e2 });
}
test();
