-- ===========================================================================
-- Etapas de implantação por módulo + seção "Formato dos Treinamentos"
-- ===========================================================================

-- Percentuais de cada etapa do projeto por módulo (aplicados sobre as horas
-- marcadas do módulo). Réplica das colunas L/M/N/O/P/Q da aba Funcionalidades.
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS pct_lrp                NUMERIC(7,4) NOT NULL DEFAULT 0;
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS pct_validacao_dados    NUMERIC(7,4) NOT NULL DEFAULT 0;
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS pct_parametrizacao     NUMERIC(7,4) NOT NULL DEFAULT 0;
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS pct_treinamento        NUMERIC(7,4) NOT NULL DEFAULT 0;
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS pct_validacao_ambiente NUMERIC(7,4) NOT NULL DEFAULT 0;
ALTER TABLE modulos ADD COLUMN IF NOT EXISTS pct_golive             NUMERIC(7,4) NOT NULL DEFAULT 0;

-- Seção "Formato dos Treinamentos" na simulação.
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS num_administradores   INTEGER NOT NULL DEFAULT 1;
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS num_operacionais      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS num_gestores          INTEGER NOT NULL DEFAULT 1;
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS tam_turma_operacional INTEGER NOT NULL DEFAULT 25;
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS tam_turma_gestor      INTEGER NOT NULL DEFAULT 10;
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS etapas_golive         INTEGER NOT NULL DEFAULT 1;
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS formato_treino_adm    TEXT NOT NULL DEFAULT 'Presencial';
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS formato_treino_oper   TEXT NOT NULL DEFAULT 'Presencial';

-- Constantes fixas das etapas de implantação.
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('pos_producao_horas', '12', 'Horas fixas de Pós-Produção por projeto.'),
  ('acomp_golive_horas_base', '8', 'Horas base de Acompanhamento de Go-Live (× fases × etapas de go-live).')
ON CONFLICT (chave) DO NOTHING;
