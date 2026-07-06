import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentUser } from "@/lib/session";
import { getForm } from "@/lib/forms/actions";
import { getEntities, getNationalities } from "@/lib/forms/reference";
import { CreateForm } from "@/components/form/CreateForm";
import { toFormInitial } from "@/components/form/hydrate";

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const form = await getForm(id);
  if (!form) redirect("/");

  const locale = await getLocale();
  const [entities, nationalities] = await Promise.all([getEntities(), getNationalities()]);

  return (
    <CreateForm
      locale={locale}
      role={user.role}
      entities={entities.map((e) => ({ id: e.id, code: e.code, nameEn: e.nameEn, nameAr: e.nameAr, logoPath: e.logoPath }))}
      nationalities={nationalities.map((n) => ({ code: n.code, nameEn: n.nameEn, nameAr: n.nameAr }))}
      initial={toFormInitial(form)}
    />
  );
}
