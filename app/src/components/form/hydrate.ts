import type { FormState, MemberRow } from "./state";
import { emptyState } from "./state";
import type { BenefitSection } from "@/generated/prisma/enums";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Maps a loaded form (JSON-serialized from getForm) into client FormState.
export function toFormInitial(form: any): FormState {
  const s = emptyState();
  s.id = form.id;
  s.status = form.status;
  s.employeeName = form.employeeName ?? "";
  s.employeeNameAr = form.employeeNameAr ?? "";
  s.photoUrl = form.photoUrl ?? "";
  s.maritalStatus = form.maritalStatus ?? "SINGLE";
  s.numberOfChildren = form.numberOfChildren ?? 0;
  s.nationalityCode = form.nationalityCode ?? "";
  s.academicQualification = form.academicQualification ?? "";
  s.yearsOfExperience = form.yearsOfExperience ?? "";
  s.sectorDepartment = form.sectorDepartment ?? "";
  s.assessmentResult = form.assessmentResult ?? "";
  s.currentWorkLocation = form.currentWorkLocation ?? "";
  s.securityClearance = form.securityClearance ?? "";
  s.entityId = form.entityId ?? "";
  s.proposedJobTitle = form.proposedJobTitle ?? "";
  s.directManager = form.directManager ?? "";
  s.contractType = form.contractType ?? "";
  s.contractDuration = form.contractDuration ?? "";
  s.isNewHire = form.isNewHire ?? true;
  s.proposedMonthlySalary = Number(form.proposedMonthlySalary ?? 0);
  s.airTicketCurrent = Number(form.airTicketCurrent ?? 0);
  s.airTicketProposed = Number(form.airTicketProposed ?? 0);
  s.visaLabourCurrent = Number(form.visaLabourCurrent ?? 0);
  s.visaLabourProposed = Number(form.visaLabourProposed ?? 0);
  s.medicalCurrent = Number(form.medicalCurrent ?? 0);
  s.medicalProposed = Number(form.medicalProposed ?? 0);
  s.endOfServiceCurrent = Number(form.endOfServiceCurrent ?? 0);
  s.endOfServiceProposed = Number(form.endOfServiceProposed ?? 0);
  s.outsourcingSharePercent = form.outsourcingSharePercent ?? "P9";
  s.outsourcingShareCurrent = Number(form.outsourcingShareCurrent ?? 0);
  s.outsourcingShareProposed = Number(form.outsourcingShareProposed ?? 0);

  for (const line of form.benefitLines ?? []) {
    if (line.memberType === "EMPLOYEE") continue;
    const section = line.section as BenefitSection;
    const row: MemberRow = {
      key: line.id ?? `${section}-${line.memberType}-${line.memberIndex}`,
      memberType: line.memberType,
      memberIndex: line.memberIndex,
      current: Number(line.current ?? 0),
      proposed: Number(line.proposed ?? 0),
      included: line.included ?? true,
    };
    s.members[section].push(row);
  }

  for (const att of form.attachments ?? []) {
    s.attachments[att.slot as keyof typeof s.attachments] = {
      fileName: att.fileName,
      fileSize: att.fileSize,
      url: att.filePath,
    };
  }
  return s;
}
