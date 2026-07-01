"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type { Erp, MetodoIntegracao, Modulo, Simulacao, Cliente, TipoHospedagem } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

export default function NovaSimulacao() {
  const router = useRouter();
  const [erps, setErps] = useState<Erp[]>([]);
  const [metodos, setMetodos] = useState<MetodoIntegracao[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [hospedagens, setHospedagens] = useState<TipoHospedagem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // form
  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState<number | "">("");
  const [numUsuarios, setNumUsuarios] = useState(25);
  const [erpId, setErpId] = useState<number | "">("");
  const [metodoId, setMetodoId] = useState<number | "">("");
  const [prodHomolog, setProdHomolog] = useState(false);
  const [hospedagemId, setHospedagemId] = useState<number | "">("");
  const [fases, setFases] = useState(1);
  const [fatorGestao, setFatorGestao] = useState(0.08);
  // Formato dos treinamentos
  const [numAdmins, setNumAdmins] = useState(1);
  const [numOperac, setNumOperac] = useState(25);
  const [numGestores, setNumGestores] = useState(1);
  const [tamTurmaOper, setTamTurmaOper] = useState(25);
  const [tamTurmaGestor, setTamTurmaGestor] = useState(10);
  const [etapasGolive, setEtapasGolive] = useState(1);
  const [formatoAdm, setFormatoAdm] = useState("Presencial");
  const [formatoOper, setFormatoOper] = useState("Presencial");
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [e, m, c, cl, hp] = await Promise.all([
          apiGet<{ erps: Erp[] }>("/catalogo/erps"),
          apiGet<{ metodos: MetodoIntegracao[] }>("/catalogo/metodos-integracao"),
          apiGet<{ modulos: Modulo[] }>("/catalogo/modulos"),
          apiGet<{ clientes: Cliente[] }>("/clientes"),
          apiGet<{ hospedagem: TipoHospedagem[] }>("/catalogo/hospedagem"),
        ]);
        setErps(e.erps);
        setMetodos(m.metodos);
        setModulos(c.modulos);
        setClientes(cl.clientes);
        setHospedagens(hp.hospedagem);
        if (e.erps[0]) setErpId(e.erps[0].id);
        if (m.metodos[0]) setMetodoId(m.metodos[0].id);
        if (hp.hospedagem[0]) setHospedagemId(hp.hospedagem[0].id);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar catálogo");
      }
    })();
  }, []);

  function toggleModulo(id: number) {
    setSelecionados((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nome.trim()) { setErro("Informe o nome do cliente/projeto."); return; }
    setSalvando(true);
    try {
      const data = await apiPost<{ simulacao: Simulacao }>("/simulacoes", {
        nome,
        cliente_id: clienteId || null,
        num_usuarios: numUsuarios,
        erp_id: erpId || null,
        metodo_integracao_id: metodoId || null,
        ambiente_prod_homolog: prodHomolog,
        hospedagem_id: hospedagemId || null,
        fases,
        fator_gestao: fatorGestao,
        num_administradores: numAdmins,
        num_operacionais: numOperac,
        num_gestores: numGestores,
        tam_turma_operacional: tamTurmaOper,
        tam_turma_gestor: tamTurmaGestor,
        etapas_golive: etapasGolive,
        formato_treino_adm: formatoAdm,
        formato_treino_oper: formatoOper,
        modulo_ids: [...selecionados],
      });
      router.push(`/simulacoes/${data.simulacao.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar");
      setSalvando(false);
    }
  }

  const inputCls = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-aliare-500";

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader titulo="Nova Simulação" descricao="Defina os parâmetros gerais e selecione os módulos contratados." />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      <form onSubmit={criar} className="space-y-6">
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Parâmetros gerais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente / Projeto</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} placeholder="Ex.: Fazenda São João" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : "")} className={inputCls}>
                <option value="">— sem cliente —</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº de usuários licenciados</label>
              <input type="number" min={0} value={numUsuarios} onChange={(e) => setNumUsuarios(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ERP do cliente</label>
              <select value={erpId} onChange={(e) => setErpId(Number(e.target.value))} className={inputCls}>
                {erps.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método de integração</label>
              <select value={metodoId} onChange={(e) => setMetodoId(Number(e.target.value))} className={inputCls}>
                {metodos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fases de implantação</label>
              <input type="number" min={1} value={fases} onChange={(e) => setFases(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fator de gestão de projeto</label>
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} step={0.5} value={Number((fatorGestao * 100).toFixed(2))} onChange={(e) => setFatorGestao(Number(e.target.value) / 100)} className={inputCls} />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <span className="text-[11px] text-gray-400">Percentual aplicado sobre as demais etapas. Ex.: 8 = 8%.</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de hospedagem</label>
              <select value={hospedagemId} onChange={(e) => setHospedagemId(e.target.value ? Number(e.target.value) : "")} className={inputCls}>
                <option value="">—</option>
                {hospedagens.map((hp) => <option key={hp.id} value={hp.id}>{hp.nome}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Será utilizado ambiente de homologação?</label>
              <select value={prodHomolog ? "sim" : "nao"} onChange={(e) => setProdHomolog(e.target.value === "sim")} className={inputCls}>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Formato dos Treinamentos</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Define as turmas de treinamento. O nº de operacionais e o tamanho da turma determinam quantas turmas — o que multiplica as horas de Go-Live.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº de administradores</label>
              <input type="number" min={0} value={numAdmins} onChange={(e) => setNumAdmins(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº de operacionais (vendedores)</label>
              <input type="number" min={0} value={numOperac} onChange={(e) => setNumOperac(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº de gestores</label>
              <input type="number" min={0} value={numGestores} onChange={(e) => setNumGestores(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tam. turma operacional</label>
              <input type="number" min={1} value={tamTurmaOper} onChange={(e) => setTamTurmaOper(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tam. turma gestor</label>
              <input type="number" min={1} value={tamTurmaGestor} onChange={(e) => setTamTurmaGestor(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etapas de Go-Live por fase</label>
              <input type="number" min={1} value={etapasGolive} onChange={(e) => setEtapasGolive(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato — Treino Adm/Config</label>
              <select value={formatoAdm} onChange={(e) => setFormatoAdm(e.target.value)} className={inputCls}>
                <option>Presencial</option><option>Remoto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato — Treino Operacional</label>
              <select value={formatoOper} onChange={(e) => setFormatoOper(e.target.value)} className={inputCls}>
                <option>Presencial</option><option>Remoto</option>
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-aliare-700 dark:text-aliare-300">
            → {numOperac > 0 ? Math.ceil(numOperac / (tamTurmaOper || 1)) * etapasGolive : etapasGolive} turma(s) operacional(is) · {numGestores > 0 ? Math.ceil(numGestores / (tamTurmaGestor || 1)) * etapasGolive : 0} turma(s) de gestor(es)
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Módulos contratados</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Ao contratar um módulo, suas funcionalidades do pacote padrão já entram marcadas. Você refina depois.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {modulos.map((m) => {
              const sel = selecionados.has(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggleModulo(m.id)}
                  className={
                    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors " +
                    (sel
                      ? "border-aliare-500 bg-aliare-50 dark:bg-aliare-900/30 text-aliare-800 dark:text-aliare-200"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200")
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{m.nome}</span>
                    <span className="block text-xs text-gray-400">{m.qtd_funcionalidades} func · {m.qtd_padrao} padrão</span>
                  </span>
                  <span className={"shrink-0 w-5 h-5 rounded flex items-center justify-center " + (sel ? "bg-aliare-600 text-white" : "border border-gray-300 dark:border-gray-600")}>
                    {sel && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/")} className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="rounded-md bg-aliare-600 hover:bg-aliare-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 transition-colors">
            {salvando ? "Criando…" : "Criar e continuar →"}
          </button>
        </div>
      </form>
    </div>
  );
}
