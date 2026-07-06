import Image from "next/image";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const devEnabled = process.env.ENABLE_DEV_LOGIN === "true";
  const oidcEnabled = Boolean(process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID);
  const samlEnabled = Boolean(process.env.SAML_IDP_ENTRY_POINT && process.env.SAML_IDP_CERT);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <Image src="/entity-logos/moca.jpg" alt="MOCA" width={120} height={64} className="h-16 w-auto object-contain" priority />
          <div>
            <h1 className="text-xl font-bold text-text-primary">{dict.login.title}</h1>
            <p className="mt-1 text-sm text-text-muted">{dict.login.subtitle}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <LoginForm
            locale={locale}
            devEnabled={devEnabled}
            oidcEnabled={oidcEnabled}
            samlEnabled={samlEnabled}
            labels={{
              ssoOidc: dict.login.ssoOidc,
              ssoSaml: dict.login.ssoSaml,
              devLogin: dict.login.devLogin,
              selectRole: dict.login.selectRole,
            }}
          />
        </div>
        <p className="mt-4 text-center text-xs text-text-faint">{dict.ministry}</p>
      </div>
    </div>
  );
}
