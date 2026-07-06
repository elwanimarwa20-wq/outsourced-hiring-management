import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import "dotenv/config";

// Seeds mock users (one per role) and a spread of demo hiring forms across
// every workflow status, so the dashboard, filters, and approval queues are
// all populated for a walkthrough.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function asRole(role, userId, fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = '${role}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${userId}'`);
    return fn(tx);
  });
}

// Emails match the dev-login convention (`${role.toLowerCase()}@moca.gov.ae`)
// so signing in via the role picker resolves to these same seeded users.
const USERS = [
  { email: "hiring_manager@moca.gov.ae", name: "Aisha Al Marri", nameAr: "عائشة المري", role: "HIRING_MANAGER" },
  { email: "hr_director@moca.gov.ae", name: "Khalid Al Mazrouei", nameAr: "خالد المزروعي", role: "HR_DIRECTOR" },
  { email: "procurement@moca.gov.ae", name: "Mariam Al Suwaidi", nameAr: "مريم السويدي", role: "PROCUREMENT" },
  { email: "sector_head@moca.gov.ae", name: "Sultan Al Nuaimi", nameAr: "سلطان النعيمي", role: "SECTOR_HEAD" },
  { email: "admin@moca.gov.ae", name: "System Administrator", nameAr: "مسؤول النظام", role: "ADMIN" },
];

async function main() {
  const users = {};
  for (const u of USERS) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, nameAr: u.nameAr, role: u.role },
      create: { ...u, ssoProvider: "dev" },
    });
    users[u.role] = row;
  }
  const hm = users.HIRING_MANAGER;

  const entities = await prisma.entity.findMany();
  const entityByCode = Object.fromEntries(entities.map((e) => [e.code, e]));

  // Clear existing demo forms for idempotency
  await prisma.hiringForm.deleteMany({ where: { formCode: { startsWith: "OSF-2026-9" } } });

  const demos = [
    {
      code: "OSF-2026-9001", status: "DRAFT", name: "Rahul Sharma", nat: "IN", title: "IT Support Engineer",
      entity: "MOCA", salary: 9000, contractType: "OUTSOURCED", duration: "Y2", marital: "SINGLE",
      medical: 450, air: 2800, visa: 3500,
    },
    {
      code: "OSF-2026-9002", status: "COMPLETED", name: "Maria Santos", nat: "PH", title: "Administrative Assistant",
      entity: "PMO", salary: 7500, contractType: "SERVICE_CONTRACT", duration: "Y1", marital: "SINGLE",
      medical: 400, air: 2200, visa: 3500,
    },
    {
      code: "OSF-2026-9003", status: "PENDING_HR", name: "Ahmed Hassan", nat: "EG", title: "Financial Analyst",
      entity: "FCSC", salary: 14000, contractType: "OUTSOURCED", duration: "Y3", marital: "MARRIED", children: 2,
      medical: 700, air: 4200, visa: 3500,
      members: [
        { section: "AIR_TICKET", memberType: "SPOUSE", memberIndex: 0, proposed: 2800 },
        { section: "AIR_TICKET", memberType: "CHILD", memberIndex: 1, proposed: 2000 },
        { section: "MEDICAL", memberType: "SPOUSE", memberIndex: 0, proposed: 500 },
      ],
    },
    {
      code: "OSF-2026-9004", status: "PENDING_PROCUREMENT", name: "Fatima Noor", nat: "PK", title: "HR Coordinator",
      entity: "MOCA", salary: 11000, contractType: "SERVICE_CONTRACT", duration: "Y2", marital: "MARRIED", children: 1,
      medical: 600, air: 3600, visa: 3500,
      members: [{ section: "AIR_TICKET", memberType: "CHILD", memberIndex: 1, proposed: 2000 }],
    },
    {
      code: "OSF-2026-9005", status: "PENDING_SECTOR_HEAD", name: "John Mensah", nat: "OTHER", title: "Facilities Supervisor",
      entity: "PMO", salary: 12500, contractType: "OUTSOURCED", duration: "Y4", marital: "SINGLE",
      medical: 550, air: 3200, visa: 3500, eos: 1000, outsourcing: 1125,
    },
    {
      code: "OSF-2026-9006", status: "COMPLETED", name: "Priya Menon", nat: "IN", title: "Data Entry Officer",
      entity: "FCSC", salary: 8000, contractType: "SERVICE_CONTRACT", duration: "Y1", marital: "SINGLE",
      medical: 400, air: 2400, visa: 3500,
    },
    {
      code: "OSF-2026-9007", status: "DRAFT", name: "Yusuf Rahman", nat: "BD", title: "Logistics Assistant",
      entity: "MOCA", salary: 6500, contractType: "OUTSOURCED", duration: "Y2", marital: "SINGLE",
      medical: 380, air: 2100, visa: 3500,
    },
  ];

  for (const d of demos) {
    await asRole("ADMIN", users.ADMIN.id, async (tx) => {
      const form = await tx.hiringForm.create({
        data: {
          formCode: d.code,
          status: "DRAFT",
          employeeName: d.name,
          nationalityCode: d.nat,
          proposedJobTitle: d.title,
          entityId: entityByCode[d.entity]?.id ?? null,
          contractType: d.contractType,
          contractDuration: d.duration,
          maritalStatus: d.marital,
          numberOfChildren: d.children ?? 0,
          isNewHire: true,
          proposedMonthlySalary: d.salary,
          medicalProposed: d.medical ?? 0,
          airTicketProposed: d.air ?? 0,
          visaLabourProposed: d.visa ?? 0,
          endOfServiceProposed: d.eos ?? 0,
          outsourcingShareProposed: d.outsourcing ?? 0,
          academicQualification: "BACHELOR",
          yearsOfExperience: "Y6_10",
          assessmentResult: "VERY_GOOD",
          securityClearance: "APPROVED",
          currentWorkLocation: "Abu Dhabi",
          annualSalary: 0, totalMonthlyCost: 0, annualContractCost: 0,
          createdBy: hm.id,
          hiringManagerId: hm.id,
        },
      });
      for (const m of d.members ?? []) {
        await tx.formBenefitLine.create({
          data: {
            formId: form.id, section: m.section, memberType: m.memberType, memberIndex: m.memberIndex,
            label: m.memberType === "SPOUSE" ? "Spouse" : `Child ${m.memberIndex}`,
            current: 0, proposed: m.proposed, included: true,
          },
        });
      }
      if (d.status !== "DRAFT") {
        await tx.hiringForm.update({ where: { id: form.id }, data: { status: d.status } });
      }
    });
  }

  console.log(`Seeded ${USERS.length} users and ${demos.length} demo forms.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
