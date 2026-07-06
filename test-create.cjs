require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url.replace(/\/rest\/v1\/?$/, ''), key);

async function run() {
  const { data: clients } = await supabase.from('clients').select('id').limit(1);
  const clientId = clients[0].id;
  
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const userId = users[0].id;

  const formattedData = {
    user_id: userId,
    client_id: clientId,
    title: 'Test Create',
    status: 'draft',
    monthly_consumption_kwh: 500
  };

  const { data, error } = await supabase
    .from('proposals')
    .insert([formattedData])
    .select()
    .single();

  console.log('Result:', data, 'Error:', error);
}
run();
