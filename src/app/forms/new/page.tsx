import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentUser } from "@/lib/session";
import { canCreateForm } from "@/lib/rbac";
import { getEntities, getNationalities } from "@/lib/forms/reference";
import { CreateForm } from "@/components/form/CreateForm";

export default async function NewFormPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateForm(user.role)) redirect("/");

  const locale = await getLocale();
  const [entities, nationalities] = await Promise.all([getEntities(), getNationalities()]);

  return (
    <CreateForm
      locale={locale}
      role={user.role}
      entities={entities.map((e) => ({ id: e.id, code: e.code, nameEn: e.nameEn, nameAr: e.nameAr, logoPath: e.logoPath }))}
      nationalities={nationalities.map((n) => ({ code: n.code, nameEn: n.nameEn, nameAr: n.nameAr }))}
      initial={null}
    />
  );
}
