import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { formatAED } from "@/lib/format";
import { label, natLabel } from "./display";

/* eslint-disable @typescript-eslint/no-explicit-any */

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-inner py-1.5 text-[13px]">
      <span className="text-text-label-2">{k}</span>
      <span className="font-medium text-text-body">{v}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 border-b-2 border-gold pb-1 text-[13px] font-bold uppercase tracking-wide text-maroon">{title}</h3>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Read-only rendering of a form's data — shared by the preview & approval views. */
export function FormSummary({
  form,
  locale,
  nationalities,
}: {
  form: any;
  locale: Locale;
  nationalities: { code: string; nameEn: string; nameAr: string }[];
}) {
  const dict = getDictionary(locale);
  const money = (v: unknown) => formatAED(String(v ?? 0), locale);
  const sectionTotal = (section: string, col: "current" | "proposed") => {
    const base =
      section === "AIR_TICKET"
        ? Number(col === "current" ? form.airTicketCurrent : form.airTicketProposed)
        : section === "VISA_LABOUR"
          ? Number(col === "current" ? form.visaLabourCurrent : form.visaLabourProposed)
          : Number(col === "current" ? form.medicalCurrent : form.medicalProposed);
    const members = (form.benefitLines ?? [])
      .filter((l: any) => l.section === section && l.included)
      .reduce((a: number, l: any) => a + Number(col === "current" ? l.current : l.proposed), 0);
    return base + members;
  };

  return (
    <div>
      <Section title={dict.tabs.personal}>
        <Row k={dict.fields.employeeName} v={form.employeeName} />
        <Row k={dict.fields.maritalStatus} v={label(dict, "maritalStatus", form.maritalStatus)} />
        {form.maritalStatus === "MARRIED" ? <Row k={dict.fields.numberOfChildren} v={form.numberOfChildren} /> : null}
        <Row k={dict.fields.nationality} v={natLabel(nationalities, form.nationalityCode, locale)} />
        <Row k={dict.fields.academicQualification} v={label(dict, "academicQualification", form.academicQualification)} />
        <Row k={dict.fields.yearsOfExperience} v={label(dict, "yearsOfExperience", form.yearsOfExperience)} />
        <Row k={dict.fields.assessmentResult} v={label(dict, "assessmentResult", form.assessmentResult)} />
        <Row k={dict.fields.currentWorkLocation} v={form.currentWorkLocation ?? "—"} />
        <Row k={dict.fields.securityClearance} v={label(dict, "securityClearance", form.securityClearance)} />
      </Section>

      <Section title={dict.tabs.employment}>
        <Row k={dict.fields.proposedJobTitle} v={form.proposedJobTitle} />
        <Row k={dict.fields.entity} v={form.entity ? (locale === "ar" ? form.entity.nameAr : form.entity.nameEn) : "—"} />
        <Row k={dict.fields.sectorDepartment} v={form.sectorDepartment ?? "—"} />
        <Row k={dict.fields.directManager} v={form.directManager ?? "—"} />
        <Row k={dict.fields.contractType} v={label(dict, "contractType", form.contractType)} />
        <Row k={dict.fields.contractDuration} v={label(dict, "contractDuration", form.contractDuration)} />
      </Section>

      <Section title={dict.tabs.costs}>
        <Row k={dict.costs.monthlySalary} v={money(form.proposedMonthlySalary)} />
        <Row k={dict.costs.airTicket} v={money(sectionTotal("AIR_TICKET", "proposed"))} />
        <Row k={dict.costs.visaLabour} v={money(sectionTotal("VISA_LABOUR", "proposed"))} />
        <Row k={dict.costs.medical} v={money(sectionTotal("MEDICAL", "proposed"))} />
        <Row k={dict.costs.endOfService} v={money(form.endOfServiceProposed)} />
        <Row
          k={`${dict.costs.outsourcingShare} (${form.outsourcingSharePercent === "P18" ? "18%" : "9%"})`}
          v={money(form.outsourcingShareProposed)}
        />
        <Row k={dict.costs.totalMonthly} v={money(form.totalMonthlyCost)} />
      </Section>

      <div className="flex items-center justify-between rounded-xl px-5 py-4" style={{ background: "linear-gradient(90deg,#7C1733,#A6304F)" }}>
        <span className="text-sm font-semibold text-white">{dict.costs.annualContractCost}</span>
        <span className="text-xl font-bold tabular-nums" style={{ color: "#FFE6B0" }}>{money(form.annualContractCost)}</span>
      </div>
    </div>
  );
}
