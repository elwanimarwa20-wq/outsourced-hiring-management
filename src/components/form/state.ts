import type {
  MaritalStatus,
  AcademicQualification,
  ExperienceBand,
  AssessmentResult,
  SecurityClearance,
  ContractType,
  ContractDuration,
  OutsourcingSharePercent,
  BenefitSection,
  FormStatus,
  AttachmentSlot,
} from "@/generated/prisma/enums";
import type { HiringFormInput, BenefitLineInput } from "@/lib/forms/types";

export type MemberRow = {
  key: string;
  memberType: "SPOUSE" | "CHILD";
  memberIndex: number;
  current: number;
  proposed: number;
  included: boolean;
};

export type AttachmentInfo = { fileName: string; fileSize: number; url: string } | null;

export const ATTACHMENT_SLOTS: AttachmentSlot[] = ["CV", "QUOTATION", "PASSPORT", "EMPLOYEE_ID"];
export const BENEFIT_SECTIONS: BenefitSection[] = ["AIR_TICKET", "VISA_LABOUR", "MEDICAL"];

export type FormState = {
  id?: string;
  status: FormStatus;
  // Tab 1
  employeeName: string;
  employeeNameAr: string;
  photoUrl: string;
  maritalStatus: MaritalStatus;
  numberOfChildren: number;
  nationalityCode: string;
  academicQualification: AcademicQualification | "";
  yearsOfExperience: ExperienceBand | "";
  sectorDepartment: string;
  assessmentResult: AssessmentResult | "";
  currentWorkLocation: string;
  securityClearance: SecurityClearance | "";
  // Tab 2
  entityId: string;
  proposedJobTitle: string;
  directManager: string;
  contractType: ContractType | "";
  contractDuration: ContractDuration | "";
  // Tab 3
  isNewHire: boolean;
  proposedMonthlySalary: number;
  monthlySalaryCurrent: number;
  airTicketCurrent: number;
  airTicketProposed: number;
  visaLabourCurrent: number;
  visaLabourProposed: number;
  medicalCurrent: number;
  medicalProposed: number;
  endOfServiceCurrent: number;
  endOfServiceProposed: number;
  outsourcingSharePercent: OutsourcingSharePercent;
  outsourcingShareCurrent: number;
  outsourcingShareProposed: number;
  members: Record<BenefitSection, MemberRow[]>;
  attachments: Record<AttachmentSlot, AttachmentInfo>;
};

export function emptyState(): FormState {
  return {
    status: "DRAFT",
    employeeName: "",
    employeeNameAr: "",
    photoUrl: "",
    maritalStatus: "SINGLE",
    numberOfChildren: 0,
    nationalityCode: "",
    academicQualification: "",
    yearsOfExperience: "",
    sectorDepartment: "",
    assessmentResult: "",
    currentWorkLocation: "",
    securityClearance: "",
    entityId: "",
    proposedJobTitle: "",
    directManager: "",
    contractType: "",
    contractDuration: "",
    isNewHire: true,
    proposedMonthlySalary: 0,
    monthlySalaryCurrent: 0,
    airTicketCurrent: 0,
    airTicketProposed: 0,
    visaLabourCurrent: 0,
    visaLabourProposed: 0,
    medicalCurrent: 0,
    medicalProposed: 0,
    endOfServiceCurrent: 0,
    endOfServiceProposed: 0,
    outsourcingSharePercent: "P9",
    outsourcingShareCurrent: 0,
    outsourcingShareProposed: 0,
    members: { AIR_TICKET: [], VISA_LABOUR: [], MEDICAL: [] },
    attachments: { CV: null, QUOTATION: null, PASSPORT: null, EMPLOYEE_ID: null },
  };
}

// --- Live cost computation (mirrors the DB compute trigger) ---

function sectionBase(s: FormState, section: BenefitSection, col: "current" | "proposed"): number {
  if (section === "AIR_TICKET") return col === "current" ? s.airTicketCurrent : s.airTicketProposed;
  if (section === "VISA_LABOUR") return col === "current" ? s.visaLabourCurrent : s.visaLabourProposed;
  return col === "current" ? s.medicalCurrent : s.medicalProposed;
}

export function sectionTotal(s: FormState, section: BenefitSection, col: "current" | "proposed"): number {
  const base = num(sectionBase(s, section, col));
  const members = s.members[section]
    .filter((m) => m.included)
    .reduce((acc, m) => acc + num(col === "current" ? m.current : m.proposed), 0);
  return base + members;
}

export function computeTotals(s: FormState) {
  const annualSalary = num(s.proposedMonthlySalary) * 12;
  const airP = sectionTotal(s, "AIR_TICKET", "proposed");
  const visaP = sectionTotal(s, "VISA_LABOUR", "proposed");
  const medP = sectionTotal(s, "MEDICAL", "proposed");
  const annualContractCost =
    annualSalary + medP * 12 + airP + visaP + num(s.endOfServiceProposed) + num(s.outsourcingShareProposed);
  const totalMonthlyCost = annualContractCost / 12;
  return { annualSalary, annualContractCost, totalMonthlyCost, airP, visaP, medP };
}

export function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

export function toInput(s: FormState): HiringFormInput {
  const benefitLines: BenefitLineInput[] = [];
  for (const section of BENEFIT_SECTIONS) {
    for (const m of s.members[section]) {
      benefitLines.push({
        section,
        memberType: m.memberType,
        memberIndex: m.memberIndex,
        label: m.memberType === "SPOUSE" ? "Spouse" : `Child ${m.memberIndex}`,
        current: num(m.current),
        proposed: num(m.proposed),
        included: m.included,
      });
    }
  }
  return {
    id: s.id,
    employeeName: s.employeeName,
    employeeNameAr: s.employeeNameAr || null,
    photoUrl: s.photoUrl || null,
    maritalStatus: s.maritalStatus,
    numberOfChildren: s.numberOfChildren,
    nationalityCode: s.nationalityCode || null,
    academicQualification: s.academicQualification || null,
    yearsOfExperience: s.yearsOfExperience || null,
    sectorDepartment: s.sectorDepartment || null,
    assessmentResult: s.assessmentResult || null,
    currentWorkLocation: s.currentWorkLocation || null,
    securityClearance: s.securityClearance || null,
    entityId: s.entityId || null,
    proposedJobTitle: s.proposedJobTitle,
    directManager: s.directManager || null,
    contractType: s.contractType || null,
    contractDuration: s.contractDuration || null,
    isNewHire: s.isNewHire,
    proposedMonthlySalary: num(s.proposedMonthlySalary),
    airTicketCurrent: num(s.airTicketCurrent),
    airTicketProposed: num(s.airTicketProposed),
    visaLabourCurrent: num(s.visaLabourCurrent),
    visaLabourProposed: num(s.visaLabourProposed),
    medicalCurrent: num(s.medicalCurrent),
    medicalProposed: num(s.medicalProposed),
    endOfServiceCurrent: num(s.endOfServiceCurrent),
    endOfServiceProposed: num(s.endOfServiceProposed),
    outsourcingSharePercent: s.outsourcingSharePercent,
    outsourcingShareCurrent: num(s.outsourcingShareCurrent),
    outsourcingShareProposed: num(s.outsourcingShareProposed),
    benefitLines,
  };
}
