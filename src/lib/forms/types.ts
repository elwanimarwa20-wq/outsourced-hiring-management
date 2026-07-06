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
  FamilyMemberType,
  FormStatus,
} from "@/generated/prisma/enums";

export type BenefitLineInput = {
  section: BenefitSection;
  memberType: FamilyMemberType;
  memberIndex: number;
  label?: string;
  current: number;
  proposed: number;
  included: boolean;
};

export type HiringFormInput = {
  id?: string;
  // Tab 1
  employeeName: string;
  employeeNameAr?: string | null;
  photoUrl?: string | null;
  maritalStatus: MaritalStatus;
  numberOfChildren: number;
  nationalityCode?: string | null;
  academicQualification?: AcademicQualification | null;
  yearsOfExperience?: ExperienceBand | null;
  sectorDepartment?: string | null;
  assessmentResult?: AssessmentResult | null;
  currentWorkLocation?: string | null;
  securityClearance?: SecurityClearance | null;
  // Tab 2
  entityId?: string | null;
  proposedJobTitle: string;
  directManager?: string | null;
  contractType?: ContractType | null;
  contractDuration?: ContractDuration | null;
  // Tab 3
  isNewHire: boolean;
  proposedMonthlySalary: number;
  // Tab 3 baseline (employee's own) — family members live in benefitLines
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
  benefitLines: BenefitLineInput[];
};

export type FormListItem = {
  id: string;
  formCode: string;
  status: FormStatus;
  employeeName: string;
  proposedJobTitle: string;
  nationalityCode: string | null;
  proposedMonthlySalary: string;
  annualSalary: string;
  annualContractCost: string;
  contractType: ContractType | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};
