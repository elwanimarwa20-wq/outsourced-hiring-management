import type { AppRole } from "@/generated/prisma/enums";

export type Role = AppRole;

export const ROLES: Role[] = [
  "HIRING_MANAGER",
  "HR_DIRECTOR",
  "PROCUREMENT",
  "SECTOR_HEAD",
  "ADMIN",
];

export const ROLE_LABELS: Record<Role, { en: string; ar: string }> = {
  HIRING_MANAGER: { en: "Hiring Manager", ar: "مدير التوظيف" },
  HR_DIRECTOR: { en: "HR Director", ar: "مدير الموارد البشرية" },
  PROCUREMENT: { en: "Procurement & Contracts", ar: "العقود والمشتريات" },
  SECTOR_HEAD: { en: "Sector Head", ar: "رئيس القطاع" },
  ADMIN: { en: "Administrator", ar: "مسؤول النظام" },
};

/** Maps IdP group/role claims (SAML groups or OIDC roles) to an application role. */
export function mapIdpGroupsToRole(groups: string[]): Role {
  const g = groups.map((x) => x.toLowerCase());
  if (g.some((x) => x.includes("admin"))) return "ADMIN";
  if (g.some((x) => x.includes("sector"))) return "SECTOR_HEAD";
  if (g.some((x) => x.includes("procure") || x.includes("contract"))) return "PROCUREMENT";
  if (g.some((x) => x.includes("hr") || x.includes("human"))) return "HR_DIRECTOR";
  return "HIRING_MANAGER";
}

// --- Capability checks (mirror the RBAC matrix in the SAD §8) ---

export function canCreateForm(role: Role): boolean {
  return role === "HIRING_MANAGER" || role === "ADMIN";
}

export function canViewAllForms(role: Role): boolean {
  return role !== "HIRING_MANAGER";
}

export function canApproveAs(role: Role, stage: "HR" | "PROCUREMENT" | "SECTOR_HEAD"): boolean {
  if (role === "ADMIN") return true;
  if (stage === "HR") return role === "HR_DIRECTOR";
  if (stage === "PROCUREMENT") return role === "PROCUREMENT";
  return role === "SECTOR_HEAD";
}

export function canGenerateReports(role: Role): boolean {
  return role === "HR_DIRECTOR" || role === "ADMIN";
}
