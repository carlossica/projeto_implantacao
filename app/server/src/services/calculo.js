// ===========================================================================
// MOTOR DE CÁLCULO DA ESTIMATIVA
// ===========================================================================
// Réplica das fórmulas da planilha "Simulador Clover" (validado contra ela:
// Fundamentais + Força de Vendas = 98h de implantação).
//
//  IMPLANTAÇÃO (por módulo contratado, sobre as horas MARCADAS do módulo = G):
//    etapas = G × (pct_lrp + pct_treinamento + pct_golive×turmas_operac
//                  + (pct_validacao_dados + pct_parametrizacao + pct_validacao_ambiente)×(1+acréscimo se prod+homolog))
//    + fixos do projeto: Acomp. Go-Live (base × fases × etapas) + Pós-Produção.
//    (o +30% do prod+homolog incide só em validação de dados, parametrização e
//     validação de ambiente — as etapas refeitas em homologação.)
//  INSTALAÇÃO  = base + horas do ERP + (prod+homolog?) + hospedagem (tudo config/cadastro).
//  INTEGRAÇÃO  = Σ fluxos cuja matriz de ativação intersecta os módulos contratados.
//  GESTÃO      = fator × (implantação + integração + adequações)  [SEM instalação].
//  TREINAMENTO (turmas) = ⌈operacionais/tam_turma⌉ × etapas → multiplica o Go-Live.
//  TOTAL       = gestão + instalação + implantação + integração + adequações.
//
// Horas internas em MINUTOS; expostas em HORAS decimais.

const MIN_POR_HORA = 60;
const h = (min) => Math.round((min / MIN_POR_HORA) * 100) / 100;

// Normaliza nome de módulo pra cruzar a matriz de integração (planilha grafa
// "Potencial Maquinas" vs catálogo "Potencial de Máquinas").
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

const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

