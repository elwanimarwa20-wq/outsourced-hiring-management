import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getCurrentUser } from "@/lib/session";
import { getForm } from "@/lib/forms/actions";
import { getNationalities } from "@/lib/forms/reference";
import { canApproveAs } from "@/lib/rbac";
import { FormSummary } from "@/components/form/FormSummary";
import { ApprovalActions } from "@/components/form/ApprovalActions";
import { AppHeader } from "@/components/AppHeader";
import { entityLogo } from "@/components/form/display";

type Stage = "HR" | "PROCUREMENT" | "SECTOR_HEAD";

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const form = await getForm(id);
  if (!form) redirect("/");

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const nationalities = await getNationalities();

  if (form.status === "DRAFT") redirect(`/forms/${id}`);

  const stageByStatus: Record<string, Stage | "DONE"> = {
    PENDING_HR: "HR",
    PENDING_PROCUREMENT: "PROCUREMENT",
    PENDING_SECTOR_HEAD: "SECTOR_HEAD",
    COMPLETED: "DONE",
  };
  const stage = stageByStatus[form.status];

  const stageMeta =
    stage === "HR"
      ? {
          title: dict.approvals.hr.title,
          pending: dict.approvals.hr.pending,
          note: `${dict.approvals.hr.submittedBy}: ${form.hiringManager?.name ?? form.createdBy ?? "—"}`,
          notesLabel: dict.approvals.hr.notes,
          approveLabel: dict.common.approveAndForward,
          returnLabel: dict.common.returnForRevision,
        }
      : stage === "PROCUREMENT"
        ? {
            title: dict.approvals.procurement.title,
            pending: dict.approvals.procurement.pending,
            note: dict.approvals.procurement.forwardedNote,
            notesLabel: dict.approvals.procurement.notes,
            approveLabel: dict.common.approveAndForward,
            returnLabel: dict.common.returnToHr,
          }
        : stage === "SECTOR_HEAD"
          ? {
              title: dict.approvals.sectorHead.title,
              pending: dict.approvals.sectorHead.pending,
              note: dict.approvals.sectorHead.forwardedNote,
              notesLabel: dict.approvals.sectorHead.notes,
              approveLabel: dict.common.approveAndFinalize,
              returnLabel: dict.common.returnToHr,
            }
          : null;

  const canAct = stage !== "DONE" && canApproveAs(user.role, stage as Stage);

  return (
    <>
      <AppHeader locale={locale} langLabel={dict.common.language} logoSrc={entityLogo(form)} backHref="/" backLabel={dict.common.back} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        {stage === "DONE" ? (
          <div className="mb-6 rounded-xl border px-5 py-4 text-sm font-semibold" style={{ background: "#E4EFE8", borderColor: "#BFD9C9", color: "#2F6B4F" }}>
            ✓ {dict.approvals.completedBanner}
          </div>
        ) : (
          <div className="mb-6 rounded-xl px-5 py-5 text-white" style={{ background: "linear-gradient(90deg,#7C1733,#A6304F)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#FFD0A0" }}>{stageMeta!.pending}</div>
            <h1 className="mt-1 text-lg font-bold">{stageMeta!.title}</h1>
            <p className="mt-1 text-sm" style={{ color: "#FFE6B0" }}>{stageMeta!.note}</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-maroon">{form.formCode}</span>
            <span className="text-sm text-text-muted">{form.employeeName}</span>
          </div>
          <FormSummary form={form} locale={locale} nationalities={nationalities} />

          {form.attachments?.length ? (
            <div className="mt-6">
              <h3 className="mb-2 text-[13px] font-bold text-text-primary">{dict.attachments.title}</h3>
              <ul className="space-y-1">
                {form.attachments.map((a: { id: string; slot: string; fileName: string; filePath: string }) => (
                  <li key={a.id}>
                    <a href={a.filePath} target="_blank" rel="noreferrer" className="text-sm text-maroon underline">
                      {dict.attachments[a.slot as keyof typeof dict.attachments] as string} — {a.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {canAct && stageMeta ? (
          <ApprovalActions
            formId={id}
            stage={stage as Stage}
            notesLabel={stageMeta.notesLabel}
            approveLabel={stageMeta.approveLabel}
            returnLabel={stageMeta.returnLabel}
          />
        ) : null}
      </main>
    </>
  );
}
