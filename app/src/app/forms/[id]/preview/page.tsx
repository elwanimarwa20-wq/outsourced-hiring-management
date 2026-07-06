import Image from "next/image";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCurrentUser } from "@/lib/session";
import { getForm } from "@/lib/forms/actions";
import { getNationalities } from "@/lib/forms/reference";
import { FormSummary } from "@/components/form/FormSummary";
import { entityLogo } from "@/components/form/display";
import { PreviewActions } from "@/components/form/PreviewActions";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const form = await getForm(id);
  if (!form) redirect("/");

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const nationalities = await getNationalities();

  return (
    <div className="min-h-screen bg-desk-bg pb-24">
      <PreviewActions
        formId={id}
        locale={locale}
        labels={{
          backToForm: dict.common.backToForm,
          print: dict.common.print,
          sendForHrApproval: dict.common.sendForHrApproval,
        }}
      />

      {/* A4 sheet */}
      <div className="mx-auto my-8 max-w-[820px] bg-white px-10 py-12 shadow-lg print:my-0 print:shadow-none" style={{ boxShadow: "0 4px 24px rgba(0,0,0,.12)" }}>
        <div className="mb-8 flex items-center justify-between border-b-2 border-maroon pb-4">
          <Image src={entityLogo(form)} alt="Entity" width={120} height={60} className="h-14 w-auto object-contain" />
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photoUrl} alt="Employee" className="h-24 w-20 rounded border border-gold-light object-cover" />
          ) : null}
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold text-text-primary">{dict.preview.documentTitle}</h1>
          <p className="mt-1 font-mono text-sm font-semibold text-maroon">{form.formCode}</p>
        </div>

        <FormSummary form={form} locale={locale} nationalities={nationalities} />

        {/* Signature blocks */}
        <div className="mt-10 grid grid-cols-3 gap-6">
          {[dict.preview.hrDirector, dict.preview.procurement, dict.preview.sectorHead].map((role) => (
            <div key={role} className="text-center">
              <div className="mb-10 border-b border-text-muted" />
              <div className="text-[12px] font-semibold text-text-label">{role}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-3 text-center text-[10.5px] text-text-faint">{dict.ministry}</div>
      </div>
    </div>
  );
}
