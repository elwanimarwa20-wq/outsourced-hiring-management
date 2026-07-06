# IT Handover Package
### Outsourced & Service Contract Hiring Management System
**United Arab Emirates · Ministry of Cabinet Affairs — Human Resources**
Version 1.0 · Confidential

---

## 1. Purpose & Scope

This document hands over operational ownership of the Hiring Management System to the receiving IT operations team. It covers the delivered architecture, environments, deployment, backup/DR, monitoring, SSO/secrets, and the support model.

The system replaces the original Oracle APEX target specified in the Solution Architecture Document (SAD) with a **modern web stack** that implements the same data model, workflow, RBAC, and computed-column guarantees. Where the SAD says "Oracle APEX / Oracle DB", this build delivers the equivalent on Next.js / PostgreSQL.

---

## 2. Delivered Architecture

| Tier | Technology | Notes |
|------|-----------|-------|
| Presentation | **Next.js 16 (App Router, React 19)**, Tailwind CSS 4 | Responsive, bilingual EN/AR with full RTL. IBM Plex Sans / IBM Plex Sans Arabic. |
| Application | Next.js **Server Actions** + **Route Handlers** (Node.js runtime) | Business logic, workflow transitions, validation, file handling. |
| Auth | **Auth.js (NextAuth v5)** — OIDC/OAuth + SAML 2.0 SP, dev credentials | Session as signed JWT cookie. RBAC enforced in `proxy.ts` + server actions. |
| Data | **PostgreSQL 16** via **Prisma 7** (`@prisma/adapter-pg`) | Computed columns, audit trigger, and **Row-Level Security** enforced in-database. |
| Documents | Local `storage/uploads` (prototype) → object storage in production | Served through the auth-gated `/api/files/[...]` route. |

**Key architectural guarantees enforced by the database (not just app code):**
- `annualSalary`, `totalMonthlyCost`, `annualContractCost` are recomputed by a `BEFORE INSERT/UPDATE` trigger (`fn_hf_compute_totals`) — mirrors the SAD's Oracle VIRTUAL columns.
- Every status transition is written to `form_audit_log` by an `AFTER UPDATE` trigger.
- Row-Level Security restricts Hiring Managers to their own forms; HR/Procurement/Sector Head/Admin see all. The app connects as the non-superuser `app_runtime` role and sets `app.role` / `app.user_id` per transaction (`withRlsContext` in `src/lib/db.ts`).

---

## 3. Repository Layout

```
app/
├── prisma/
│   ├── schema.prisma              # Data model
│   ├── migrations/                # SQL migrations incl. triggers, RLS, seed reference data
│   └── seed.mjs                   # Mock users + demo forms
├── src/
│   ├── app/                       # Routes (dashboard, /forms/*, /login, /api/*)
│   ├── components/                # UI (dashboard, form wizard, approvals, preview)
│   ├── lib/
│   │   ├── db.ts                  # Prisma client + RLS transaction wrapper
│   │   ├── auth.ts / saml.ts      # SSO
│   │   ├── rbac.ts                # Role → capability matrix
│   │   ├── forms/                 # Server actions, types, reference data
│   │   └── i18n/                  # EN/AR dictionaries
│   └── generated/prisma/          # Generated Prisma client (do not edit)
├── proxy.ts                       # Auth gate (Next.js 16 middleware)
├── tests/e2e-smoke.mjs            # End-to-end workflow test
└── docs/                          # This file + Security Handover
```

---

## 4. Environments & Configuration

Three environments are recommended: **DEV → TEST → PROD**. All configuration is via environment variables (`.env`). None are committed.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Migration-owner connection (superuser/owner). Used by Prisma migrate. |
| `RUNTIME_DATABASE_URL` | Restricted `app_runtime` role connection used at runtime so **RLS applies**. |
| `AUTH_SECRET` | Signing secret for session JWTs. **Rotate per environment; never reuse.** |
| `NEXTAUTH_URL` | Public base URL of the deployment. |
| `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | Generic OIDC/OAuth SSO (Azure AD, Okta, UAE PASS). |
| `SAML_IDP_ENTRY_POINT` / `SAML_IDP_ISSUER` / `SAML_IDP_CERT` | SAML 2.0 IdP configuration. |
| `SAML_SP_ENTITY_ID` / `SAML_SP_CALLBACK_URL` | SAML Service Provider identity + ACS URL. |
| `ENABLE_DEV_LOGIN` | `true` only in DEV/TEST. **Must be unset/`false` in PROD.** |
| `UPLOAD_DIR` | Filesystem path (or swap `src/lib/uploads.ts` for object storage in PROD). |

SSO setup detail (metadata URLs, group→role mapping) is in **Security Handover §SSO** and `docs` of the SAD (§14).

---

## 5. Deployment Runbook

**Prerequisites:** Node.js ≥ 20.9, PostgreSQL ≥ 16, network access to the IdP.

```bash
# 1. Install
npm ci

# 2. Provision database roles/objects (runs schema + triggers + RLS + reference seed)
npm run db:migrate

# 3. (DEV/TEST only) load demo users + forms
npm run db:seed

# 4. Build & run
npm run build
npm run start           # listens on $PORT (default 3000)
```

- Put the app behind a TLS-terminating reverse proxy (nginx / Azure App Gateway).
- `app_runtime` DB role password must be set to a strong secret and reflected in `RUNTIME_DATABASE_URL`.
- Rolling deploys: run `db:migrate` before switching traffic; migrations are additive and safe.

---

## 6. Backup & Disaster Recovery

| Item | Target |
|------|--------|
| RPO (max data loss) | **1 hour** — WAL archiving / PITR enabled on PostgreSQL. |
| RTO (max downtime) | **4 hours** — restore from latest base backup + WAL replay. |
| DB backups | Nightly `pg_basebackup` + continuous WAL archive to separate storage. |
| Document store | Object-storage versioning + cross-region replication in PROD. |
| Restore drill | Quarterly restore test into an isolated environment. |

Application tier is stateless (session is a signed cookie) and is recovered by redeploying the build. Only the database and document store hold state.

---

## 7. Monitoring & Observability

- **Health:** `GET /login` returns 200 when the app is up; `GET /` returns 307→/login when unauthenticated (cheap liveness probe).
- **Logs:** application logs to stdout (capture via the platform log driver). Auth failures, workflow transitions, and 5xx should be alerted.
- **DB:** monitor connection count, slow queries, replication lag, and disk. Alert on RLS policy errors (`42501`) which indicate misconfigured runtime role.
- **Audit:** `form_audit_log` is the tamper-evident record of every create/edit/approval — surfaced in the app and queryable for compliance.

---

## 8. Support Model

| Tier | Owner | Responsibility |
|------|-------|----------------|
| **L1** | Service Desk | Password/SSO access, "how do I…", triage, ticket routing. |
| **L2** | Application Support | Data fixes, config changes, attachment/document issues, workflow stuck-state resolution. |
| **L3** | Engineering | Code defects, schema/migration changes, SSO integration, performance. |

**Hypercare:** 2 weeks post-go-live with daily standup and a dedicated L3 on-call. Handover to steady-state support after sign-off.

---

## 9. Known Prototype Boundaries (for production hardening)

- Uploads are stored on local disk (`src/lib/uploads.ts`); swap for OCI/S3 object storage with the document-repository integration from the SAD.
- `ENABLE_DEV_LOGIN` credentials login is for non-production only — disable in PROD; use SSO exclusively.
- Employee/position master-data sync from Oracle HCM (SAD §2) is specified but not wired in this build.

---

## 10. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Delivery Lead | | | |
| IT Operations Owner | | | |
| Information Security | | | |
