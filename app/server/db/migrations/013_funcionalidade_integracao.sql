-- ===========================================================================
-- Tempo de INTEGRAÇÃO DE DADOS por funcionalidade (coluna I da aba
-- "Funcionalidades" da planilha). A coluna G (C&S CRM) já é horas_minutos.
-- ===========================================================================
ALTER TABLE funcionalidades
  ADD COLUMN IF NOT EXISTS horas_integracao_minutos INTEGER NOT NULL DEFAULT 0;
