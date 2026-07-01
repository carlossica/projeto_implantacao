"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Modulo, Funcionalidade } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { AdminGuard } from "@/components/admin-guard";
import { horas } from "@/lib/format";

const TIPOS = ["Obrigatório", "Opcional", "Opcional, pode ser necessário"];

export default function CatalogoPage() {
  return <AdminGuard><CatalogoConteudo /></AdminGuard>;
}

function CatalogoConteudo() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);
  const [novoModulo, setNovoModulo] = useState("");

  async function carregar() {
    try {
      const data = await apiGet<{ modulos: Modulo[] }>("/catalogo/modulos");
      setModulos(data.modulos);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    }
  }
  useEffect(() => { carregar(); }, []);

  async function criarModulo(e: React.FormEvent) {
    e.preventDefault();
    if (!novoModulo.trim()) return;
    try {
      await apiPost("/catalogo/modulos", { nome: novoModulo.trim() });
      setNovoModulo("");
      carregar();
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  async function excluirModulo(m: Modulo) {
    if (!confirm(`Excluir o módulo "${m.nome}" e suas ${m.qtd_funcionalidades} funcionalidades?`)) return;
    try { await apiDelete(`/catalogo/modulos/${m.id}`); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  async function salvarFunc(f: Funcionalidade, campos: Partial<Funcionalidade>) {
    try {
      await apiPut(`/catalogo/funcionalidades/${f.id}`, campos);
      setModulos((mods) => mods.map((m) => ({
        ...m,
        funcionalidades: m.funcionalidades.map((x) => x.id === f.id ? { ...x, ...campos } : x),
      })));
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro ao salvar"); }
  }

  async function excluirFunc(f: Funcionalidade) {
    if (!confirm(`Excluir a funcionalidade "${f.nome}"?`)) return;
    try { await apiDelete(`/catalogo/funcionalidades/${f.id}`); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  async function criarFunc(moduloId: number, dados: { nome: string; tipo: string; horas_minutos: number; pacote_padrao: boolean }) {
    try {
      await apiPost("/catalogo/funcionalidades", { modulo_id: moduloId, ...dados });
      carregar();
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  const inputCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100";

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader titulo="Módulos & Funcionalidades" descricao="Mantenha o catálogo: crie módulos, funcionalidades, edite tipo, horas e pacote padrão." />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      <form onSubmit={criarModulo} className="flex gap-2 mb-5">
        <input value={novoModulo} onChange={(e) => setNovoModulo(e.target.value)} placeholder="Nome do novo módulo (ex.: CRM - MM - …)" className={inputCls + " flex-1 px-3 py-2"} />
        <button type="submit" className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-2">+ Novo módulo</button>
      </form>

      <div className="space-y-2">
        {modulos.map((m) => {
          const open = aberto === m.id;
          return (
            <div key={m.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => setAberto(open ? null : m.id)} className="flex-1 flex items-center gap-2 text-left">
                  <svg className={"w-4 h-4 text-gray-400 transition-transform " + (open ? "rotate-90" : "")} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.3 5.3a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 11-1.4-1.4L10.6 10 7.3 6.7a1 1 0 010-1.4z" clipRule="evenodd" /></svg>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{m.nome}</span>
                  <span className="text-xs text-gray-400">{m.qtd_funcionalidades} func · {m.qtd_padrao} padrão</span>
                </button>
                <button onClick={() => excluirModulo(m)} className="text-xs text-red-500 hover:text-red-600">Excluir módulo</button>
              </div>
              {open && (
                <div className="border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-400">
                      <tr><th className="px-4 py-2">Funcionalidade</th><th className="px-2 py-2 w-52">Tipo</th><th className="px-2 py-2 w-28">Horas (min)</th><th className="px-2 py-2 text-center">Padrão</th><th className="px-2 py-2"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {m.funcionalidades.map((f) => (
                        <tr key={f.id}>
                          <td className="px-4 py-2">
                            <input defaultValue={f.nome} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== f.nome) salvarFunc(f, { nome: e.target.value.trim() }); }} className={inputCls + " w-full"} />
                            {f.funcionalidade_mae && <span className="block text-[11px] text-gray-400 mt-0.5 px-1">{f.funcionalidade_mae}</span>}
                          </td>
                          <td className="px-2 py-2">
                            <select defaultValue={f.tipo ?? ""} onChange={(e) => salvarFunc(f, { tipo: e.target.value })} className={inputCls + " w-full"}>
                              {!TIPOS.includes(f.tipo ?? "") && f.tipo && <option value={f.tipo}>{f.tipo}</option>}
                              <option value="">—</option>
                              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min={0} defaultValue={f.horas_minutos} onBlur={(e) => { const v = Number(e.target.value); if (v !== f.horas_minutos) salvarFunc(f, { horas_minutos: v }); }} className={inputCls + " w-20"} />
                            <span className="ml-1 text-[11px] text-gray-400">{horas(f.horas_minutos / 60)}</span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input type="checkbox" checked={f.pacote_padrao} onChange={(e) => salvarFunc(f, { pacote_padrao: e.target.checked })} className="rounded accent-aliare-600" />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button onClick={() => excluirFunc(f)} className="text-xs text-red-500 hover:text-red-600">Excluir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <NovaFuncionalidadeRow onCriar={(d) => criarFunc(m.id, d)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NovaFuncionalidadeRow({ onCriar }: { onCriar: (d: { nome: string; tipo: string; horas_minutos: number; pacote_padrao: boolean }) => void }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Opcional");
  const [min, setMin] = useState(0);
  const [padrao, setPadrao] = useState(false);
  const inputCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100";
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova funcionalidade" className={inputCls + " flex-1 min-w-40"} />
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
        {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input type="number" min={0} value={min} onChange={(e) => setMin(Number(e.target.value))} className={inputCls + " w-20"} placeholder="min" />
      <label className="flex items-center gap-1 text-xs text-gray-500"><input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} className="rounded accent-aliare-600" /> padrão</label>
      <button onClick={() => { if (nome.trim()) { onCriar({ nome: nome.trim(), tipo, horas_minutos: min, pacote_padrao: padrao }); setNome(""); setMin(0); setPadrao(false); } }} className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-xs font-medium px-3 py-1.5">+ Adicionar</button>
    </div>
  );
}
