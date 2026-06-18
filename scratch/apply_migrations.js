const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Instalando módulo "pg" para conectarse a PostgreSQL...');
try {
  execSync('npm install pg', { stdio: 'inherit' });
} catch (e) {
  console.error('Fallo la instalación de pg, reintentando con pnpm...');
  execSync('pnpm add -D pg', { stdio: 'inherit' });
}

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.yzlgyonfrusqwjmdyqgv:98PF6dc5UKDXFkQi@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260618000000_initial_schema.sql');

async function run() {
  console.log('Leyendo archivo de migración...');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Conectándose a Supabase PostgreSQL...');
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado con éxito. Ejecutando scripts de migración...');
    
    // Ejecutar todo el SQL en una transacción
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('¡Migración aplicada con éxito en la nube de Supabase!');
  } catch (err) {
    console.error('Error durante la ejecución de la migración:', err);
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Error al hacer rollback:', rbErr);
    }
  } finally {
    await client.end();
    console.log('Conexión cerrada.');
  }
}

run();
