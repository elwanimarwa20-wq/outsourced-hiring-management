import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCurrentUser } from "@/lib/session";
import { listForms } from "@/lib/forms/actions";
import { getEntities, getNationalities } from "@/lib/forms/reference";
import { AppHeader } from "@/components/AppHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const [forms, entities, nationalities] = await Promise.all([
    listForms(),
    getEntities(),
    getNationalities(),
  ]);

  return (
    <>
      <AppHeader
        locale={locale}
        langLabel={dict.common.language}
        right={<SignOutButton label={dict.common.signOut} />}
      />
      <DashboardClient
        locale={locale}
        role={user.role}
        forms={forms}
        entities={entities.map((e) => ({ id: e.id, code: e.code, nameEn: e.nameEn, nameAr: e.nameAr }))}
        nationalities={nationalities.map((n) => ({ code: n.code, nameEn: n.nameEn, nameAr: n.nameAr }))}
      />
    </>
  );
}
