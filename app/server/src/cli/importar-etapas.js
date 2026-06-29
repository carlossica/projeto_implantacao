// Importa os percentuais de etapa por módulo (etapas-seed.json) para a tabela
// modulos. Idempotente: atualiza por nome do módulo.
// Uso: npm run etapas:importar

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve(__dirname, '../../scripts/etapas-seed.json');

async function main() {
  const seed = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
  let n = 0, faltando = [];
  for (const [nome, p] of Object.entries(seed.modulos)) {
    const r = await pool.query(
      `UPDATE modulos SET
         pct_lrp = $2, pct_validacao_dados = $3, pct_parametrizacao = $4,
         pct_treinamento = $5, pct_validacao_ambiente = $6, pct_golive = $7
       WHERE nome = $1`,
      [nome, p.lrp, p.validacao_dados, p.parametrizacao, p.treinamento, p.validacao_ambiente, p.golive],
    );
    if (r.rowCount > 0) n++; else faltando.push(nome);
  }
  console.log(`[etapas] OK — ${n} módulos atualizados.`);
  if (faltando.length) console.warn(`[etapas] sem match no banco: ${faltando.join(' | ')}`);
}

main()
  .catch((err) => { console.error('[etapas] ERRO:', err.message); process.exitCode = 1; })
  .finally(() => closePool());
