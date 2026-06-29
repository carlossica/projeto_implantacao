// Script utilitário: valida conexão com Postgres e presença das tabelas do schema.
// Uso: npm run db:check

import { pool, closePool } from './client.js';
import { config } from '../config.js';

const TABELAS_ESPERADAS = [
  'usuarios',
  'modulos',
  'funcionalidades',
  'erps',
  'simulacoes',
  'simulacao_funcionalidades',
];

async function main() {
  console.log(`[db:check] Conectando em ${config.postgres.host}:${config.postgres.port}/${config.postgres.database} como ${config.postgres.user}...`);

  const versao = await pool.query('SELECT version()');
  console.log(`[db:check] OK — ${versao.rows[0].version.split(',')[0]}`);

  const { rows } = await pool.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [TABELAS_ESPERADAS],
  );
  const encontradas = rows.map((r) => r.table_name);
  const faltando = TABELAS_ESPERADAS.filter((t) => !encontradas.includes(t));

  console.log(`[db:check] Tabelas encontradas: ${encontradas.join(', ') || '(nenhuma)'}`);
  if (faltando.length > 0) {
    console.error(`[db:check] Tabelas faltando: ${faltando.join(', ')}`);
    console.error('[db:check] Rode as migrations: npm run db:migrate-all');
    process.exitCode = 1;
  } else {
    console.log('[db:check] Schema aplicado corretamente.');
  }
}

main()
  .catch((err) => {
    console.error('[db:check] ERRO:', err.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
