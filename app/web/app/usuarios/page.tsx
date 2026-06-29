"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Usuario, Papel } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", papel: "editor" as Papel });
  const [criando, setCriando] = useState(false);

  async function carregar() {
    try {
      const data = await apiGet<{ usuarios: Usuario[] }>("/usuarios");
      setUsuarios(data.usuarios);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    }
  }
  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCriando(true);
    try {
      await apiPost("/usuarios", form);
      setForm({ nome: "", email: "", senha: "", papel: "editor" });
      carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    } finally {
      setCriando(false);
    }
  }

  async function alternarAtivo(u: Usuario) {
    await apiPut(`/usuarios/${u.id}`, { ativo: !u.ativo });
    carregar();
  }

  async function excluir(u: Usuario) {
    if (!confirm(`Excluir ${u.nome}?`)) return;
    try { await apiDelete(`/usuarios/${u.id}`); carregar(); }
    catch (err) { setErro(err instanceof Error ? err.message : "Erro"); }
  }

  const inputCls = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-aliare-500";

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader titulo="Usuários" descricao="Gerencie quem acessa o simulador." />
      {erro && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{erro}</div>}

      <form onSubmit={criar} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 mb-6 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-1"><label className="block text-xs text-gray-500 mb-1">Nome</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} required /></div>
        <div className="sm:col-span-1"><label className="block text-xs text-gray-500 mb-1">E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required /></div>
        <div className="sm:col-span-1"><label className="block text-xs text-gray-500 mb-1">Senha</label><input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className={inputCls} required minLength={6} /></div>
        <div className="sm:col-span-1"><label className="block text-xs text-gray-500 mb-1">Papel</label>
          <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as Papel })} className={inputCls}>
            <option value="admin">Administrador</option>
            <option value="editor">Editor</option>
            <option value="visualizador">Visualizador</option>
          </select>
        </div>
        <button type="submit" disabled={criando} className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium py-2 disabled:opacity-60">Adicionar</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Papel</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {usuarios.map((u) => (
              <tr key={u.id} className="bg-white dark:bg-gray-950">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{u.nome}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{u.papel}</td>
                <td className="px-4 py-3">
                  <span className={"text-xs px-2 py-0.5 rounded " + (u.ativo ? "bg-aliare-100 text-aliare-700 dark:bg-aliare-900/40 dark:text-aliare-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800")}>{u.ativo ? "Ativo" : "Inativo"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => alternarAtivo(u)} className="text-aliare-600 hover:text-aliare-700 mr-3">{u.ativo ? "Desativar" : "Ativar"}</button>
                  <button onClick={() => excluir(u)} className="text-red-500 hover:text-red-600">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