export function calcular(dados) {
  const { simulacao, modulos, funcionalidades, fluxosIntegracao = [], config = {} } = dados;

  const fatorGestao = num(simulacao.fator_gestao ?? config.fator_gestao_projeto, 0.08);
  const acrescimoPH = simulacao.ambiente_prod_homolog ? num(config.acrescimo_prod_homolog, 0.3) : 0;
  const fatorPH = 1 + acrescimoPH;

  // --- Turmas operacionais (Go-Live escala por turma) -----------------------
  const numOperac = num(simulacao.num_operacionais, 0);
  const tamTurmaOper = num(simulacao.tam_turma_operacional, 25) || 25;
  const etapasGolive = num(simulacao.etapas_golive, 1) || 1;
  const turmasOperac = numOperac > 0 ? Math.ceil(numOperac / tamTurmaOper) * etapasGolive : etapasGolive;
  const numGestores = num(simulacao.num_gestores, 0);
  const tamTurmaGestor = num(simulacao.tam_turma_gestor, 10) || 10;
  const turmasGestor = numGestores > 0 ? Math.ceil(numGestores / tamTurmaGestor) * etapasGolive : 0;

  // --- Horas marcadas por módulo (G) ----------------------------------------
  const modById = new Map(modulos.map((m) => [m.id, m]));
  const minPorModulo = new Map();
  for (const f of funcionalidades) {
    if (!modById.has(f.modulo_id)) continue;
    const cur = minPorModulo.get(f.modulo_id) ?? { min: 0, qtd: 0 };
    cur.min += f.horas_minutos || 0;
    cur.qtd += 1;
    minPorModulo.set(f.modulo_id, cur);
  }

  // --- Implantação por etapas -----------------------------------------------
  const etapas = { lrp: 0, validacao_dados: 0, parametrizacao: 0, treinamento: 0, validacao_ambiente: 0, golive: 0 };
  const porModulo = [];
  for (const [modId, v] of minPorModulo) {
    const m = modById.get(modId);
    const G = v.min;
    const lrp = G * num(m.pct_lrp);
    const treino = G * num(m.pct_treinamento);
    const golive = G * num(m.pct_golive) * turmasOperac;
    const valDados = G * num(m.pct_validacao_dados) * fatorPH;
    const param = G * num(m.pct_parametrizacao) * fatorPH;
    const valAmb = G * num(m.pct_validacao_ambiente) * fatorPH;
    etapas.lrp += lrp; etapas.treinamento += treino; etapas.golive += golive;
    etapas.validacao_dados += valDados; etapas.parametrizacao += param; etapas.validacao_ambiente += valAmb;
    porModulo.push({
      modulo_id: modId,
      modulo: m.nome,
      qtd_funcionalidades: v.qtd,
      horas: h(lrp + treino + golive + valDados + param + valAmb),
    });
  }
  porModulo.sort((a, b) => b.horas - a.horas);

  // Fixos do projeto (só se há algum módulo contratado).
  const temModulos = minPorModulo.size > 0;
  const minAcompGolive = temModulos ? num(config.acomp_golive_horas_base, 8) * num(simulacao.fases, 1) * etapasGolive * MIN_POR_HORA : 0;
  const minPosProducao = temModulos ? num(config.pos_producao_horas, 12) * MIN_POR_HORA : 0;

  const minImplantacao = etapas.lrp + etapas.validacao_dados + etapas.parametrizacao
    + etapas.treinamento + etapas.validacao_ambiente + etapas.golive + minAcompGolive + minPosProducao;

  // --- Instalação (config/cadastro) -----------------------------------------
  const baseH = num(config.instalacao_base_horas, 1);
  const erpH = num(simulacao.erp_horas_instalacao, 0);
  const prodHomologH = simulacao.ambiente_prod_homolog ? num(config.instalacao_prod_homolog_horas, 4) : 0;
  const hospedagemH = num(simulacao.hospedagem_horas, 0);
  const minInstalacao = (baseH + erpH + prodHomologH + hospedagemH) * MIN_POR_HORA;

  // --- Integração (matriz de ativação) --------------------------------------
  const temIntegracao = !!simulacao.metodo_nome &&
    !String(simulacao.metodo_nome).toLowerCase().includes('sem integra');
  const modsContratadosNorm = new Set(modulos.map((m) => normModulo(m.nome)));
  let minIntegracao = 0;
  let fluxosAtivos = 0;
  if (temIntegracao) {
    for (const fx of fluxosIntegracao) {
      const ativo = (fx.modulos_ativa ?? []).map(normModulo).some((n) => modsContratadosNorm.has(n));
      if (!ativo) continue;
      fluxosAtivos += 1;
      minIntegracao += (fx.min_config || 0) + (fx.min_teste_carga || 0) + (fx.min_apoio || 0) + (fx.min_validacao || 0);
    }
  }

  // --- Adequações (manual) ---------------------------------------------------
  const minAdequacoes = Math.round(num(simulacao.adequacoes_horas, 0) * MIN_POR_HORA);

  // --- Gestão de Projeto (SEM instalação na base) ---------------------------
  const minGestao = Math.round((minImplantacao + minIntegracao + minAdequacoes) * fatorGestao);

  const minTotal = minGestao + minInstalacao + minImplantacao + minIntegracao + minAdequacoes;

  return {
    horas: {
      gestao: h(minGestao),
      instalacao: h(minInstalacao),
      implantacao: h(minImplantacao),
      integracao: h(minIntegracao),
      adequacoes: h(minAdequacoes),
      total: h(minTotal),
    },
    // Quebra da implantação por etapa (igual à planilha).
    etapas: {
      lrp: h(etapas.lrp),
      validacao_dados: h(etapas.validacao_dados),
      parametrizacao: h(etapas.parametrizacao),
      treinamento: h(etapas.treinamento),
      validacao_ambiente: h(etapas.validacao_ambiente),
      golive: h(etapas.golive),
      acomp_golive: h(minAcompGolive),
      pos_producao: h(minPosProducao),
    },
    por_modulo: porModulo,
    treinamento: {
      operacionais: numOperac,
      gestores: numGestores,
      tam_turma_operacional: tamTurmaOper,
      tam_turma_gestor: tamTurmaGestor,
      etapas_golive: etapasGolive,
      turmas_operacionais: turmasOperac,
      turmas_gestores: turmasGestor,
    },
    parametros: {
      fator_gestao: fatorGestao,
      tem_integracao: temIntegracao,
      fluxos_integracao_ativos: fluxosAtivos,
      prod_homolog: !!simulacao.ambiente_prod_homolog,
      qtd_modulos_contratados: modulos.length,
      qtd_funcionalidades_marcadas: funcionalidades.filter((f) => modById.has(f.modulo_id)).length,
    },
  };
}
