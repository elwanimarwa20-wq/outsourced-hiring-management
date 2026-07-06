-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('HIRING_MANAGER', 'HR_DIRECTOR', 'PROCUREMENT', 'SECTOR_HEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PENDING_HR', 'PENDING_PROCUREMENT', 'PENDING_SECTOR_HEAD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "AcademicQualification" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTORATE');

-- CreateEnum
CREATE TYPE "ExperienceBand" AS ENUM ('Y0_2', 'Y3_5', 'Y6_10', 'Y11_15', 'Y16_PLUS');

-- CreateEnum
CREATE TYPE "AssessmentResult" AS ENUM ('ACCEPTABLE', 'VERY_GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "SecurityClearance" AS ENUM ('APPROVED', 'NOT_APPROVED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('OUTSOURCED', 'SERVICE_CONTRACT');

-- CreateEnum
CREATE TYPE "ContractDuration" AS ENUM ('Y1', 'Y2', 'Y3', 'Y4', 'Y5');

-- CreateEnum
CREATE TYPE "OutsourcingSharePercent" AS ENUM ('P9', 'P18');

-- CreateEnum
CREATE TYPE "BenefitSection" AS ENUM ('AIR_TICKET', 'VISA_LABOUR', 'MEDICAL');

-- CreateEnum
CREATE TYPE "FamilyMemberType" AS ENUM ('EMPLOYEE', 'SPOUSE', 'CHILD');

-- CreateEnum
CREATE TYPE "AttachmentSlot" AS ENUM ('CV', 'QUOTATION', 'PASSPORT', 'EMPLOYEE_ID');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SUBMIT_FOR_HR', 'HR_APPROVE', 'HR_RETURN', 'PROCUREMENT_APPROVE', 'PROCUREMENT_RETURN', 'SECTOR_HEAD_APPROVE', 'SECTOR_HEAD_RETURN', 'ATTACHMENT_ADD', 'ATTACHMENT_REPLACE', 'ATTACHMENT_REMOVE');

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "role" "AppRole" NOT NULL DEFAULT 'HIRING_MANAGER',
    "ssoSubject" TEXT,
    "ssoProvider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_entities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "logoPath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ref_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_nationalities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,

    CONSTRAINT "ref_nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_forms" (
    "id" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "employeeName" TEXT NOT NULL,
    "employeeNameAr" TEXT,
    "photoUrl" TEXT,
    "maritalStatus" "MaritalStatus" NOT NULL DEFAULT 'SINGLE',
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "nationalityCode" TEXT,
    "academicQualification" "AcademicQualification",
    "yearsOfExperience" "ExperienceBand",
    "sectorDepartment" TEXT,
    "assessmentResult" "AssessmentResult",
    "currentWorkLocation" TEXT,
    "securityClearance" "SecurityClearance",
    "entityId" TEXT,
    "proposedJobTitle" TEXT NOT NULL,
    "directManager" TEXT,
    "contractType" "ContractType",
    "contractDuration" "ContractDuration",
    "proposedMonthlySalary" DECIMAL(12,2) NOT NULL,
    "annualSalary" DECIMAL(14,2) NOT NULL,
    "isNewHire" BOOLEAN NOT NULL DEFAULT true,
    "airTicketCurrent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "airTicketProposed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "visaLabourCurrent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "visaLabourProposed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medicalCurrent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medicalProposed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "endOfServiceCurrent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "endOfServiceProposed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outsourcingSharePercent" "OutsourcingSharePercent" NOT NULL DEFAULT 'P9',
    "outsourcingShareCurrent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outsourcingShareProposed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalMonthlyCost" DECIMAL(14,2) NOT NULL,
    "annualContractCost" DECIMAL(14,2) NOT NULL,
    "hiringManagerId" TEXT,
    "hrDirectorNotes" TEXT,
    "procurementNotes" TEXT,
    "sectorHeadNotes" TEXT,
    "submittedForHrAt" TIMESTAMP(3),
    "hrApprovedAt" TIMESTAMP(3),
    "procurementApprovedAt" TIMESTAMP(3),
    "sectorHeadApprovedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_benefit_lines" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "section" "BenefitSection" NOT NULL,
    "memberType" "FamilyMemberType" NOT NULL,
    "memberIndex" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "current" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proposed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "form_benefit_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_attachments" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "slot" "AttachmentSlot" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "versionNo" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_audit_log" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "actedById" TEXT,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_ssoSubject_key" ON "app_users"("ssoSubject");

-- CreateIndex
CREATE UNIQUE INDEX "ref_entities_code_key" ON "ref_entities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ref_nationalities_code_key" ON "ref_nationalities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hiring_forms_formCode_key" ON "hiring_forms"("formCode");

-- CreateIndex
CREATE INDEX "hiring_forms_status_idx" ON "hiring_forms"("status");

-- CreateIndex
CREATE INDEX "hiring_forms_createdAt_idx" ON "hiring_forms"("createdAt");

-- CreateIndex
CREATE INDEX "hiring_forms_hiringManagerId_idx" ON "hiring_forms"("hiringManagerId");

-- CreateIndex
CREATE UNIQUE INDEX "form_benefit_lines_formId_section_memberType_memberIndex_key" ON "form_benefit_lines"("formId", "section", "memberType", "memberIndex");

-- CreateIndex
CREATE INDEX "form_attachments_formId_slot_idx" ON "form_attachments"("formId", "slot");

-- CreateIndex
CREATE INDEX "form_audit_log_formId_idx" ON "form_audit_log"("formId");

-- AddForeignKey
ALTER TABLE "hiring_forms" ADD CONSTRAINT "hiring_forms_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "ref_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_forms" ADD CONSTRAINT "hiring_forms_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_benefit_lines" ADD CONSTRAINT "form_benefit_lines_formId_fkey" FOREIGN KEY ("formId") REFERENCES "hiring_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_attachments" ADD CONSTRAINT "form_attachments_formId_fkey" FOREIGN KEY ("formId") REFERENCES "hiring_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_attachments" ADD CONSTRAINT "form_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_audit_log" ADD CONSTRAINT "form_audit_log_formId_fkey" FOREIGN KEY ("formId") REFERENCES "hiring_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_audit_log" ADD CONSTRAINT "form_audit_log_actedById_fkey" FOREIGN KEY ("actedById") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Computed columns (mirrors the Oracle VIRTUAL columns in the SAD §4 DDL):
-- annual_salary, total_monthly_cost, and annual_contract_cost are maintained
-- by the database itself via triggers, so the arithmetic can never go stale
-- regardless of what the application sends.
--
-- Model:
--   annual_salary          = proposed_monthly_salary * 12
--   air/visa/medical total = own row value + SUM(included family benefit lines)
--   annual_contract_cost   = annual_salary + medical_total*12 + air_total + visa_total
--                            + end_of_service_proposed + outsourcing_share_proposed
--   total_monthly_cost     = annual_contract_cost / 12
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_hf_compute_totals() RETURNS TRIGGER AS $$
DECLARE
  v_air_total    NUMERIC(14,2);
  v_visa_total   NUMERIC(14,2);
  v_med_total    NUMERIC(14,2);
  v_annual_salary NUMERIC(14,2);
  v_annual_contract NUMERIC(14,2);
BEGIN
  v_annual_salary := NEW."proposedMonthlySalary" * 12;

  SELECT NEW."airTicketProposed"  + COALESCE(SUM(proposed), 0) INTO v_air_total
    FROM form_benefit_lines WHERE "formId" = NEW.id AND section = 'AIR_TICKET' AND included;
  SELECT NEW."visaLabourProposed" + COALESCE(SUM(proposed), 0) INTO v_visa_total
    FROM form_benefit_lines WHERE "formId" = NEW.id AND section = 'VISA_LABOUR' AND included;
  SELECT NEW."medicalProposed"    + COALESCE(SUM(proposed), 0) INTO v_med_total
    FROM form_benefit_lines WHERE "formId" = NEW.id AND section = 'MEDICAL' AND included;

  v_annual_contract := v_annual_salary
                        + (v_med_total * 12)
                        + v_air_total
                        + v_visa_total
                        + NEW."endOfServiceProposed"
                        + NEW."outsourcingShareProposed";

  NEW."annualSalary"        := v_annual_salary;
  NEW."annualContractCost"  := v_annual_contract;
  NEW."totalMonthlyCost"    := ROUND(v_annual_contract / 12, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hf_compute_totals
  BEFORE INSERT OR UPDATE ON hiring_forms
  FOR EACH ROW EXECUTE FUNCTION fn_hf_compute_totals();

-- When a family benefit line changes, "touch" the parent row so the BEFORE
-- trigger above recomputes the section totals from the fresh child rows.
CREATE OR REPLACE FUNCTION fn_touch_hiring_form() RETURNS TRIGGER AS $$
BEGIN
  UPDATE hiring_forms SET "updatedAt" = now() WHERE id = COALESCE(NEW."formId", OLD."formId");
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_benefit_lines_touch
  AFTER INSERT OR UPDATE OR DELETE ON form_benefit_lines
  FOR EACH ROW EXECUTE FUNCTION fn_touch_hiring_form();

-- =============================================================================
-- Audit trail: every status transition is written to form_audit_log,
-- independent of the application layer (mirrors SAD §4 trg_hf_audit).
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_hf_audit_status() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO form_audit_log ("id", "formId", "action", "oldValue", "newValue", "actedById")
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    'UPDATE',
    OLD.status::text,
    NEW.status::text,
    NULLIF(current_setting('app.user_id', true), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hf_audit_status
  AFTER UPDATE OF status ON hiring_forms
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION fn_hf_audit_status();

-- =============================================================================
-- Row-Level Security: the app connects as a non-superuser "app_runtime" role.
-- Every request wraps its queries in a transaction that sets
-- `app.role` / `app.user_id` (see src/lib/db.ts), so Postgres
-- itself enforces "Hiring Manager sees only their own forms" from the RBAC
-- matrix in the SAD, independent of the application code.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN PASSWORD 'app_runtime_dev_password';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER TABLE hiring_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY hiring_forms_select ON hiring_forms FOR SELECT TO app_runtime
  USING (
    current_setting('app.role', true) IN ('ADMIN', 'HR_DIRECTOR', 'PROCUREMENT', 'SECTOR_HEAD')
    OR "createdBy" = NULLIF(current_setting('app.user_id', true), '')
  );

CREATE POLICY hiring_forms_insert ON hiring_forms FOR INSERT TO app_runtime
  WITH CHECK (
    current_setting('app.role', true) IN ('HIRING_MANAGER', 'ADMIN')
  );

CREATE POLICY hiring_forms_update ON hiring_forms FOR UPDATE TO app_runtime
  USING (
    current_setting('app.role', true) IN ('ADMIN', 'HR_DIRECTOR', 'PROCUREMENT', 'SECTOR_HEAD')
    OR "createdBy" = NULLIF(current_setting('app.user_id', true), '')
  )
  WITH CHECK (true);

CREATE POLICY hiring_forms_delete ON hiring_forms FOR DELETE TO app_runtime
  USING (current_setting('app.role', true) = 'ADMIN');

-- Child tables inherit visibility through the parent form via app-layer joins;
-- they still require an authenticated app_runtime role to read/write at all.
ALTER TABLE form_benefit_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY form_benefit_lines_all ON form_benefit_lines FOR ALL TO app_runtime
  USING (EXISTS (SELECT 1 FROM hiring_forms hf WHERE hf.id = "formId"))
  WITH CHECK (EXISTS (SELECT 1 FROM hiring_forms hf WHERE hf.id = "formId"));

ALTER TABLE form_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY form_attachments_all ON form_attachments FOR ALL TO app_runtime
  USING (EXISTS (SELECT 1 FROM hiring_forms hf WHERE hf.id = "formId"))
  WITH CHECK (EXISTS (SELECT 1 FROM hiring_forms hf WHERE hf.id = "formId"));

ALTER TABLE form_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY form_audit_log_select ON form_audit_log FOR SELECT TO app_runtime USING (true);
CREATE POLICY form_audit_log_insert ON form_audit_log FOR INSERT TO app_runtime WITH CHECK (true);

-- =============================================================================
-- Seed reference data: the 7 entities from the design chat + a starter
-- nationality list (bilingual EN/AR labels, per the "show nationalities in
-- Arabic when the form is in Arabic" requirement).
-- =============================================================================

INSERT INTO ref_entities (id, code, "nameEn", "nameAr", "logoPath") VALUES
  (gen_random_uuid()::text, 'MOCA', 'Ministry of Cabinet Affairs', 'وزارة شؤون مجلس الوزراء', '/entity-logos/moca.jpg'),
  (gen_random_uuid()::text, 'PMO',  'Prime Minister''s Office',    'مكتب رئيس مجلس الوزراء', '/entity-logos/pmo.png'),
  (gen_random_uuid()::text, 'FCSC', 'Federal Competitiveness and Statistics Centre', 'المركز الاتحادي للتنافسية والإحصاء', '/entity-logos/fcsc.jpg'),
  (gen_random_uuid()::text, 'ENT4', 'Entity 4', 'الجهة 4', '/entity-logos/moca.jpg'),
  (gen_random_uuid()::text, 'ENT5', 'Entity 5', 'الجهة 5', '/entity-logos/moca.jpg'),
  (gen_random_uuid()::text, 'ENT6', 'Entity 6', 'الجهة 6', '/entity-logos/moca.jpg'),
  (gen_random_uuid()::text, 'ENT7', 'Entity 7', 'الجهة 7', '/entity-logos/moca.jpg');

INSERT INTO ref_nationalities (id, code, "nameEn", "nameAr") VALUES
  (gen_random_uuid()::text, 'AE', 'United Arab Emirates', 'الإمارات العربية المتحدة'),
  (gen_random_uuid()::text, 'IN', 'India', 'الهند'),
  (gen_random_uuid()::text, 'PH', 'Philippines', 'الفلبين'),
  (gen_random_uuid()::text, 'PK', 'Pakistan', 'باكستان'),
  (gen_random_uuid()::text, 'EG', 'Egypt', 'مصر'),
  (gen_random_uuid()::text, 'JO', 'Jordan', 'الأردن'),
  (gen_random_uuid()::text, 'SD', 'Sudan', 'السودان'),
  (gen_random_uuid()::text, 'BD', 'Bangladesh', 'بنغلاديش'),
  (gen_random_uuid()::text, 'LK', 'Sri Lanka', 'سريلانكا'),
  (gen_random_uuid()::text, 'NP', 'Nepal', 'نيبال'),
  (gen_random_uuid()::text, 'SY', 'Syria', 'سوريا'),
  (gen_random_uuid()::text, 'LB', 'Lebanon', 'لبنان'),
  (gen_random_uuid()::text, 'OTHER', 'Other', 'أخرى');
