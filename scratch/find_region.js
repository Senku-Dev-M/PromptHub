const { Client } = require('pg');

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ca-central-1',
  'eu-north-1'
];

async function check() {
  console.log('Buscando la región correcta de tu base de datos Supabase...');
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.yzlgyonfrusqwjmdyqgv:mcgRsPtIIXpJx0ch@${host}:6543/postgres`;
    const client = new Client({
      connectionString: connectionString,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      console.log(`\n🎉 ¡CONECTADO CON ÉXITO A ${r}!`);
      await client.end();
      break;
    } catch (e) {
      console.log(`🔴 Región ${r}: [${e.code || 'NO_CODE'}] ${e.message || e}`);
    }
  }
  console.log('Prueba terminada.');
}

check();
