// Vincula os fluxos de integração às FUNCIONALIDADES conforme a aba
// "Funcionalidades" da planilha (colunas J "Fluxos de Integração" e K "Tabelas
// Integradas"). Fonte: scripts/fluxos-funcionalidades-map.json, gerado a partir
// da planilha. Fluxos não referenciados pela planilha ficam SEM funcionalidade.
//
// Idempotente. Uso: npm run fluxos:vincular-funcionalidades [-- --dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../db/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPA_PATH = path.resolve(__dirname, '../../scripts/fluxos-funcionalidades-map.json');
const DRY = process.argv.includes('--dry-run');

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const MOD_FUND = 'CRM - MM - Funcionalidades Fundamentais';
// Nomes legados que foram unificados numa só funcionalidade.
const LEGADOS_LOCALIZACAO = ['Unidade Federativa', 'País', 'Cidade'];
const NOME_UNIFICADO = 'País / UF / Cidade';

async function main() {
  const mapa = JSON.parse(fs.readFileSync(MAPA_PATH, 'utf8'));

  const { rows: fdb } = await pool.query(
    'SELECT f.id, f.nome, m.nome AS modulo FROM funcionalidades f JOIN modulos m ON m.id = f.modulo_id');
  const funcKey = new Map();
  for (const f of fdb) funcKey.set(norm(f.modulo) + '||' + norm(f.nome), f.id);
  const mergedId = funcKey.get(norm(MOD_FUND) + '||' + norm(NOME_UNIFICADO));
  if (mergedId) for (const leg of LEGADOS_LOCALIZACAO) funcKey.set(norm(MOD_FUND) + '||' + norm(leg), mergedId);

  const { rows: flows } = await pool.query('SELECT id, contexto, ordem, fluxo, tabela FROM fluxos_integracao');
  const porCtxOrdem = new Map(flows.map((f) => [f.contexto + '|' + f.ordem, f]));
  const porCtxFT = new Map(flows.map((f) => [f.contexto + '|' + norm(f.fluxo) + '|' + norm(f.tabela), f]));

  const naoResolvidos = new Set();
  const updates = [];
  let semFluxoNoDB = 0;
  for (const e of mapa) {
    const fl = porCtxOrdem.get(e.contexto + '|' + e.ordem)
      ?? porCtxFT.get(e.contexto + '|' + norm(e.fluxo) + '|' + norm(e.tabela));
    if (!fl) { semFluxoNoDB++; continue; }
    const ids = new Set();
    for (const fn of e.funcs) {
      const id = funcKey.get(norm(fn.modulo) + '||' + norm(fn.nome));
      if (id) ids.add(id); else naoResolvidos.add(`${fn.modulo} :: ${fn.nome}`);
    }
    updates.push({ id: fl.id, ids: [...ids] });
  }

  const comFunc = updates.filter((u) => u.ids.length > 0).length;
  console.log(`[vincular] mapa=${mapa.length} | fluxos casados=${updates.length} | mapa sem fluxo no DB=${semFluxoNoDB}`);
  console.log(`[vincular]   com >=1 funcionalidade=${comFunc} | zerados=${updates.length - comFunc} | nomes nao resolvidos=${naoResolvidos.size}`);
  for (const n of [...naoResolvidos].slice(0, 20)) console.log('   ! ' + n);

  if (DRY) { console.log('[vincular] DRY-RUN — nada gravado.'); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query('UPDATE fluxos_integracao SET funcionalidades_ativa = $1::int[] WHERE id = $2', [u.ids, u.id]);
    }
    await client.query('COMMIT');
    console.log(`[vincular] OK — ${updates.length} fluxos atualizados.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => { console.error('[vincular] erro:', err); process.exitCode = 1; })
  .finally(() => closePool());
