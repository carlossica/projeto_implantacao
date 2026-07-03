-- ===========================================================================
-- Acompanhamento de Go-Live e Pós-Produção informáveis manualmente (em horas)
-- ===========================================================================
-- Quando preenchidos (NÃO nulo), substituem o cálculo automático dessas etapas.
-- NULL = mantém o comportamento automático:
--   Acomp. Go-Live = acomp_golive_horas_base × fases × etapas_golive
--   Pós-Produção   = pos_producao_horas (constante)
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS acomp_golive_horas NUMERIC(7,2);
ALTER TABLE simulacoes ADD COLUMN IF NOT EXISTS pos_producao_horas NUMERIC(7,2);
