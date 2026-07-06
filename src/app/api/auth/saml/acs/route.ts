import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { getSaml, extractSamlGroups } from "@/lib/saml";
import { prisma } from "@/lib/db";
import { mapIdpGroupsToRole, type Role } from "@/lib/rbac";

// Assertion Consumer Service: the IdP POSTs the signed SAML response here.
// We validate it, upsert the user with an IdP-group-derived role, then mint a
// NextAuth-compatible session cookie so the rest of the app treats SAML logins
// identically to OIDC/dev logins.
export async function POST(req: Request) {
  const saml = getSaml();
  if (!saml) {
    return new Response("SAML is not configured on this deployment.", { status: 501 });
  }

  const form = await req.formData();
  const samlResponse = String(form.get("SAMLResponse") ?? "");
  const relayState = String(form.get("RelayState") ?? "");

  let profile: Record<string, unknown>;
  try {
    const result = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse, RelayState: relayState });
    profile = (result.profile ?? {}) as Record<string, unknown>;
  } catch {
    return new Response("Invalid SAML assertion.", { status: 401 });
  }

  const email = String(profile.email ?? profile.nameID ?? "");
  if (!email) return new Response("SAML assertion missing email/NameID.", { status: 400 });

  const role: Role = mapIdpGroupsToRole(extractSamlGroups(profile));
  const nameID = typeof profile.nameID === "string" ? profile.nameID : undefined;

  const user = await prisma.user.upsert({
    where: { email },
    update: { ssoSubject: nameID, ssoProvider: "saml" },
    create: {
      email,
      name: String(profile.displayName ?? profile.cn ?? email),
      ssoSubject: nameID,
      ssoProvider: "saml",
      role,
    },
  });

  const secret = process.env.AUTH_SECRET!;
  const secure = process.env.NODE_ENV === "production";
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = await encode({
    token: { sub: user.id, uid: user.id, role: user.role as Role, email: user.email, name: user.name },
    secret,
    salt: cookieName,
    maxAge: 60 * 60 * 8,
  });

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return Response.redirect(new URL("/", req.url), 303);
}
