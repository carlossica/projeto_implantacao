export type Papel = "admin" | "editor" | "visualizador";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  admin: boolean;
  senha_provisoria: boolean;
  criado_em?: string;
  atualizado_em?: string;
};

export type Funcionalidade = {
  id: number;
  modulo_id: number;
  funcionalidade_mae: string | null;
  nome: string;
  tipo: string | null;
  horas_minutos: number;
  pacote_padrao: boolean;
  ordem: number;
  ativo?: boolean;
};

export type Modulo = {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
  qtd_funcionalidades: number;
  qtd_padrao: number;
  funcionalidades: Funcionalidade[];
};

export type Erp = { id: number; nome: string; ordem: number; horas_instalacao?: number | string; ativo?: boolean };
export type MetodoIntegracao = { id: number; nome: string; ordem: number };
export type TipoHospedagem = { id: number; nome: string; horas: number | string; ordem: number; ativo?: boolean };
export type Configuracao = { chave: string; valor: string; descricao: string | null };

export type Cliente = {
  id: number;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
  qtd_simulacoes?: number;
};

export type FluxoIntegracao = {
  id: number;
  contexto: string;
  fluxo: string | null;
  tabela: string | null;
  tipo: string | null;
  min_config: number;
  min_teste_carga: number;
  min_apoio: number;
  min_validacao: number;
  // Vínculo por funcionalidade (IDs). Um fluxo conta nas horas quando alguma
  // funcionalidade marcada na simulação está nesta lista.
  funcionalidades_ativa: number[];
  // Legado: vínculo por nome de módulo (mantido para referência/rollback).
  modulos_ativa?: string[];
  ordem: number;
  ativo?: boolean;
};

export type ResultadoHoras = {
  gestao: number;
  instalacao: number;
  implantacao: number;
  integracao: number;
  adequacoes: number;
  total: number;
};

export type ResultadoEtapas = {
  lrp: number;
  validacao_dados: number;
  parametrizacao: number;
  treinamento: number;
  validacao_ambiente: number;
  golive: number;
  acomp_golive: number;
  pos_producao: number;
};

export type Resultado = {
  horas: ResultadoHoras;
  etapas: ResultadoEtapas;
  por_modulo: { modulo_id: number; modulo: string; qtd_funcionalidades: number; horas: number }[];
  treinamento: {
    operacionais: number;
    gestores: number;
    tam_turma_operacional: number;
    tam_turma_gestor: number;
    etapas_golive: number;
    turmas_operacionais: number;
    turmas_gestores: number;
  };
  parametros: {
    fator_gestao: number;
    tem_integracao: boolean;
    fluxos_integracao_ativos: number;
    prod_homolog: boolean;
    qtd_modulos_contratados: number;
    qtd_funcionalidades_marcadas: number;
  };
};

export type LrpResposta = {
  id: number;
  lrp_item_id: number;
  pergunta: string;
  orientacao: string | null;
  tipo_resposta: string;
  opcoes: string[];
  resposta: string | null;
  ordem: number;
};

export type LrpItem = {
  id: number;
  modulo_nome: string | null;
  titulo: string;
  descricao: string | null;
  ordem: number;
  aderencia: "aderente" | "parcial" | "nao_aderente" | null;
  pontos_nao_aderentes: string | null;
  respostas: LrpResposta[];
};

export type Lrp = {
  id: number;
  nome: string;
  versao: number;
  status: "rascunho" | "finalizada";
  simulacao_id: number | null;
  cliente_id: number | null;
  cliente_nome?: string | null;
  simulacao_nome?: string | null;
  criado_por_nome?: string | null;
  qtd_topicos?: number;
  criado_em?: string;
  atualizado_em?: string;
  itens?: LrpItem[];
};

export type Simulacao = {
  id: number;
  nome: string;
  cliente_id: number | null;
  cliente_nome?: string | null;
  num_usuarios: number;
  erp_id: number | null;
  erp_nome?: string | null;
  metodo_integracao_id: number | null;
  metodo_nome?: string | null;
  ambiente_prod_homolog: boolean;
  cloud_aliare: boolean;
  hospedagem_id: number | null;
  hospedagem_nome?: string | null;
  fases: number;
  fator_gestao: string | number;
  num_administradores: number;
  num_operacionais: number;
  num_gestores: number;
  tam_turma_operacional: number;
  tam_turma_gestor: number;
  etapas_golive: number;
  formato_treino_adm: string;
  formato_treino_oper: string;
  status: "rascunho" | "finalizada";
  criado_por_nome?: string | null;
  qtd_modulos?: number;
  atualizado_em?: string;
  modulos_contratados?: number[];
  funcionalidades_marcadas?: number[];
  resultado?: Resultado;
};
