// Backfill: preenche fluxos_integracao.funcionalidades_ativa a partir de
// modulos_ativa (nomes de módulo da planilha). Para cada fluxo, mapeia os nomes
// de módulo -> módulos do catálogo (por nome normalizado) e coleta TODAS as
// funcionalidades desses módulos. Idempotente por padrão: só preenche fluxos com
// funcionalidades_ativa vazio; passe --forcar para reescrever todos.
//
// Uso: npm run fluxos:expandir-funcionalidades [-- --forcar]

import { pool, closePool } from '../db/client.js';

// Mesma normalização do motor de cálculo (calculo.js) para casar nomes de módulo.
const RE_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');
function normModulo(nome) {
  return String(nome ?? '')
    .normalize('NFD').replace(RE_DIACRITICOS, '')
    .toLowerCase()
    .replace(/crm\s*-\s*mm\s*-\s*/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bde\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const forcar = process.argv.includes('--forcar');

  // Módulos do catálogo indexados por nome normalizado.
  const { rows: modulos } = await pool.query('SELECT id, nome FROM modulos');
  const modIdPorNorm = new Map(modulos.map((m) => [normModulo(m.nome), m.id]));

  // Funcionalidades por módulo.
  const { rows: funcs } = await pool.query('SELECT id, modulo_id FROM funcionalidades');
  const funcsPorModulo = new Map();
  for (const f of funcs) {
    if (!funcsPorModulo.has(f.modulo_id)) funcsPorModulo.set(f.modulo_id, []);
    funcsPorModulo.get(f.modulo_id).push(f.id);
  }

  const { rows: fluxos } = await pool.query(
    'SELECT id, modulos_ativa, funcionalidades_ativa FROM fluxos_integracao');

  let atualizados = 0, semMatch = 0;
  for (const fx of fluxos) {
    if (!forcar && (fx.funcionalidades_ativa?.length ?? 0) > 0) continue;

    const funcIds = new Set();
    const modsNaoEncontrados = [];
    for (const nome of fx.modulos_ativa ?? []) {
      const modId = modIdPorNorm.get(normModulo(nome));
      if (!modId) { modsNaoEncontrados.push(nome); continue; }
      for (const fid of funcsPorModulo.get(modId) ?? []) funcIds.add(fid);
    }
    if (modsNaoEncontrados.length) {
      semMatch += 1;
      console.warn(`[fluxo ${fx.id}] módulos sem correspondência: ${modsNaoEncontrados.join(', ')}`);
    }

    await pool.query(
      'UPDATE fluxos_integracao SET funcionalidades_ativa = $1 WHERE id = $2',
      [[...funcIds], fx.id]);
    atualizados += 1;
  }

  console.log(`[expandir] ${atualizados} fluxo(s) atualizado(s)${forcar ? ' (forçado)' : ''}. ${semMatch} com algum módulo sem correspondência.`);
}

main()
  .catch((err) => { console.error('[expandir] erro:', err); process.exitCode = 1; })
  .finally(() => closePool());
