import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Só checa PRESENÇA do cookie `sess`. A validação real fica no backend.
const ROTAS_PUBLICAS = ["/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (ROTAS_PUBLICAS.includes(pathname)) return NextResponse.next();

  const temSessao = req.cookies.has("sess");
  if (!temSessao) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|icon\\.svg|.+\\.(?:png|jpe?g|webp|svg|gif|ico|avif|woff2?|ttf|otf)$).*)",
  ],
};
