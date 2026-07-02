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

const nomeCurtoModulo = (m: string) => m.replace("CRM - MM - ", "");

export default function IntegracaoPage() {
  return <AdminGuard><IntegracaoConteudo /></AdminGuard>;
}

function IntegracaoConteudo() {
  const { ehAdmin } = useAuth();
  const [contexto, setContexto] = useState("solution");
  const [fluxos, setFluxos] = useState<FluxoIntegracao[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<number | null>(null);

  // id da funcionalidade -> nome (para exibir os chips do vínculo).
  const funcById = new Map<number, string>();
  for (const m of modulos) for (const f of m.funcionalidades ?? []) funcById.set(f.id, f.nome);

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
      <PageHeader titulo="Fluxos de Integração" descricao="Horas por fluxo (Aliare Integra). Um fluxo conta nas horas quando alguma funcionalidade marcada na simulação o ativa." />
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
              <th className="px-2 py-3">Funcionalidades que ativam</th>
              {ehAdmin && <th className="px-2 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {fluxos.map((f) => {
              const ativas = f.funcionalidades_ativa ?? [];
              return (
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
                      {ativas.length === 0 && <span className="text-xs text-gray-400">nenhuma</span>}
                      {ativas.slice(0, 3).map((id) => <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{funcById.get(id) ?? `#${id}`}</span>)}
                      {ativas.length > 3 && <span className="text-[10px] text-gray-400">+{ativas.length - 3}</span>}
                      {ehAdmin && (
                        <button
                          onClick={() => setEditando(editando === f.id ? null : f.id)}
                          className="ml-1 rounded border border-aliare-300 dark:border-aliare-700 text-aliare-700 dark:text-aliare-300 hover:bg-aliare-50 dark:hover:bg-aliare-900/30 text-[11px] font-medium px-2 py-0.5"
                        >
                          {editando === f.id ? "Fechar" : "Editar funcionalidades"}
                        </button>
                      )}
                    </div>
                    {ehAdmin && editando === f.id && (
                      <EditorFuncionalidades
                        fluxo={f}
                        modulos={modulos}
                        onSalvar={(novo) => salvar(f, { funcionalidades_ativa: novo })}
                        onFechar={() => setEditando(null)}
                      />
                    )}
                  </td>
                  {ehAdmin && <td className="px-2 py-2 text-right"><button onClick={() => excluir(f)} className="text-xs text-red-500 hover:text-red-600">Excluir</button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Seletor de funcionalidades agrupadas por módulo, com busca e marcar/limpar.
// Controlado: `selecionadas` é o conjunto atual de IDs; `onAlterar` recebe o novo.
function SeletorFuncionalidades({ modulos, selecionadas, onAlterar }: { modulos: Modulo[]; selecionadas: Set<number>; onAlterar: (next: Set<number>) => void }) {
  const [busca, setBusca] = useState("");
  const q = busca.trim().toLowerCase();

  const grupos = modulos
    .map((m) => ({
      modulo: m,
      funcs: (m.funcionalidades ?? []).filter((f) => !q || f.nome.toLowerCase().includes(q) || nomeCurtoModulo(m.nome).toLowerCase().includes(q)),
    }))
    .filter((g) => g.funcs.length > 0);

  const todosIds = modulos.flatMap((m) => (m.funcionalidades ?? []).map((f) => f.id));

  function toggle(id: number) {
    const next = new Set(selecionadas);
    if (next.has(id)) next.delete(id); else next.add(id);
    onAlterar(next);
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar funcionalidade ou módulo…" className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-gray-100" />
        <span className="text-[10px] text-gray-400 whitespace-nowrap">{selecionadas.size} sel.</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => onAlterar(new Set(todosIds))} className="rounded border border-aliare-300 dark:border-aliare-700 text-aliare-700 dark:text-aliare-300 hover:bg-aliare-50 dark:hover:bg-aliare-900/30 text-[11px] font-medium px-2 py-0.5">Marcar todas</button>
        <button type="button" onClick={() => onAlterar(new Set())} disabled={selecionadas.size === 0} className="rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-medium px-2 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">Limpar seleção</button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {grupos.length === 0 && <div className="text-[10px] text-gray-400">nenhuma funcionalidade</div>}
        {grupos.map((g) => (
          <div key={g.modulo.id}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{nomeCurtoModulo(g.modulo.nome)}</div>
            <div className="space-y-1 pl-1">
              {g.funcs.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <input type="checkbox" checked={selecionadas.has(f.id)} onChange={() => toggle(f.id)} className="rounded accent-aliare-600 shrink-0" />
                  <span className="truncate">{f.nome}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EditorFuncionalidades({ fluxo, modulos, onSalvar, onFechar }: { fluxo: FluxoIntegracao; modulos: Modulo[]; onSalvar: (novo: number[]) => void; onFechar: () => void }) {
  // Estado local inicializado uma vez a partir do fluxo. Cada alteração salva o
  // conjunto completo a partir daqui (não do `fluxo`, possivelmente defasado),
  // evitando perda de marcações ao alternar várias em sequência.
  const [sel, setSel] = useState<Set<number>>(() => new Set(fluxo.funcionalidades_ativa ?? []));

  function aplicar(next: Set<number>) { setSel(next); onSalvar([...next]); }

  return (
    <div className="mt-2 p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-96 max-w-full">
      <div className="flex justify-end mb-1">
        <button type="button" onClick={onFechar} className="rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-[11px] font-medium px-2 py-0.5">Fechar</button>
      </div>
      <SeletorFuncionalidades modulos={modulos} selecionadas={sel} onAlterar={aplicar} />
    </div>
  );
}

function NovoFluxo({ contexto, modulos, onCriado, onErro }: { contexto: string; modulos: Modulo[]; onCriado: () => void; onErro: (s: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ fluxo: "", tabela: "", min_config: 0, min_teste_carga: 0, min_apoio: 0, min_validacao: 0 });
  const [funcsSel, setFuncsSel] = useState<Set<number>>(new Set());
  const inputCls = "rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100";

  async function criar() {
    if (!form.fluxo.trim() && !form.tabela.trim()) { onErro("Informe ao menos o nome do fluxo ou da tabela."); return; }
    try {
      await apiPost("/catalogo/fluxos-integracao", { contexto, ...form, funcionalidades_ativa: [...funcsSel] });
      setForm({ fluxo: "", tabela: "", min_config: 0, min_teste_carga: 0, min_apoio: 0, min_validacao: 0 });
      setFuncsSel(new Set());
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
        <div className="text-xs text-gray-500 mb-1.5">Funcionalidades que ativam este fluxo:</div>
        <SeletorFuncionalidades modulos={modulos} selecionadas={funcsSel} onAlterar={setFuncsSel} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setAberto(false)} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200">Cancelar</button>
        <button onClick={criar} className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-1.5">Criar fluxo</button>
      </div>
    </div>
  );
}
