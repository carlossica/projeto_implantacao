// Garante que o banco-alvo (POSTGRES_DB) exista no servidor. Conecta numa base
// de manutenção, verifica e cria se faltar. Idempotente. Uso: node src/db/ensure-db.js
import pg from 'pg';
import { config } from '../config.js';

const alvo = config.postgres.database;
const candidatasManutencao = ['postgres', config.postgres.user, 'template1'];

async function tentarConectar(database) {
  const client = new pg.Client({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database,
    connectionTimeoutMillis: 10_000,
  });
  await client.connect();
  return client;
}

async function main() {
  console.log(`[ensure-db] Servidor ${config.postgres.host}:${config.postgres.port} | alvo: "${alvo}"`);

  // 1) O banco-alvo já existe? Tenta conectar direto.
  try {
    const c = await tentarConectar(alvo);
    const v = await c.query('SELECT version()');
    console.log(`[ensure-db] Banco "${alvo}" já existe e conecta. ${v.rows[0].version.split(',')[0]}`);
    await c.end();
    return;
  } catch (err) {
    if (err.code !== '3D000') {
      // 3D000 = database does not exist. Qualquer outro erro = problema real.
      console.error(`[ensure-db] Falha ao conectar no alvo (código ${err.code ?? '?'}): ${err.message}`);
      // segue tentando criar via manutenção mesmo assim
    } else {
      console.log(`[ensure-db] Banco "${alvo}" não existe — vou tentar criar.`);
    }
  }

  // 2) Conecta numa base de manutenção e cria o alvo.
  let mant = null;
  for (const db of candidatasManutencao) {
    try {
      mant = await tentarConectar(db);
      console.log(`[ensure-db] Conectado na base de manutenção "${db}".`);
      break;
    } catch (e) {
      console.log(`[ensure-db]   "${db}" indisponível (${e.code ?? e.message}).`);
    }
  }
  if (!mant) {
    throw new Error('Nenhuma base de manutenção acessível (postgres/usuário/template1). Verifique credenciais/firewall.');
  }

  const existe = await mant.query('SELECT 1 FROM pg_database WHERE datname = $1', [alvo]);
  if (existe.rowCount > 0) {
    console.log(`[ensure-db] Banco "${alvo}" já consta em pg_database. Nada a criar.`);
  } else {
    // Identificador com maiúsculas precisa de aspas duplas.
    await mant.query(`CREATE DATABASE "${alvo}"`);
    console.log(`[ensure-db] Banco "${alvo}" criado com sucesso.`);
  }
  await mant.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ensure-db] ERRO:', err.message);
    process.exit(1);
  });
