const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer manualmente .env.local
const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('\n--- Probando lectura de Categorías ---');
  const { data: catData, error: catError } = await supabase.from('categories').select('*');
  console.log('Categorías leídas:', catData ? catData.length : 0);
  if (catError) console.error('Error Categorías:', catError);
  else console.log('Categorías:', catData);

  console.log('\n--- Probando lectura de Perfiles ---');
  const { data: profData, error: profError } = await supabase.from('profiles').select('*');
  console.log('Perfiles leídos:', profData ? profData.length : 0);
  if (profError) console.error('Error Perfiles:', profError);
  else console.log('Perfiles:', profData);
}

test();
