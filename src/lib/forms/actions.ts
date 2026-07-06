"use server";

import { revalidatePath } from "next/cache";
import { withRlsContext } from "@/lib/db";
import { getCurrentUser, rlsContext } from "@/lib/session";
import { canApproveAs, canCreateForm } from "@/lib/rbac";
import { nextFormCode } from "./formCode";
import type { HiringFormInput, FormListItem } from "./types";
import type { FormStatus } from "@/generated/prisma/enums";

function toListItem(f: {
  id: string;
  formCode: string;
  status: FormStatus;
  employeeName: string;
  proposedJobTitle: string;
  nationalityCode: string | null;
  proposedMonthlySalary: unknown;
  annualSalary: unknown;
  annualContractCost: unknown;
  contractType: FormListItem["contractType"];
  hiringManager: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): FormListItem {
  return {
    id: f.id,
    formCode: f.formCode,
    status: f.status,
    employeeName: f.employeeName,
    proposedJobTitle: f.proposedJobTitle,
    nationalityCode: f.nationalityCode,
    proposedMonthlySalary: String(f.proposedMonthlySalary),
    annualSalary: String(f.annualSalary),
    annualContractCost: String(f.annualContractCost),
    contractType: f.contractType,
    createdByName: f.hiringManager?.name ?? null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export async function listForms(): Promise<FormListItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return withRlsContext(rlsContext(user), async (tx) => {
    const forms = await tx.hiringForm.findMany({
      orderBy: { createdAt: "desc" },
      include: { hiringManager: { select: { name: true } } },
    });
    return forms.map(toListItem);
  });
}

export async function getForm(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  return withRlsContext(rlsContext(user), async (tx) => {
    const form = await tx.hiringForm.findUnique({
      where: { id },
      include: {
        benefitLines: { orderBy: [{ section: "asc" }, { memberType: "asc" }, { memberIndex: "asc" }] },
        attachments: { orderBy: { uploadedAt: "desc" } },
        entity: true,
        hiringManager: { select: { name: true } },
        auditLog: {
          orderBy: { actedAt: "desc" },
          include: { actedBy: { select: { name: true } } },
        },
      },
    });
    if (!form) return null;
    // Serialize Decimals to strings for the client boundary.
    return JSON.parse(
      JSON.stringify(form, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
    );
  });
}

const numeric = (n: number | undefined | null) => (n == null || Number.isNaN(n) ? 0 : n);

/** Creates a new draft or updates an existing form, syncing family benefit lines. */
export async function saveForm(
  input: HiringFormInput,
): Promise<{ ok: true; id: string; formCode: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  if (!input.id && !canCreateForm(user.role)) {
    return { ok: false, error: "Your role cannot create hiring forms." };
  }
  // Draft-level validation is intentionally light so partial forms can be saved;
  // the stricter checks (job title, salary > 0) are enforced at submit-for-approval.
  if (!input.employeeName?.trim()) return { ok: false, error: "Employee name is required." };

  const data = {
    employeeName: input.employeeName.trim(),
    employeeNameAr: input.employeeNameAr ?? null,
    photoUrl: input.photoUrl ?? null,
    maritalStatus: input.maritalStatus,
    numberOfChildren: input.numberOfChildren ?? 0,
    nationalityCode: input.nationalityCode ?? null,
    academicQualification: input.academicQualification ?? null,
    yearsOfExperience: input.yearsOfExperience ?? null,
    sectorDepartment: input.sectorDepartment ?? null,
    assessmentResult: input.assessmentResult ?? null,
    currentWorkLocation: input.currentWorkLocation ?? null,
    securityClearance: input.securityClearance ?? null,
    entityId: input.entityId ?? null,
    proposedJobTitle: input.proposedJobTitle.trim(),
    directManager: input.directManager ?? null,
    contractType: input.contractType ?? null,
    contractDuration: input.contractDuration ?? null,
    isNewHire: input.isNewHire,
    proposedMonthlySalary: numeric(input.proposedMonthlySalary),
    airTicketCurrent: numeric(input.airTicketCurrent),
    airTicketProposed: numeric(input.airTicketProposed),
    visaLabourCurrent: numeric(input.visaLabourCurrent),
    visaLabourProposed: numeric(input.visaLabourProposed),
    medicalCurrent: numeric(input.medicalCurrent),
    medicalProposed: numeric(input.medicalProposed),
    endOfServiceCurrent: numeric(input.endOfServiceCurrent),
    endOfServiceProposed: numeric(input.endOfServiceProposed),
    outsourcingSharePercent: input.outsourcingSharePercent,
    outsourcingShareCurrent: numeric(input.outsourcingShareCurrent),
    outsourcingShareProposed: numeric(input.outsourcingShareProposed),
  };

  const result = await withRlsContext(rlsContext(user), async (tx) => {
    let formId = input.id;
    let formCode: string;

    if (formId) {
      const existing = await tx.hiringForm.findUnique({ where: { id: formId } });
      if (!existing) throw new Error("Form not found or access denied.");
      // computed columns (annualSalary, totals) are always overwritten by the DB trigger
      const updated = await tx.hiringForm.update({
        where: { id: formId },
        data: { ...data, annualSalary: 0, totalMonthlyCost: 0, annualContractCost: 0 },
      });
      formCode = updated.formCode;
      await tx.formAuditLog.create({
        data: { formId, action: "UPDATE", actedById: user.id, newValue: "Form edited" },
      });
    } else {
      formCode = await nextFormCode(tx);
      const created = await tx.hiringForm.create({
        data: {
          ...data,
          formCode,
          status: "DRAFT",
          annualSalary: 0,
          totalMonthlyCost: 0,
          annualContractCost: 0,
          createdBy: user.id,
          hiringManagerId: user.id,
        },
      });
      formId = created.id;
      await tx.formAuditLog.create({
        data: { formId, action: "CREATE", actedById: user.id, newValue: formCode },
      });
    }

    // Sync family benefit lines: delete removed, upsert current set.
    await tx.formBenefitLine.deleteMany({ where: { formId } });
    if (input.benefitLines.length) {
      await tx.formBenefitLine.createMany({
        data: input.benefitLines.map((l) => ({
          formId: formId!,
          section: l.section,
          memberType: l.memberType,
          memberIndex: l.memberIndex,
          label: l.label ?? null,
          current: numeric(l.current),
          proposed: numeric(l.proposed),
          included: l.included,
        })),
      });
    }

    // Touch the form once more so the compute trigger folds in the fresh lines.
    await tx.hiringForm.update({ where: { id: formId }, data: { updatedAt: new Date() } });

    return { id: formId!, formCode };
  });

  revalidatePath("/");
  revalidatePath(`/forms/${result.id}`);
  return { ok: true, ...result };
}

// --- Workflow transitions ---

const NEXT_ON_APPROVE: Partial<Record<FormStatus, FormStatus>> = {
  PENDING_HR: "PENDING_PROCUREMENT",
  PENDING_PROCUREMENT: "PENDING_SECTOR_HEAD",
  PENDING_SECTOR_HEAD: "COMPLETED",
};

export async function submitForHrApproval(formId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };
  return withRlsContext(rlsContext(user), async (tx) => {
    const form = await tx.hiringForm.findUnique({ where: { id: formId } });
    if (!form) return { ok: false as const, error: "Form not found." };
    if (!form.proposedJobTitle?.trim()) return { ok: false as const, error: "Proposed job title is required before submitting." };
    if (Number(form.proposedMonthlySalary) <= 0) {
      return { ok: false as const, error: "Proposed monthly salary must be greater than zero before submitting." };
    }
    await tx.hiringForm.update({
      where: { id: formId },
      data: { status: "PENDING_HR", submittedForHrAt: new Date() },
    });
    await tx.formAuditLog.create({ data: { formId, action: "SUBMIT_FOR_HR", actedById: user.id } });
    revalidatePath("/");
    return { ok: true as const };
  });
}

async function approveStage(
  formId: string,
  stage: "HR" | "PROCUREMENT" | "SECTOR_HEAD",
  notes: string | undefined,
) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };
  if (!canApproveAs(user.role, stage)) {
    return { ok: false as const, error: "Your role cannot approve at this stage." };
  }
  const auditAction =
    stage === "HR" ? "HR_APPROVE" : stage === "PROCUREMENT" ? "PROCUREMENT_APPROVE" : "SECTOR_HEAD_APPROVE";
  const notesField =
    stage === "HR" ? "hrDirectorNotes" : stage === "PROCUREMENT" ? "procurementNotes" : "sectorHeadNotes";
  const tsField =
    stage === "HR" ? "hrApprovedAt" : stage === "PROCUREMENT" ? "procurementApprovedAt" : "sectorHeadApprovedAt";

  await withRlsContext(rlsContext(user), async (tx) => {
    const form = await tx.hiringForm.findUnique({ where: { id: formId } });
    if (!form) throw new Error("Form not found.");
    const next = NEXT_ON_APPROVE[form.status];
    if (!next) throw new Error("Form is not awaiting approval at this stage.");
    await tx.hiringForm.update({
      where: { id: formId },
      data: { status: next, [notesField]: notes ?? null, [tsField]: new Date() },
    });
    await tx.formAuditLog.create({
      data: { formId, action: auditAction, actedById: user.id, newValue: next, oldValue: form.status },
    });
  });
  revalidatePath("/");
  return { ok: true as const };
}

