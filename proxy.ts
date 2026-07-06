import { auth } from "@/auth";

// Next.js 16 renamed `middleware` → `proxy` (nodejs runtime). This gate keeps
// every route behind authentication except the login page and the auth
// endpoints (NextAuth handlers + SAML SP endpoints).
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/entity-logos") ||
    pathname === "/favicon.ico";

  if (!req.auth && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
