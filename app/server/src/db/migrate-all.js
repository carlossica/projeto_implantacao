// Aplica TODAS as migrations da pasta server/db/migrations/ em ordem
// alfabética. Cada arquivo precisa ser idempotente (CREATE...IF NOT EXISTS,
// ALTER TABLE...IF NOT EXISTS, CREATE OR REPLACE, etc.) porque rodamos
// todas as vezes — sem tabela de "migrations já aplicadas".
//
// Uso:
//   npm run db:migrate-all

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../db/migrations');

async function main() {
  let arquivos;
  try {
    arquivos = await fs.readdir(migrationsDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('[migrate-all] pasta migrations/ não existe — nada a fazer');
      return;
    }
    throw err;
  }

  const sqls = arquivos.filter((f) => f.endsWith('.sql')).sort();
  if (sqls.length === 0) {
    console.log('[migrate-all] nenhum .sql em migrations/');
    return;
  }

  console.log(`[migrate-all] aplicando ${sqls.length} migration(s)...`);
  for (const arq of sqls) {
    const sql = await fs.readFile(path.join(migrationsDir, arq), 'utf-8');
    console.log(`[migrate-all]   ${arq} (${sql.length} bytes)`);
    await pool.query(sql);
  }
  console.log('[migrate-all] OK');
}

main()
  .catch((err) => {
    console.error('[migrate-all] ERRO:', err.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