export async function hrApprove(formId: string, notes?: string) {
  return approveStage(formId, "HR", notes);
}
export async function procurementApprove(formId: string, notes?: string) {
  return approveStage(formId, "PROCUREMENT", notes);
}
export async function sectorHeadApprove(formId: string, notes?: string) {
  return approveStage(formId, "SECTOR_HEAD", notes);
}

/** Return a form to an earlier stage. Sector Head returns go back to HR (per the chat). */
export async function returnForm(
  formId: string,
  from: "HR" | "PROCUREMENT" | "SECTOR_HEAD",
  notes: string | undefined,
) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };
  if (!canApproveAs(user.role, from)) {
    return { ok: false as const, error: "Your role cannot return at this stage." };
  }
  const target: FormStatus = from === "HR" ? "DRAFT" : from === "PROCUREMENT" ? "PENDING_HR" : "PENDING_HR";
  const auditAction =
    from === "HR" ? "HR_RETURN" : from === "PROCUREMENT" ? "PROCUREMENT_RETURN" : "SECTOR_HEAD_RETURN";
  const notesField =
    from === "HR" ? "hrDirectorNotes" : from === "PROCUREMENT" ? "procurementNotes" : "sectorHeadNotes";

  await withRlsContext(rlsContext(user), async (tx) => {
    const form = await tx.hiringForm.findUnique({ where: { id: formId } });
    if (!form) throw new Error("Form not found.");
    await tx.hiringForm.update({
      where: { id: formId },
      data: { status: target, [notesField]: notes ?? null },
    });
    await tx.formAuditLog.create({
      data: { formId, action: auditAction, actedById: user.id, newValue: target, oldValue: form.status },
    });
  });
  revalidatePath("/");
  return { ok: true as const };
}
