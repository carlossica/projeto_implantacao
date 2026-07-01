"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import type { Configuracao, Erp, TipoHospedagem } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { AdminGuard } from "@/components/admin-guard";

type Unidade = "percent" | "horas" | "usuarios" | "consultores";

// Metadados de cada constante: rótulo, explicação e unidade de medida.
const META: Record<string, { label: string; desc: string; unidade: Unidade }> = {
  fator_gestao_projeto: {
    label: "Fator de gestão de projeto",
    desc: "Percentual aplicado sobre as demais etapas (instalação, implantação, integração e adequações) para compor as horas de Gestão de Projeto.",
    unidade: "percent",
  },
  acrescimo_prod_homolog: {
    label: "Acréscimo de produção + homologação (na implantação)",
    desc: "Quanto a implantação aumenta quando o projeto usa dois ambientes (produção + homologação), pois o trabalho é feito na homologação e replicado/validado em produção.",
    unidade: "percent",
  },
  instalacao_base_horas: {
    label: "Instalação — horas base",
    desc: "Horas mínimas de instalação, sempre somadas, independentemente do escopo contratado.",
    unidade: "horas",
  },
  instalacao_prod_homolog_horas: {
    label: "Instalação — extra com produção + homologação",
    desc: "Horas adicionais de instalação para montar o segundo ambiente (homologação), quando aplicável.",
    unidade: "horas",
  },
  treinamento_max_por_turma: {
    label: "Treinamento — máximo de usuários por turma",
    desc: "Limite de usuários em cada turma de treinamento. Define quantas turmas serão necessárias conforme o nº de usuários.",
    unidade: "usuarios",
  },
  treinamento_consultores_padrao: {
    label: "Treinamento — consultores (turma dentro do limite)",
    desc: "Quantos consultores conduzem o treinamento quando a turma está dentro do limite de usuários.",
    unidade: "consultores",
  },
  treinamento_consultores_acima: {
    label: "Treinamento — consultores (turma grande)",
    desc: "Quantos consultores conduzem o treinamento quando há 25 ou mais usuários por turma.",
    unidade: "consultores",
  },
};

const ORDEM_CONFIG = [
  "fator_gestao_projeto", "acrescimo_prod_homolog",
  "instalacao_base_horas", "instalacao_prod_homolog_horas",
  "treinamento_max_por_turma", "treinamento_consultores_padrao", "treinamento_consultores_acima",
];

const SUFIXO: Record<Unidade, string> = { percent: "%", horas: "h", usuarios: "usuários", consultores: "consultores" };

export default function ConfiguracoesPage() {
  return <AdminGuard><ConfiguracoesConteudo /></AdminGuard>;
}

