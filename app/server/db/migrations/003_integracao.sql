-- ===========================================================================
-- FLUXOS DE INTEGRAÇÃO (abas Aliare Integra Solution / ERP Terceiro / AGB / SIMER)
-- ===========================================================================
-- Modelo genérico: cada fluxo tem horas (minutos) distribuídas em "baldes" de
-- esforço (configuração, teste interno/carga, apoio à validação, validação).
-- `contexto` identifica de qual aba/cenário o fluxo veio.

CREATE TABLE IF NOT EXISTS fluxos_integracao (
  id               SERIAL PRIMARY KEY,
  -- 'solution' | 'erp_terceiro' | 'agb' | 'simer'
  contexto         TEXT NOT NULL,
  fluxo            TEXT,
  tabela           TEXT,
  -- "**Sempre", "Obrigatório", etc.
  tipo             TEXT,
  -- módulo de referência ao qual o fluxo se vincula (texto da planilha).
  modulo_ref       TEXT,
  min_config       INTEGER NOT NULL DEFAULT 0,
  min_teste_carga  INTEGER NOT NULL DEFAULT 0,
  min_apoio        INTEGER NOT NULL DEFAULT 0,
  min_validacao    INTEGER NOT NULL DEFAULT 0,
  ordem            INTEGER NOT NULL DEFAULT 0,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE
);

-- Idempotente: solta o NOT NULL caso a tabela tenha sido criada por uma versão
-- anterior da migration (fluxo é um agrupador que pode estar ausente).
ALTER TABLE fluxos_integracao ALTER COLUMN fluxo DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fluxos_integracao_contexto ON fluxos_integracao (contexto);
