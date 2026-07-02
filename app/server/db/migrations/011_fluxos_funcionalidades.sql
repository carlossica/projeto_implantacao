-- ===========================================================================
-- Fluxos de integração vinculados a FUNCIONALIDADES (antes: módulos).
-- ===========================================================================
-- Regra nova: um fluxo entra nas horas de integração quando ao menos uma
-- FUNCIONALIDADE marcada na simulação está na sua lista de ativação. Antes o
-- vínculo era por módulo (coluna modulos_ativa, mantida para referência/rollback).
--
-- A coluna guarda IDs de funcionalidade (estáveis dentro desta instalação). O
-- backfill dos dados existentes (expandir modulos_ativa -> funcionalidades dos
-- módulos correspondentes) é feito pelo CLI fluxos:expandir-funcionalidades,
-- que usa a mesma normalização de nomes do motor de cálculo.
ALTER TABLE fluxos_integracao
  ADD COLUMN IF NOT EXISTS funcionalidades_ativa INTEGER[] NOT NULL DEFAULT '{}';
