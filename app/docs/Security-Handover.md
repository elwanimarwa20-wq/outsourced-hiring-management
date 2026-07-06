# Security Handover & Compliance
### Outsourced & Service Contract Hiring Management System
**United Arab Emirates · Ministry of Cabinet Affairs — Human Resources**
Version 1.0 · Confidential

Aligned to **UAE Information Assurance (IA) Standards** and **ISO/IEC 27001**.

---

## 1. Data Protection

| Control | Implementation |
|---------|----------------|
| Data classification | Hiring forms hold PII (name, nationality, passport/ID, salary). Classified **Confidential**. |
| Encryption in transit | TLS 1.2+ terminated at the reverse proxy; HSTS in PROD. |
| Encryption at rest | PostgreSQL storage + object storage encrypted at rest (platform-managed keys). |
| Data minimisation | Only fields required by the hiring process are collected; no free-text of sensitive categories beyond the defined schema. |
| Retention | Completed forms retained per Ministry records policy; audit log retained ≥ 7 years. |
| Attachments | Restricted to `.pdf/.docx/.jpg/.png`; served only through the auth-gated `/api/files/*` route with path-traversal protection. |

---

## 2. Access Control & Accountability

| Control | Implementation |
|---------|----------------|
| Authentication | Federated SSO — **SAML 2.0** and **OIDC/OAuth 2.0 (PKCE)**. Passwords never handled by the app in production. |
| Authorization (RBAC) | Five roles (Hiring Manager, HR Director, Procurement, Sector Head, Admin). Capability matrix in `src/lib/rbac.ts`; enforced in `proxy.ts`, server actions, **and** the database. |
| Least privilege (DB) | App connects as non-superuser `app_runtime`. **Row-Level Security** restricts Hiring Managers to their own forms; approval roles see all. Superuser is used only for migrations. |
| Segregation of duties | Approval chain HR Director → Procurement → Sector Head; no single role can both create and finalize. Sector Head rejection routes back to HR. |
| Accountability | Immutable `form_audit_log` records who did what and when for every create/edit/status change — written by DB triggers and server actions. |
| Session security | Signed, `httpOnly`, `sameSite=lax`, `secure` (PROD) JWT cookie; 8-hour lifetime. |

**IdP group → application role mapping** (`mapIdpGroupsToRole`): groups containing `admin`, `sector`, `procure/contract`, `hr/human` map to the corresponding role; default is Hiring Manager. Confirm the exact IdP group names with the identity team before go-live.

---

## 3. Single Sign-On (SSO)

**SAML 2.0 Service Provider endpoints:**
- Metadata: `GET /api/auth/saml/metadata` (hand to the IdP admin to register the SP)
- Login (SP-initiated): `GET /api/auth/saml/login`
- Assertion Consumer Service: `POST /api/auth/saml/acs`

Assertions must be signed (`wantAssertionsSigned`); the IdP certificate is pinned via `SAML_IDP_CERT`. NameID format defaults to emailAddress.

**OIDC/OAuth:** Authorization-Code + **PKCE**, scopes `openid profile email groups`. Configure `OIDC_ISSUER` and client credentials. UAE PASS can act as the national OIDC broker.

---

## 4. Secure SDLC & Secrets

| Control | Status |
|---------|--------|
| Secrets management | All secrets via environment/secret store; none in source. `.env` git-ignored. |
| Dependency hygiene | `npm audit` in CI; pin & review before upgrade. |
| Input validation | Server-side validation on all mutations; typed enums enforced at the DB. |
| Output/AuthZ checks | Every server action re-checks the caller's role; RLS is the backstop. |
| Injection | Parameterised queries via Prisma; the single `SET LOCAL` GUC write sanitises input. |
| File upload | MIME allow-list + size caps; stored outside the web root, served via auth gate. |

---

## 5. Control-Evidence Matrix

| Domain | Control | Evidence / Location |
|--------|---------|---------------------|
| VAPT | Pre-go-live penetration test | Schedule with security team; remediate before PROD. |
| Secure SDLC | Code review, typed schema, migrations | Git history, `prisma/migrations/`. |
| Secrets | No secrets in repo | `.gitignore`, env-only config. |
| Logging/SIEM | App + DB logs shipped to SIEM | Platform log driver → SIEM; alert on 5xx, auth failures, RLS `42501`. |
| Incident Response | IR runbook + audit trail | `form_audit_log`; IT Handover §7–8. |
| RBAC | Role matrix + RLS | `src/lib/rbac.ts`, migration RLS policies. |
| Backup/DR | RPO 1h / RTO 4h | IT Handover §6. |
| Compliance | UAE IA / ISO 27001 mapping | This document. |

---

## 6. Residual Risks & Production Actions

1. **Disable `ENABLE_DEV_LOGIN` in PROD** — the role-picker credentials login is for DEV/TEST only.
2. **Rotate `AUTH_SECRET` and the `app_runtime` DB password** per environment before go-live.
3. **Complete VAPT** and remediate findings prior to handling live PII.
4. **Wire object storage** for attachments (currently local disk in the prototype).
5. **Confirm IdP group names** used for role mapping with the identity team.

---

## 7. Tri-Party Sign-off

| Party | Name | Date | Signature |
|-------|------|------|-----------|
| Information Security | | | |
| IT Operations | | | |
| Business Owner (HR) | | | |
