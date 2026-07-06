import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { ROLES, type Role, mapIdpGroupsToRole } from "@/lib/rbac";
import type { AppRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
  }
}

/**
 * A generic OIDC / OAuth 2.0 provider. Configured entirely from env so it can
 * front Azure AD, Okta, or the UAE PASS national broker without code changes.
 * Only registered when OIDC_ISSUER + client credentials are present.
 */
function oidcProvider() {
  if (!process.env.OIDC_ISSUER || !process.env.OIDC_CLIENT_ID) return [];
  return [
    {
      id: "oidc",
      name: "Government SSO",
      type: "oidc" as const,
      issuer: process.env.OIDC_ISSUER,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: { params: { scope: "openid profile email groups" } },
      checks: ["pkce" as const, "state" as const],
      profile(profile: Record<string, unknown>) {
        const groups = Array.isArray(profile.groups)
          ? (profile.groups as string[])
          : typeof profile.roles === "string"
            ? [profile.roles as string]
            : [];
        return {
          id: String(profile.sub),
          name: String(profile.name ?? profile.preferred_username ?? profile.email),
          email: String(profile.email ?? ""),
          role: mapIdpGroupsToRole(groups),
        };
      },
    },
  ];
}

/**
 * Dev-only credentials login: pick a role and get a matching seeded user.
 * Disabled automatically in production (ENABLE_DEV_LOGIN must be "true").
 */
function devProvider() {
  if (process.env.ENABLE_DEV_LOGIN !== "true") return [];
  return [
    Credentials({
      id: "dev",
      name: "Developer",
      credentials: {
        email: { label: "Email", type: "email" },
        role: { label: "Role", type: "text" },
      },
      async authorize(creds) {
        const role = (creds?.role as string as AppRole) ?? "HIRING_MANAGER";
        if (!ROLES.includes(role as Role)) return null;
        const email = (creds?.email as string) || `${role.toLowerCase()}@moca.gov.ae`;
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0], role, ssoProvider: "dev" },
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
      },
    }),
  ];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [...oidcProvider(), ...devProvider()],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // For SSO logins, upsert the user and resolve their app role.
        if (!("id" in user) || !(user as { role?: Role }).role) {
          const email = user.email ?? "";
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: { ssoSubject: token.sub },
            create: {
              email,
              name: user.name ?? email,
              ssoSubject: token.sub,
              ssoProvider: "oidc",
              role: "HIRING_MANAGER",
            },
          });
          token.uid = dbUser.id;
          token.role = dbUser.role as Role;
        } else {
          token.uid = (user as { id: string }).id;
          token.role = (user as { role: Role }).role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
});
