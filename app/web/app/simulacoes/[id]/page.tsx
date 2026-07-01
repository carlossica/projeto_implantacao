"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPut, apiPost } from "@/lib/api";
import type { Modulo, Simulacao, Erp, MetodoIntegracao, Cliente, Lrp, TipoHospedagem } from "@/lib/types";
import { horas } from "@/lib/format";

export default function EditarSimulacao() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [gerandoLrp, setGerandoLrp] = useState(false);

  const [sim, setSim] = useState<Simulacao | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [erps, setErps] = useState<Erp[]>([]);
  const [metodos, setMetodos] = useState<MetodoIntegracao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [hospedagens, setHospedagens] = useState<TipoHospedagem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Set<number>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [paramsAbertos, setParamsAbertos] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [s, c, e, m, cl, hp] = await Promise.all([
        apiGet<{ simulacao: Simulacao }>(`/simulacoes/${id}`),
        apiGet<{ modulos: Modulo[] }>("/catalogo/modulos"),
        apiGet<{ erps: Erp[] }>("/catalogo/erps"),
        apiGet<{ metodos: MetodoIntegracao[] }>("/catalogo/metodos-integracao"),
        apiGet<{ clientes: Cliente[] }>("/clientes"),
        apiGet<{ hospedagem: TipoHospedagem[] }>("/catalogo/hospedagem"),
      ]);
      setSim(s.simulacao);
      setModulos(c.modulos);
      setErps(e.erps);
      setMetodos(m.metodos);
      setClientes(cl.clientes);
      setHospedagens(hp.hospedagem);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarParametros(campos: Partial<Simulacao>) {
    setSalvando(true);
    setMsg(null);
    try {
      const data = await apiPut<{ simulacao: Simulacao }>(`/simulacoes/${id}`, campos);
      setSim(data.simulacao);
      setMsg("Parâmetros salvos.");
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  const contratados = useMemo(() => new Set(sim?.modulos_contratados ?? []), [sim]);
  const marcadas = useMemo(() => new Set(sim?.funcionalidades_marcadas ?? []), [sim]);

  async function toggleModulo(moduloId: number) {
    if (!sim) return;
    setSalvando(true);
    const novo = new Set(contratados);
    if (novo.has(moduloId)) novo.delete(moduloId); else { novo.add(moduloId); setAberto((a) => new Set(a).add(moduloId)); }
    try {
      const data = await apiPut<{ simulacao: Simulacao }>(`/simulacoes/${id}/modulos`, { modulo_ids: [...novo] });
      setSim(data.simulacao);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  async function toggleFunc(funcId: number, marcar: boolean) {
    setSalvando(true);
    try {
      const data = await apiPut<{ simulacao: Simulacao }>(`/simulacoes/${id}/funcionalidades/${funcId}`, { marcado: marcar });
      setSim(data.simulacao);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  function toggleAccordion(moduloId: number) {
    setAberto((a) => {
      const n = new Set(a);
      if (n.has(moduloId)) n.delete(moduloId); else n.add(moduloId);
      return n;
    });
  }

  if (erro) return <div className="text-sm text-red-600 dark:text-red-400">{erro}</div>;
  if (!sim) return <div className="text-sm text-gray-500 dark:text-gray-400">Carregando…</div>;

  const r = sim.resultado;
  const modulosContratados = modulos.filter((m) => contratados.has(m.id));
  const modulosDisponiveis = modulos.filter((m) => !contratados.has(m.id));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <Link href="/" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-aliare-600">← Voltar</Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{sim.nome}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sim.cliente_nome ? `${sim.cliente_nome} · ` : ""}{sim.erp_nome ?? "—"} · {sim.metodo_nome ?? "sem integração"} · {sim.num_usuarios} usuários
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {msg && <span className="text-xs text-aliare-600">{msg}</span>}
          {salvando && <span className="text-xs text-gray-400">salvando…</span>}
          <button onClick={() => setParamsAbertos((v) => !v)} className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
            {paramsAbertos ? "Fechar parâmetros" : "Editar parâmetros"}
          </button>
          <button
            onClick={async () => {
              if ((sim.modulos_contratados?.length ?? 0) === 0) { setErro("Contrate ao menos um módulo antes de gerar a LRP."); return; }
              setGerandoLrp(true); setErro(null);
              try {
                const data = await apiPost<{ lrp: Lrp }>("/lrp/gerar", { simulacao_id: id });
                router.push(`/lrp/${data.lrp.id}`);
              } catch (err) { setErro(err instanceof Error ? err.message : "Erro ao gerar LRP"); setGerandoLrp(false); }
            }}
            disabled={gerandoLrp}
            className="rounded-md bg-aliare-600 hover:bg-aliare-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5"
          >
            {gerandoLrp ? "Gerando…" : "Gerar LRP"}
          </button>
        </div>
      </div>

      {paramsAbertos && (
        <ParametrosPanel
          sim={sim}
          erps={erps}
          metodos={metodos}
          clientes={clientes}
          hospedagens={hospedagens}
          salvando={salvando}
          onSalvar={salvarParametros}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Coluna esquerda: módulos e funcionalidades */}
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Módulos contratados ({modulosContratados.length})
            </h2>
            {modulosContratados.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Nenhum módulo contratado ainda. Adicione abaixo.</p>
            )}
            <div className="space-y-2">
              {modulosContratados.map((m) => {
                const aberta = aberto.has(m.id);
                const qtdMarc = m.funcionalidades.filter((f) => marcadas.has(f.id)).length;
                return (
                  <div key={m.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button onClick={() => toggleAccordion(m.id)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                        <svg className={"w-4 h-4 text-gray-400 transition-transform " + (aberta ? "rotate-90" : "")} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.3 5.3a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 11-1.4-1.4L10.6 10 7.3 6.7a1 1 0 010-1.4z" clipRule="evenodd" /></svg>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray-900 dark:text-gray-100">{m.nome}</span>
                          <span className="block text-xs text-gray-400">{qtdMarc}/{m.funcionalidades.length} funcionalidades marcadas</span>
                        </span>
                      </button>
                      <button onClick={() => toggleModulo(m.id)} className="shrink-0 text-xs text-red-500 hover:text-red-600">Remover</button>
                    </div>
                    {aberta && (
                      <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50 max-h-96 overflow-y-auto">
                        {m.funcionalidades.map((f) => {
                          const on = marcadas.has(f.id);
                          return (
                            <label key={f.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                              <input type="checkbox" checked={on} onChange={(e) => toggleFunc(f.id, e.target.checked)} className="rounded accent-aliare-600" />
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm text-gray-800 dark:text-gray-200 truncate">{f.nome}</span>
                                {f.funcionalidade_mae && <span className="block text-[11px] text-gray-400 truncate">{f.funcionalidade_mae}</span>}
                              </span>
                              {f.tipo && <span className={"shrink-0 text-[10px] px-1.5 py-0.5 rounded " + (f.tipo.toLowerCase().startsWith("obrigat") ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400")}>{f.tipo}</span>}
                              <span className="shrink-0 text-xs text-gray-400 w-14 text-right">{horas(f.horas_minutos / 60)}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {modulosDisponiveis.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Adicionar módulos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modulosDisponiveis.map((m) => (
                  <button key={m.id} onClick={() => toggleModulo(m.id)} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.nome}</span>
                      <span className="block text-xs text-gray-400">{m.qtd_funcionalidades} func · {m.qtd_padrao} padrão</span>
                    </span>
                    <span className="shrink-0 text-aliare-600 font-bold">+</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Coluna direita: resultado (sticky) */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Estimativa de horas</h2>
            {r ? (
              <>
                <div className="text-center mb-5">
                  <div className="text-3xl font-bold text-aliare-600 dark:text-aliare-400">{horas(r.horas.total)}</div>
                  <div className="text-xs text-gray-400 mt-1">total estimado</div>
                </div>
                <dl className="space-y-2 text-sm">
                  <Linha label="Gerenciamento de Projeto" valor={horas(r.horas.gestao)} />
                  <Linha label="Instalação" valor={horas(r.horas.instalacao)} />
                  <Linha label="Implantação" valor={horas(r.horas.implantacao)} />
                  {/* Etapas da implantação (igual à planilha) */}
                  <div className="pl-3 border-l-2 border-gray-100 dark:border-gray-800 space-y-1 py-1">
                    <SubLinha label="LRP" valor={horas(r.etapas.lrp)} />
                    <SubLinha label="Validação de dados" valor={horas(r.etapas.validacao_dados)} />
                    <SubLinha label="Parametrização" valor={horas(r.etapas.parametrizacao)} />
                    <SubLinha label="Treinamento" valor={horas(r.etapas.treinamento)} />
                    <SubLinha label="Validação de ambiente" valor={horas(r.etapas.validacao_ambiente)} />
                    <SubLinha label={`Go-Live (${r.treinamento.turmas_operacionais}×)`} valor={horas(r.etapas.golive)} />
                    <SubLinha label="Acomp. Go-Live" valor={horas(r.etapas.acomp_golive)} />
                    <SubLinha label="Pós-Produção" valor={horas(r.etapas.pos_producao)} />
                  </div>
                  <Linha label="Integração Técnica" valor={horas(r.horas.integracao)} />
                  <Linha label="Adequações" valor={horas(r.horas.adequacoes)} />
                </dl>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Treinamento: {r.treinamento.turmas_operacionais} turma(s) operacional(is){r.treinamento.turmas_gestores ? `, ${r.treinamento.turmas_gestores} de gestores` : ""}</div>
                  {r.parametros.prod_homolog && <div className="text-amber-600 dark:text-amber-400">Prod+Homologação ativo (+ instalação e + validação/parametrização)</div>}
                  <div>{r.parametros.qtd_funcionalidades_marcadas} funcionalidades marcadas</div>
                </div>

                {r.por_modulo.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Horas por módulo</div>
                    <ul className="space-y-1.5">
                      {r.por_modulo.map((pm) => (
                        <li key={pm.modulo_id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-300 truncate">{pm.modulo.replace("CRM - MM - ", "")}</span>
                          <span className="text-gray-500 dark:text-gray-400 shrink-0">{horas(pm.horas)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-gray-600 dark:text-gray-300">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-gray-100">{valor}</dd>
    </div>
  );
}

function SubLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-500 dark:text-gray-400">{valor}</span>
    </div>
  );
}

function ParametrosPanel({
  sim, erps, metodos, clientes, hospedagens, salvando, onSalvar,
}: {
  sim: Simulacao;
  erps: Erp[];
  metodos: MetodoIntegracao[];
  clientes: Cliente[];
  hospedagens: TipoHospedagem[];
  salvando: boolean;
  onSalvar: (campos: Partial<Simulacao>) => void;
}) {
  const [f, setF] = useState({
    nome: sim.nome,
    cliente_id: sim.cliente_id ?? ("" as number | ""),
    num_usuarios: sim.num_usuarios,
    erp_id: sim.erp_id ?? ("" as number | ""),
    metodo_integracao_id: sim.metodo_integracao_id ?? ("" as number | ""),
    hospedagem_id: sim.hospedagem_id ?? ("" as number | ""),
    fases: sim.fases ?? 1,
    fator_gestao: Number(sim.fator_gestao ?? 0.08),
    ambiente_prod_homolog: sim.ambiente_prod_homolog,
    num_administradores: sim.num_administradores ?? 1,
    num_operacionais: sim.num_operacionais ?? 0,
    num_gestores: sim.num_gestores ?? 1,
    tam_turma_operacional: sim.tam_turma_operacional ?? 25,
    tam_turma_gestor: sim.tam_turma_gestor ?? 10,
    etapas_golive: sim.etapas_golive ?? 1,
    formato_treino_adm: sim.formato_treino_adm ?? "Presencial",
    formato_treino_oper: sim.formato_treino_oper ?? "Presencial",
  });
  const inputCls = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-aliare-500";

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs text-gray-500 mb-1">Nome</label>
          <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Cliente</label>
          <select value={f.cliente_id} onChange={(e) => setF({ ...f, cliente_id: e.target.value ? Number(e.target.value) : "" })} className={inputCls}>
            <option value="">— sem cliente —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nº usuários</label>
          <input type="number" min={0} value={f.num_usuarios} onChange={(e) => setF({ ...f, num_usuarios: Number(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ERP</label>
          <select value={f.erp_id} onChange={(e) => setF({ ...f, erp_id: e.target.value ? Number(e.target.value) : "" })} className={inputCls}>
            <option value="">—</option>
            {erps.map((er) => <option key={er.id} value={er.id}>{er.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Método de integração</label>
          <select value={f.metodo_integracao_id} onChange={(e) => setF({ ...f, metodo_integracao_id: e.target.value ? Number(e.target.value) : "" })} className={inputCls}>
            <option value="">—</option>
            {metodos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fases de implantação</label>
          <input type="number" min={1} value={f.fases} onChange={(e) => setF({ ...f, fases: Number(e.target.value) })} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fator de gestão de projeto (%)</label>
          <div className="flex items-center gap-1.5">
            <input type="number" min={0} step={0.5} value={Number((f.fator_gestao * 100).toFixed(2))} onChange={(e) => setF({ ...f, fator_gestao: Number(e.target.value) / 100 })} className={inputCls} />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo de hospedagem</label>
          <select value={f.hospedagem_id} onChange={(e) => setF({ ...f, hospedagem_id: e.target.value ? Number(e.target.value) : "" })} className={inputCls}>
            <option value="">—</option>
            {hospedagens.map((hp) => <option key={hp.id} value={hp.id}>{hp.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Será utilizado ambiente de homologação?</label>
          <select value={f.ambiente_prod_homolog ? "sim" : "nao"} onChange={(e) => setF({ ...f, ambiente_prod_homolog: e.target.value === "sim" })} className={inputCls}>
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Formato dos Treinamentos</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">Administradores</label><input type="number" min={0} value={f.num_administradores} onChange={(e) => setF({ ...f, num_administradores: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Operacionais</label><input type="number" min={0} value={f.num_operacionais} onChange={(e) => setF({ ...f, num_operacionais: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Gestores</label><input type="number" min={0} value={f.num_gestores} onChange={(e) => setF({ ...f, num_gestores: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Etapas Go-Live</label><input type="number" min={1} value={f.etapas_golive} onChange={(e) => setF({ ...f, etapas_golive: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Turma operacional</label><input type="number" min={1} value={f.tam_turma_operacional} onChange={(e) => setF({ ...f, tam_turma_operacional: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Turma gestor</label><input type="number" min={1} value={f.tam_turma_gestor} onChange={(e) => setF({ ...f, tam_turma_gestor: Number(e.target.value) })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Formato Adm</label><select value={f.formato_treino_adm} onChange={(e) => setF({ ...f, formato_treino_adm: e.target.value })} className={inputCls}><option>Presencial</option><option>Remoto</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">Formato Operac.</label><select value={f.formato_treino_oper} onChange={(e) => setF({ ...f, formato_treino_oper: e.target.value })} className={inputCls}><option>Presencial</option><option>Remoto</option></select></div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => onSalvar({ ...f, cliente_id: f.cliente_id === "" ? null : Number(f.cliente_id), erp_id: f.erp_id === "" ? null : Number(f.erp_id), metodo_integracao_id: f.metodo_integracao_id === "" ? null : Number(f.metodo_integracao_id), hospedagem_id: f.hospedagem_id === "" ? null : Number(f.hospedagem_id) })}
          disabled={salvando}
          className="rounded-md bg-aliare-600 hover:bg-aliare-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2"
        >
          {salvando ? "Salvando…" : "Salvar parâmetros"}
        </button>
      </div>
    </section>
  );
}
