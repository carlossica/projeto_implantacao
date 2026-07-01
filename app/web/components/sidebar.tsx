"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AliareLogo } from "@/components/aliare-logo";
import { useAuth } from "@/components/auth-provider";
import { MENUS, type IconeNome } from "@/lib/menus";

const ICONES: Record<IconeNome, React.ReactNode> = {
  dashboard: <path fillRule="evenodd" d="M3 4a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h5a1 1 0 011 1v3a1 1 0 01-1 1h-5a1 1 0 01-1-1V4zm0 7a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5zm-8 4a1 1 0 011-1h5a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1z" clipRule="evenodd" />,
  nova: <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />,
  catalogo: <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm1 4a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />,
  usuarios: <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />,
  integracao: <path fillRule="evenodd" d="M11 3a1 1 0 10-2 0v1.5a4.5 4.5 0 00-2.6 7.7l-1 1a1 1 0 101.4 1.4l1-1A4.5 4.5 0 0011 15.5V17a1 1 0 102 0v-1.5a4.5 4.5 0 002.6-7.7l1-1a1 1 0 10-1.4-1.4l-1 1A4.5 4.5 0 0011 4.5V3z" clipRule="evenodd" />,
  clientes: <path fillRule="evenodd" d="M7 8a3 3 0 100-6 3 3 0 000 6zm6 1a2 2 0 100-4 2 2 0 000 4zM5.5 9A4.5 4.5 0 001 13.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5 4.5 4.5 0 00-7.5-3.35A4.48 4.48 0 005.5 9zm9 0c-.38 0-.74.05-1.09.14A5.5 5.5 0 0114.9 14h3.6a.5.5 0 00.5-.5A4.5 4.5 0 0014.5 9z" clipRule="evenodd" />,
  lrp: <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.5L12.5 2H4zm7 1.5V7a1 1 0 001 1h3.5L11 3.5zM6 10a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h5a1 1 0 100-2H6z" clipRule="evenodd" />,
  config: <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />,
  docs: <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />,
};

export function Sidebar({ recolhido = false }: { recolhido?: boolean }) {
  const pathname = usePathname();
  const { usuario } = useAuth();
  const ehAdmin = !!usuario && usuario.papel === "admin";

  const secoes = MENUS.map((g) => ({
    titulo: g.titulo,
    itens: g.itens.filter((it) => !it.admin || ehAdmin),
  })).filter((s) => s.itens.length > 0);

  return (
    <aside className={"shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col transition-[width] duration-200 " + (recolhido ? "w-16" : "w-72")}>
      <div className={"h-14 shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 " + (recolhido ? "justify-center px-0" : "px-4")}>
        {recolhido ? (
          <span className="w-8 h-8 rounded-md bg-aliare-600 text-white text-xs font-bold flex items-center justify-center" title="Simulador Clover">SC</span>
        ) : (
          <>
            <AliareLogo className="h-5 w-auto shrink-0 block dark:hidden" />
            <AliareLogo variant="light" className="h-5 w-auto shrink-0 hidden dark:block" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-none">
              Simulador Clover
            </span>
          </>
        )}
      </div>

      <nav className={"flex-1 pt-6 pb-4 space-y-6 overflow-y-auto overflow-x-hidden " + (recolhido ? "px-2" : "px-3")}>
        {secoes.map((secao) => (
          <div key={secao.titulo}>
            {!recolhido && (
              <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {secao.titulo}
              </div>
            )}
            <ul className="space-y-0.5">
              {secao.itens.map((item) => {
                const ativo =
                  pathname === item.chave ||
                  (item.chave !== "/" && pathname.startsWith(item.chave));
                return (
                  <li key={item.chave}>
                    <Link
                      href={item.chave}
                      title={recolhido ? item.label : undefined}
                      className={
                        "flex items-center gap-2.5 rounded-md py-2 text-sm transition-colors " +
                        (recolhido ? "justify-center px-0" : "px-3") + " " +
                        (ativo
                          ? "bg-aliare-600 text-white font-medium"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800")
                      }
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        {ICONES[item.icone]}
                      </svg>
                      {!recolhido && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