function ConfiguracoesConteudo() {
  const [configs, setConfigs] = useState<Configuracao[]>([]);
  const [erps, setErps] = useState<Erp[]>([]);
  const [hospedagens, setHospedagens] = useState<TipoHospedagem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [novaHosp, setNovaHosp] = useState({ nome: "", horas: 0 });

  async function carregar() {
    try {
      const [c, e, h] = await Promise.all([
        apiGet<{ configuracoes: Configuracao[] }>("/catalogo/configuracoes"),
        apiGet<{ erps: Erp[] }>("/catalogo/erps"),
        apiGet<{ hospedagem: TipoHospedagem[] }>("/catalogo/hospedagem"),
      ]);
      setConfigs(c.configuracoes);
      setErps(e.erps);
      setHospedagens(h.hospedagem);
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  useEffect(() => { carregar(); }, []);

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(null), 2000); }

  async function salvarConfig(chave: string, valor: string) {
    try { await apiPut(`/catalogo/configuracoes/${chave}`, { valor }); flash("Salvo"); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  async function salvarErp(erp: Erp, horas: number) {
    try {
      await apiPut(`/catalogo/erps/${erp.id}`, { horas_instalacao: horas });
      setErps((cur) => cur.map((x) => x.id === erp.id ? { ...x, horas_instalacao: horas } : x));
      flash("Salvo");
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  async function salvarHosp(h: TipoHospedagem, campos: Partial<TipoHospedagem>) {
    try { await apiPut(`/catalogo/hospedagem/${h.id}`, campos); flash("Salvo"); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  async function criarHosp() {
    if (!novaHosp.nome.trim()) return;
    try { await apiPost("/catalogo/hospedagem", novaHosp); setNovaHosp({ nome: "", horas: 0 }); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  async function excluirHosp(h: TipoHospedagem) {
    if (!confirm(`Excluir a hospedagem "${h.nome}"?`)) return;
    try { await apiDelete(`/catalogo/hospedagem/${h.id}`); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  const inputCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100";

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader titulo="Configurações Gerais" descricao="Constantes do cálculo, horas de instalação por ERP e tipos de hospedagem." acao={msg ? <span className="text-sm text-aliare-600">{msg}</span> : undefined} />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      {/* Constantes de cálculo */}
      <section className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Constantes de cálculo</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">A explicação abaixo de cada campo serve de lembrete do que ele faz no cálculo.</p>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...configs].sort((a, b) => {
            const ia = ORDEM_CONFIG.indexOf(a.chave); const ib = ORDEM_CONFIG.indexOf(b.chave);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          }).map((c) => (
            <ConfigCampo key={c.chave} config={c} onSalvar={salvarConfig} />
          ))}
        </div>
      </section>

      {/* Horas de instalação por ERP */}
      <section className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Horas de instalação por ERP</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Substitui o antigo “+5h se AGB”. Defina quantas horas de instalação cada ERP adiciona.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {erps.map((erp) => (
            <div key={erp.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{erp.nome}</span>
              <div className="flex items-center gap-1 shrink-0">
                <input type="number" min={0} step={0.5} defaultValue={Number(erp.horas_instalacao ?? 0)} onBlur={(e) => { const v = Number(e.target.value); if (v !== Number(erp.horas_instalacao ?? 0)) salvarErp(erp, v); }} className={inputCls + " w-20 text-right"} />
                <span className="text-xs text-gray-400">h</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tipos de hospedagem */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Tipos de hospedagem</h2>
        <div className="space-y-2 mb-4">
          {hospedagens.map((h) => (
            <div key={h.id} className="flex items-center gap-3">
              <input defaultValue={h.nome} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== h.nome) salvarHosp(h, { nome: e.target.value.trim() }); }} className={inputCls + " flex-1"} />
              <div className="flex items-center gap-1">
                <input type="number" min={0} step={0.5} defaultValue={Number(h.horas)} onBlur={(e) => { const v = Number(e.target.value); if (v !== Number(h.horas)) salvarHosp(h, { horas: v }); }} className={inputCls + " w-24 text-right"} />
                <span className="text-xs text-gray-400">h</span>
              </div>
              <button onClick={() => excluirHosp(h)} className="text-xs text-red-500 hover:text-red-600">Excluir</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
          <input value={novaHosp.nome} onChange={(e) => setNovaHosp({ ...novaHosp, nome: e.target.value })} placeholder="Novo tipo de hospedagem" className={inputCls + " flex-1"} />
          <input type="number" min={0} step={0.5} value={novaHosp.horas} onChange={(e) => setNovaHosp({ ...novaHosp, horas: Number(e.target.value) })} className={inputCls + " w-24 text-right"} />
          <button onClick={criarHosp} className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-1.5">+ Adicionar</button>
        </div>
      </section>
    </div>
  );
}

// Um campo de constante: rótulo + explicação (lembrete) + valor na unidade certa.
// Percentuais são guardados como fração (0.3) mas exibidos/editados como % (30).
function ConfigCampo({ config, onSalvar }: { config: Configuracao; onSalvar: (chave: string, valor: string) => void }) {
  const meta = META[config.chave];
  const unidade: Unidade | null = meta?.unidade ?? null;
  const label = meta?.label ?? config.descricao ?? config.chave;
  const desc = meta?.desc ?? config.descricao ?? "";
  const sufixo = unidade ? SUFIXO[unidade] : "";

  // Valor exibido na unidade do campo (percentual multiplica por 100).
  const exibido = unidade === "percent"
    ? Number((Number(config.valor) * 100).toFixed(2))
    : Number(config.valor);

  const inputCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100";

  function salvar(raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const armazenar = unidade === "percent" ? String(n / 100) : String(n);
    if (armazenar !== config.valor) onSalvar(config.chave, armazenar);
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          step={unidade === "percent" ? 1 : unidade === "horas" ? 0.5 : 1}
          min={0}
          defaultValue={exibido}
          onBlur={(e) => salvar(e.target.value)}
          className={inputCls + " w-24 text-right"}
        />
        <span className="text-xs text-gray-400 w-20">{sufixo}</span>
      </div>
    </div>
  );
}
