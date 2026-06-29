-- ===========================================================================
-- SIMULAÇÕES (uma estimativa por cliente/projeto)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS simulacoes (
  id                    SERIAL PRIMARY KEY,
  nome                  TEXT NOT NULL,                 -- cliente / nome do projeto
  -- Parâmetros gerais (aba Resumo):
  num_usuarios          INTEGER NOT NULL DEFAULT 0,
  erp_id                INTEGER REFERENCES erps (id),
  metodo_integracao_id  INTEGER REFERENCES metodos_integracao (id),
  ambiente_prod_homolog BOOLEAN NOT NULL DEFAULT FALSE,
  cloud_aliare          BOOLEAN NOT NULL DEFAULT TRUE,
  fases                 INTEGER NOT NULL DEFAULT 1,
  coef_complexidade     NUMERIC(6,2) NOT NULL DEFAULT 1,
  fator_gestao          NUMERIC(6,4) NOT NULL DEFAULT 0.08,
  status                TEXT NOT NULL DEFAULT 'rascunho'
                          CHECK (status IN ('rascunho', 'finalizada')),
  criado_por            INTEGER REFERENCES usuarios (id),
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Módulos contratados nesta simulação.
CREATE TABLE IF NOT EXISTS simulacao_modulos (
  simulacao_id  INTEGER NOT NULL REFERENCES simulacoes (id) ON DELETE CASCADE,
  modulo_id     INTEGER NOT NULL REFERENCES modulos (id) ON DELETE CASCADE,
  contratado    BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (simulacao_id, modulo_id)
);

-- Funcionalidades marcadas nesta simulação.
CREATE TABLE IF NOT EXISTS simulacao_funcionalidades (
  simulacao_id      INTEGER NOT NULL REFERENCES simulacoes (id) ON DELETE CASCADE,
  funcionalidade_id INTEGER NOT NULL REFERENCES funcionalidades (id) ON DELETE CASCADE,
  marcado           BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (simulacao_id, funcionalidade_id)
);

CREATE INDEX IF NOT EXISTS idx_sim_func_simulacao ON simulacao_funcionalidades (simulacao_id);
