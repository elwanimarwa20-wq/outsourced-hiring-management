"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/rbac";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LoginForm({
  locale,
  devEnabled,
  oidcEnabled,
  samlEnabled,
  labels,
}: {
  locale: Locale;
  devEnabled: boolean;
  oidcEnabled: boolean;
  samlEnabled: boolean;
  labels: { ssoOidc: string; ssoSaml: string; devLogin: string; selectRole: string };
}) {
  const [role, setRole] = useState<Role>("HIRING_MANAGER");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {oidcEnabled ? (
        <button
          type="button"
          onClick={() => signIn("oidc", { callbackUrl: "/" })}
          className="w-full rounded-lg bg-maroon px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {labels.ssoOidc}
        </button>
      ) : null}
      {samlEnabled ? (
        <a
          href="/api/auth/saml/login"
          className="w-full rounded-lg bg-maroon px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          {labels.ssoSaml}
        </a>
      ) : null}

      {devEnabled ? (
        <div className={oidcEnabled || samlEnabled ? "mt-2 border-t border-border-inner pt-4" : ""}>
          <label className="mb-1.5 block text-xs font-semibold text-text-label-2">{labels.selectRole}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mb-3 w-full rounded-lg border border-border-btn bg-white px-3 py-2 text-sm text-text-body focus:border-gold-light focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r][locale]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await signIn("dev", {
                role,
                email: `${role.toLowerCase()}@moca.gov.ae`,
                callbackUrl: "/",
              });
            }}
            className="w-full rounded-lg border border-gold bg-gold-bg px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold-hover-bg disabled:opacity-50"
          >
            {labels.devLogin}
          </button>
        </div>
      ) : null}
    </div>
  );
}
