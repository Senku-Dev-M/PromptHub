const dns = require('dns');

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
  'eu-north-1',
  'me-central-1'
];

async function check() {
  console.log('Probando resolución de nombres de poolers de Supabase...');
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    try {
      await new Promise((resolve, reject) => {
        dns.lookup(host, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      console.log(`✅ ¡Encontrado! El host de pooler existe para la región: ${r} (${host})`);
    } catch (e) {
      // Ignorar fallos de resolución
    }
  }
  console.log('Prueba terminada.');
}

check();
