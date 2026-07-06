# Outsourced & Service Contract Hiring Management System

A bilingual (English / Arabic, full RTL) web application for a UAE Ministry to create, track, approve, and archive **hiring forms for outsourced and service-contract staff** — denominated in **AED**.

Built from the [Solution Architecture Document](../project/Solution%20Architecture%20Document.dc.html) design handoff. The SAD targeted Oracle APEX / Oracle DB; this implementation delivers the same data model, workflow, RBAC, and computed-column guarantees on a modern, runnable stack.

## Stack

- **Next.js 16** (App Router, React 19) + **Tailwind CSS 4** — responsive, bilingual EN/AR
- **PostgreSQL 16** + **Prisma 7** — in-database computed columns, audit triggers, and Row-Level Security
- **Auth.js (NextAuth v5)** — SAML 2.0 + OIDC/OAuth 2.0 SSO, RBAC, dev credentials login for local use

## Features

- **Hiring Forms Repository** — KPI cards, faceted search/filters, 11-column table.
- **Create Hiring Form** — 3-tab wizard (Candidate Personal Data · Employment Data · Fees & Costs) with employee photo, 4-slot attachments (attach/replace/remove), and a live cost comparison table with optional per-benefit spouse/child breakdown.
- **PDF Preview** — printable A4 hiring document with signature/approval blocks.
- **3-stage approval** — HR Director → Procurement & Contracts → Sector Head → Completed (returns route back to HR).
- **Bilingual** — EN/AR toggle flips the whole UI to RTL, including option labels.
- **Auditable** — every create/edit/approval recorded; computed totals guaranteed by the database.

## Quick start

```bash
# PostgreSQL 16 must be running and reachable via DATABASE_URL / RUNTIME_DATABASE_URL (.env)
npm ci
npm run db:migrate      # schema + triggers + RLS + reference data
npm run db:seed         # demo users + forms (DEV/TEST only)
npm run build && npm run start   # http://localhost:3000
```

### Demo sign-in (dev only)

With `ENABLE_DEV_LOGIN=true`, the login page offers a **role picker**. Sign in as any of:
Hiring Manager · HR Director · Procurement & Contracts · Sector Head · Administrator.

Walkthrough: **Dashboard → + New Hiring Form → fill tabs 1–3 → Preview Document → Send for HR Approval**, then sign in as HR Director → approve → Procurement → approve → Sector Head → finalize → the form shows **Completed** on the dashboard.

### End-to-end test

```bash
npm run test:e2e        # drives the full workflow + RBAC + Arabic RTL in a headless browser
```

## Documentation

- [`docs/IT-Handover.md`](docs/IT-Handover.md) — architecture, deployment, backup/DR, monitoring, support model.
- [`docs/Security-Handover.md`](docs/Security-Handover.md) — data protection, RBAC, SSO, control-evidence matrix, UAE IA / ISO 27001 alignment.

## Configuration

See `.env` and IT-Handover §4. Key production notes: disable `ENABLE_DEV_LOGIN`, rotate `AUTH_SECRET` and the `app_runtime` DB password, and point uploads at object storage.
