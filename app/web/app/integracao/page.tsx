"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { FluxoIntegracao, Modulo } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { horas } from "@/lib/format";
import { useAuth } from "@/components/auth-provider";
import { AdminGuard } from "@/components/admin-guard";

const CONTEXTOS = [
  { chave: "solution", label: "Aliare Integra Solution" },
  { chave: "erp_terceiro", label: "ERP Terceiro" },
];

export default function IntegracaoPage() {
  return <AdminGuard><IntegracaoConteudo /></AdminGuard>;
}

function IntegracaoConteudo() {
  const { ehAdmin } = useAuth();
  const [contexto, setContexto] = useState("solution");
  const [fluxos, setFluxos] = useState<FluxoIntegracao[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoModulos, setEditandoModulos] = useState<number | null>(null);

  async function carregar() {
    try {
      const data = await apiGet<{ fluxos: FluxoIntegracao[] }>(`/catalogo/fluxos-integracao?contexto=${contexto}`);
      setFluxos(data.fluxos);
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  useEffect(() => { carregar(); }, [contexto]);
  useEffect(() => { apiGet<{ modulos: Modulo[] }>("/catalogo/modulos").then((d) => setModulos(d.modulos)).catch(() => {}); }, []);

  async function salvar(f: FluxoIntegracao, campos: Partial<FluxoIntegracao>) {
    try {
      const data = await apiPut<{ fluxo: FluxoIntegracao }>(`/catalogo/fluxos-integracao/${f.id}`, campos);
      setFluxos((fs) => fs.map((x) => x.id === f.id ? data.fluxo : x));
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  async function excluir(f: FluxoIntegracao) {
    if (!confirm(`Excluir o fluxo "${f.fluxo ?? f.tabela ?? f.id}"?`)) return;
    try { await apiDelete(`/catalogo/fluxos-integracao/${f.id}`); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  const totalMin = fluxos.reduce((s, f) => s + f.min_config + f.min_teste_carga + f.min_apoio + f.min_validacao, 0);
  const numCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1.5 py-1 text-sm text-gray-900 dark:text-gray-100 w-16 text-right";

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader titulo="Fluxos de Integração" descricao="Horas por fluxo (Aliare Integra). Um fluxo conta nas horas quando algum módulo contratado o ativa." />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      <div className="flex items-center gap-2 mb-4">
        {CONTEXTOS.map((c) => (
          <button key={c.chave} onClick={() => setContexto(c.chave)} className={"rounded-md px-3 py-1.5 text-sm font-medium " + (contexto === c.chave ? "bg-aliare-600 text-white" : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            {c.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{fluxos.length} fluxos · total {horas(totalMin / 60)}</span>
      </div>

      {ehAdmin && <NovoFluxo contexto={contexto} modulos={modulos} onCriado={carregar} onErro={setErro} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">Fluxo / Tabela</th>
              <th className="px-2 py-3 text-right">Config</th><th className="px-2 py-3 text-right">Teste/Carga</th>
              <th className="px-2 py-3 text-right">Apoio</th><th className="px-2 py-3 text-right">Validação</th>
              <th className="px-2 py-3">Módulos que ativam</th>
              {ehAdmin && <th className="px-2 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {fluxos.map((f) => (
              <tr key={f.id} className="bg-white dark:bg-gray-950 align-top">
                <td className="px-4 py-2">
                  <span className="block text-gray-700 dark:text-gray-200">{f.fluxo ?? "—"}</span>
                  <span className="block text-xs text-gray-400">{f.tabela ?? ""}</span>
                </td>
                {(["min_config", "min_teste_carga", "min_apoio", "min_validacao"] as const).map((campo) => (
                  <td key={campo} className="px-2 py-2 text-right">
                    {ehAdmin ? (
                      <input type="number" min={0} defaultValue={f[campo]} onBlur={(e) => { const v = Number(e.target.value); if (v !== f[campo]) salvar(f, { [campo]: v }); }} className={numCls} />
                    ) : (f[campo] ? horas(f[campo] / 60) : "—")}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1 items-center">
                    {f.modulos_ativa.length === 0 && <span className="text-xs text-gray-400">nenhum</span>}
                    {f.modulos_ativa.slice(0, 3).map((m) => <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{m.replace("CRM - MM - ", "")}</span>)}
                    {f.modulos_ativa.length > 3 && <span className="text-[10px] text-gray-400">+{f.modulos_ativa.length - 3}</span>}
                    {ehAdmin && (
                      <button
                        onClick={() => setEditandoModulos(editandoModulos === f.id ? null : f.id)}
                        className="ml-1 rounded border border-aliare-300 dark:border-aliare-700 text-aliare-700 dark:text-aliare-300 hover:bg-aliare-50 dark:hover:bg-aliare-900/30 text-[11px] font-medium px-2 py-0.5"
                      >
                        {editandoModulos === f.id ? "Fechar" : "Editar módulos"}
                      </button>
                    )}
                  </div>
                  {ehAdmin && editandoModulos === f.id && (
                    <EditorModulos
                      fluxo={f}
                      modulos={modulos}
                      onSalvar={(novo) => salvar(f, { modulos_ativa: novo })}
                      onFechar={() => setEditandoModulos(null)}
                    />
                  )}
                </td>
                {ehAdmin && <td className="px-2 py-2 text-right"><button onClick={() => excluir(f)} className="text-xs text-red-500 hover:text-red-600">Excluir</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditorModulos({ fluxo, modulos, onSalvar, onFechar }: { fluxo: FluxoIntegracao; modulos: Modulo[]; onSalvar: (novo: string[]) => void; onFechar: () => void }) {
  // Estado local inicializado uma vez a partir do fluxo. Cada alteração salva o
  // conjunto completo a partir daqui (não do `fluxo`, que pode estar defasado),
  // evitando perda de marcações ao alternar vários módulos em sequência.
  const [sel, setSel] = useState<Set<string>>(() => new Set(fluxo.modulos_ativa));
  const [busca, setBusca] = useState("");
  const nomeCurto = (m: string) => m.replace("CRM - MM - ", "");
  const filtrados = modulos.filter((m) => nomeCurto(m.nome).toLowerCase().includes(busca.trim().toLowerCase()));

  function aplicar(next: Set<string>) { setSel(next); onSalvar([...next]); }
  function toggle(nome: string) {
    const next = new Set(sel);
    if (next.has(nome)) next.delete(nome); else next.add(nome);
    aplicar(next);
  }

  return (
    <div className="mt-2 p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-72">
      <div className="flex items-center gap-2 mb-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar módulo…" className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-gray-100" />
        <span className="text-[10px] text-gray-400 whitespace-nowrap">{sel.size} sel.</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => aplicar(new Set(modulos.map((m) => m.nome)))} className="rounded border border-aliare-300 dark:border-aliare-700 text-aliare-700 dark:text-aliare-300 hover:bg-aliare-50 dark:hover:bg-aliare-900/30 text-[11px] font-medium px-2 py-0.5">Marcar todos</button>
        <button type="button" onClick={() => aplicar(new Set())} disabled={sel.size === 0} className="rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-medium px-2 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">Limpar seleção</button>
        <button type="button" onClick={onFechar} className="ml-auto rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-medium px-2 py-0.5">Fechar</button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtrados.length === 0 && <div className="text-[10px] text-gray-400">nenhum módulo</div>}
        {filtrados.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={sel.has(m.nome)} onChange={() => toggle(m.nome)} className="rounded accent-aliare-600" />
            {nomeCurto(m.nome)}
          </label>
        ))}
      </div>
    </div>
  );
}

function NovoFluxo({ contexto, modulos, onCriado, onErro }: { contexto: string; modulos: Modulo[]; onCriado: () => void; onErro: (s: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ fluxo: "", tabela: "", min_config: 0, min_teste_carga: 0, min_apoio: 0, min_validacao: 0 });
  const [mods, setMods] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const inputCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100";
  const nomeCurto = (m: string) => m.replace("CRM - MM - ", "");
  const filtrados = modulos.filter((m) => nomeCurto(m.nome).toLowerCase().includes(busca.trim().toLowerCase()));

  async function criar() {
    if (!form.fluxo.trim() && !form.tabela.trim()) { onErro("Informe ao menos o nome do fluxo ou da tabela."); return; }
    try {
      await apiPost("/catalogo/fluxos-integracao", { contexto, ...form, modulos_ativa: [...mods] });
      setForm({ fluxo: "", tabela: "", min_config: 0, min_teste_carga: 0, min_apoio: 0, min_validacao: 0 });
      setMods(new Set());
      setBusca("");
      setAberto(false);
      onCriado();
    } catch (err) { onErro(err instanceof Error ? err.message : "Erro"); }
  }

  if (!aberto) {
    return <button onClick={() => setAberto(true)} className="mb-4 rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-2">+ Novo fluxo</button>;
  }

  return (
    <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <input value={form.fluxo} onChange={(e) => setForm({ ...form, fluxo: e.target.value })} placeholder="Fluxo (grupo)" className={inputCls + " col-span-2"} />
        <input value={form.tabela} onChange={(e) => setForm({ ...form, tabela: e.target.value })} placeholder="Tabela" className={inputCls + " col-span-2"} />
        <input type="number" min={0} value={form.min_config} onChange={(e) => setForm({ ...form, min_config: Number(e.target.value) })} placeholder="Config (min)" className={inputCls} />
        <input type="number" min={0} value={form.min_teste_carga} onChange={(e) => setForm({ ...form, min_teste_carga: Number(e.target.value) })} placeholder="Teste (min)" className={inputCls} />
        <input type="number" min={0} value={form.min_apoio} onChange={(e) => setForm({ ...form, min_apoio: Number(e.target.value) })} placeholder="Apoio (min)" className={inputCls} />
        <input type="number" min={0} value={form.min_validacao} onChange={(e) => setForm({ ...form, min_validacao: Number(e.target.value) })} placeholder="Validação (min)" className={inputCls} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-xs text-gray-500">Módulos que ativam este fluxo:</div>
          <span className="text-[10px] text-gray-400">{mods.size} selecionado(s)</span>
          <button type="button" onClick={() => setMods(new Set(modulos.map((m) => m.nome)))} className="ml-auto rounded border border-aliare-300 dark:border-aliare-700 text-aliare-700 dark:text-aliare-300 hover:bg-aliare-50 dark:hover:bg-aliare-900/30 text-[11px] font-medium px-2 py-0.5">Marcar todos</button>
          <button
            type="button"
            onClick={() => setMods(new Set())}
            disabled={mods.size === 0}
            className="rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-medium px-2 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Limpar seleção
          </button>
        </div>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar módulo…" className={inputCls + " w-full mb-1.5 text-xs"} />
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filtrados.length === 0 && <span className="text-xs text-gray-400">nenhum módulo</span>}
          {filtrados.map((m) => {
            const on = mods.has(m.nome);
            return (
              <button key={m.id} type="button" onClick={() => setMods((cur) => { const n = new Set(cur); if (n.has(m.nome)) n.delete(m.nome); else n.add(m.nome); return n; })} className={"text-xs px-2 py-1 rounded border " + (on ? "border-aliare-500 bg-aliare-50 dark:bg-aliare-900/30 text-aliare-700 dark:text-aliare-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300")}>
                {nomeCurto(m.nome)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => { setAberto(false); setBusca(""); }} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200">Cancelar</button>
        <button onClick={criar} className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-1.5">Criar fluxo</button>
      </div>
    </div>
  );
}
