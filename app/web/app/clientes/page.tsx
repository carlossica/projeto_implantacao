"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Cliente } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

const VAZIO = { nome: "", cnpj: "", contato: "", email: "", telefone: "", observacoes: "" };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ ...VAZIO });
  const [editId, setEditId] = useState<number | null>(null);

  async function carregar() {
    try { setClientes((await apiGet<{ clientes: Cliente[] }>("/clientes")).clientes); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      if (editId) await apiPut(`/clientes/${editId}`, form);
      else await apiPost("/clientes", form);
      setForm({ ...VAZIO }); setEditId(null);
      carregar();
    } catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  function editar(c: Cliente) {
    setEditId(c.id);
    setForm({ nome: c.nome, cnpj: c.cnpj ?? "", contato: c.contato ?? "", email: c.email ?? "", telefone: c.telefone ?? "", observacoes: c.observacoes ?? "" });
  }

  async function excluir(c: Cliente) {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return;
    try { await apiDelete(`/clientes/${c.id}`); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  const inputCls = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-aliare-500";

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader titulo="Clientes" descricao="Cadastro básico de clientes para vincular às simulações." />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      <form onSubmit={salvar} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2"><label className="block text-xs text-gray-500 mb-1">Nome *</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} required /></div>
          <div><label className="block text-xs text-gray-500 mb-1">CNPJ</label><input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Contato</label><input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="flex justify-end gap-2">
          {editId && <button type="button" onClick={() => { setForm({ ...VAZIO }); setEditId(null); }} className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">Cancelar</button>}
          <button type="submit" className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-2">{editId ? "Salvar alterações" : "+ Adicionar cliente"}</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">CNPJ</th><th className="px-4 py-3">Contato</th><th className="px-4 py-3 text-center">Simulações</th><th className="px-4 py-3 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {clientes.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>}
            {clientes.map((c) => (
              <tr key={c.id} className="bg-white dark:bg-gray-950">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.nome}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.cnpj ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.contato ?? "—"}</td>
                <td className="px-4 py-3 text-center text-gray-500">{c.qtd_simulacoes ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => editar(c)} className="text-aliare-600 hover:text-aliare-700 mr-3">Editar</button>
                  <button onClick={() => excluir(c)} className="text-red-500 hover:text-red-600">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
