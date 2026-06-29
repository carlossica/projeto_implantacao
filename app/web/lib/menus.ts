// Catálogo de menus do app. Fonte de verdade pra sidebar.

export type IconeNome = "dashboard" | "nova" | "catalogo" | "usuarios" | "integracao" | "clientes" | "lrp" | "config" | "docs";

export type MenuItem = { chave: string; label: string; icone: IconeNome; admin?: boolean };
export type MenuGrupo = { titulo: string; itens: MenuItem[] };

export const MENUS: MenuGrupo[] = [
  {
    titulo: "Simulações",
    itens: [
      { chave: "/", label: "Minhas Simulações", icone: "dashboard" },
      { chave: "/simulacoes/nova", label: "Nova Simulação", icone: "nova" },
    ],
  },
  {
    titulo: "Levantamento de Regras",
    itens: [
      { chave: "/lrp", label: "LRP", icone: "lrp" },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { chave: "/clientes", label: "Clientes", icone: "clientes" },
    ],
  },
  {
    titulo: "Catálogo",
    itens: [
      { chave: "/catalogo", label: "Módulos & Funcionalidades", icone: "catalogo", admin: true },
      { chave: "/integracao", label: "Fluxos de Integração", icone: "integracao", admin: true },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { chave: "/configuracoes", label: "Configurações Gerais", icone: "config", admin: true },
      { chave: "/usuarios", label: "Usuários", icone: "usuarios", admin: true },
    ],
  },
  {
    titulo: "Ajuda",
    itens: [
      { chave: "/como-funciona", label: "Como funciona", icone: "docs" },
    ],
  },
];
