"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/page-header";

// Restringe uma página a administradores. Enquanto a sessão carrega não renderiza
// nada; para não-admins mostra um aviso de acesso restrito (sem montar o conteúdo,
// então as chamadas de API internas nem chegam a disparar).
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { ehAdmin, carregando } = useAuth();

  if (carregando) return null;

  if (!ehAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader titulo="Acesso restrito" descricao="Esta área é exclusiva para administradores." />
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-600 dark:text-gray-300">
          Você não tem permissão para acessar esta página. Fale com um administrador se precisar de acesso.
          <div className="mt-4">
            <Link href="/" className="rounded-md bg-aliare-600 hover:bg-aliare-700 text-white text-sm font-medium px-4 py-2 inline-block">
              Voltar para Minhas Simulações
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
