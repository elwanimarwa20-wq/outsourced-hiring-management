# Handoff: Outsourced & Service Contract Staff Hiring Management

## Overview
A centralized web application for a UAE Ministry (Ministry of Cabinet Affairs and affiliated entities) to create, track, approve, and archive **hiring forms for outsourced and service-contract staff**. HR and Hiring Managers create a form, capture the candidate's personal/employment data and a full cost breakdown, attach supporting documents, then route the form through a three-stage approval chain (**HR Director → Procurement & Contracts → Sector Head**). The app is **bilingual (English / Arabic with full RTL)** and denominated in **AED**.

## About the Design Files
The files in `designs/` are **design references created in HTML** — interactive prototypes that show the intended look, layout, copy, and behavior. **They are not production code to copy directly.** They are built as "Design Components" (`.dc.html`) that run on a small bundled runtime (`support.js`) — this runtime is an authoring/preview convenience and is **not** part of the target architecture.

Your task is to **recreate these designs in the target codebase's environment**:
- **If Oracle APEX** is the platform (the primary intended target — see `Solution Architecture Document.dc.html`): build these as APEX pages, regions, and processes on Oracle DB.
- **If a web-app stack** (React/Vue/etc. on a REST/GraphQL API): recreate the screens as components using the codebase's existing design system, and implement the data model on the chosen database.
- If no environment exists yet, pick the most appropriate stack for a government internal app and implement there.

Treat the described behavior as the spec for the real app — not as an instruction to ship the HTML.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy (EN + AR), and interactions are all specified. Recreate the UI faithfully using the target codebase's component library, matching the tokens in the Design Tokens section below.

---

## Screens / Views

The app has **6 screens** plus **1 reference document**. Navigation between them (in the prototype) is plain page navigation; state is passed via `localStorage` under the `osf_*` keys — in the real app this is server/DB state.

### 1. Hiring Forms Repository (Dashboard) — `Hiring Management Dashboard.dc.html`
- **Purpose:** Master list of all hiring forms; entry point for creating and opening forms; KPIs and analytics.
- **Layout:** Fixed top chrome (4px maroon→gold gradient strip, then a white header with a back-affordance, centered Ministry logo, language toggle). Below: a page title row with a primary **"+ New Hiring Form"** button, a row of **KPI cards**, an **analytics/charts** block, a **search + filter bar**, and the **forms table**.
- **KPI cards:** Total Forms, Completed, Draft, Total Projected Annual Cost (AED). White cards, 1px `#E6E1D4` border, 12px radius, label in muted grey + large tabular-nums figure.
- **Filters:** Employee Name (text), Form Status (select), Hiring Manager (select), Creation Date, Last Updated Date, Nationality (select), Contract Type (select).
- **Table columns:** Form ID · Employee Name · Position · Nationality · Proposed Monthly Salary · Annual Salary (auto = monthly×12) · Status · Created By · Created Date · Last Updated · Actions.
- **Row action:** **Open** (gold pill button) → navigates to Create Hiring Form loaded with that record. (Note: a Print action was intentionally removed — the PDF preview is reachable only after filling a form.)
- **Status pill:** Completed = green (`bg #E4EFE8 / fg #2F6B4F`); Draft = amber (`bg #F6ECD6 / fg #9A6B16`). Small dot + label.
- **Behavior:** "+ New Hiring Form" navigates to a **separate** Create Hiring Form page (must be real routing/navigation, not scroll-to-section). On load, the dashboard re-reads the forms list so edits made on the form page are reflected.

### 2. Create Hiring Form — `Create Hiring Form.dc.html`
- **Purpose:** The full data-entry form. A standalone page (not embedded in the dashboard).
- **Top chrome:** Back to Dashboard, entity **logo selector** (dropdown — 7 entities; the chosen logo also drives the header on the preview), language toggle, and the action buttons **Save Draft** and **Mark Completed**.
- **Three tabs** (numbered pills, gold active state):
  - **Tab 1 — Candidate Personal Data:** Employee Photo (circular image slot, uploadable) + fields: Employee Full Name*, Marital Status (dropdown: Single/Married/Divorced/Widowed), Nationality (dropdown, bilingual labels), Academic Qualification (dropdown), Years of Experience (dropdown), Sector/Department (dropdown), Assessment Test Result (dropdown: Acceptable / Very Good / Excellent), Current Work Location (text), Security Clearance (dropdown: Approved / Not Approved). **Attachments live at the end of Tab 1** (see below).
  - **Tab 2 — Employment Data:** Proposed Job Title*, Organization/Entity (dropdown), Sector/Department (dropdown), Direct Manager (text), Contract Type (dropdown: Outsourced / Service Contract), Contract Duration (dropdown: 1–5 Years).
  - **Tab 3 — Fees & Costs:** the cost comparison table (see below), then the single forward CTA **"Preview Document →"**.
- **Navigation buttons:** Each tab has Next / Previous; **Save Draft sits next to the Next button** (not only in the top chrome).
- **New-Hire toggle (Tab 3):** when ON, the **Current Status** column is hidden (nothing to compare against); when OFF, both Current and Proposed columns show.

#### Cost comparison table (Tab 3) — this is the most detailed component
Columns: **Item · Current Status · Proposed Status · Differences** (Current hidden when New-Hire toggle is on). Grouped into **Monthly Salary & Allowances** and **Additional Benefits**. Rows:
- **Monthly Salary** — editable Current + Proposed number boxes; difference auto-computed.
- **Air Ticket Allowance (annual)** — editable Current + Proposed. If employee is **Married**, the row can expand with **＋ Add Spouse** and **＋ Add Child** sub-rows, each with its own editable Current + Proposed box and a **×** remove button. Children are individually addable/removable. The row total = employee amount + all added members.
- **Visa + Labour Card (annual)** — same editable + optional family-member breakdown pattern as Air Ticket. (Label is "Visa and Labour Card"; conceptually can be visa+labour card or labour card only.)
- **Total (Monthly)** — read-only rollup.
- **Health Insurance (monthly)** — same editable + optional family-member breakdown pattern.
- **End of Service** — editable Current + Proposed (manual figures; **not** auto-calculated).
- **Outsourcing Co. Share** — editable Current + Proposed (manual; the % basis is either **9% or 18%**, selectable).
- **Total Monthly Contract Cost** — read-only.
- **Annual Contract Cost** — read-only, emphasized (maroon band, gold figure).
- All money cells use `font-variant-numeric: tabular-nums`. Difference cells: green for increase, red for decrease, grey "No change".

#### Attachments (end of Tab 1)
Four fixed slots: **CV / Resume, Quotation, Passport, Signed Hiring Form**. Each slot:
- Empty state → **＋ Attach** button (accepts `.pdf,.docx,.doc,.jpg,.jpeg,.png`).
- Filled state → shows filename + size, plus **Replace** and **Remove** buttons.
- (Prototype stores name+size only; real app uploads the binary to the document repository and keeps version history.)

### 3. Hiring Form Preview (PDF) — `Hiring Form Preview.dc.html`
- **Purpose:** The formatted, printable hiring document — the **only** place the PDF appears (reached from Tab 3's "Preview Document" CTA).
- **Layout:** A4-style white sheet on a grey desk. Header = selected entity logo (left) + document title + Form ID. Sections mirror the form: candidate data, employment data, itemized costs, and an **Annual Contract Cost** band. **Signature/approval blocks** at the bottom show role + name only (the "Date: ____" line was removed).
- **Sticky action bar (non-print):** **Back to Form** (returns to Create Hiring Form), **Print / Save PDF** (secondary gold — white bg, gold border/text), and the primary CTA **Send for HR Approval** (solid gold, no icon).
- The preview always reflects the **latest** saved form data and the chosen entity logo.

### 4. HR Approval View — `HR Approval View.dc.html`
- **Purpose:** The read-only review the **HR Director** sees when a form is sent for approval.
- **Layout:** Maroon gradient banner ("Pending HR Approval", review title, submitter + forwarded note) with **Approve** (green) and **Return for Revision** (light maroon) buttons; below, the full form summary + attachments + an **HR Director Notes** textarea.
- **Behavior:** Approve → forwards to **Procurement Approval View**. Return → back to the form.

### 5. Procurement Approval View — `Procurement Approval View.dc.html`
- **Purpose:** Second approval stage (**Procurement & Contracts**). Same maroon color scheme as HR (unified across all approval stages). Banner reads "Pending Procurement Approval" and "Approved by HR Director · Forwarded to Procurement".
- **Behavior:** **Approve & Finalize** → forwards to **Sector Head Approval View**. **Return to HR** → back to HR Approval View.

### 6. Sector Head Approval View — `Sector Head Approval View.dc.html`
- **Purpose:** Final approval stage (**Sector Head**). Same maroon scheme. 
- **Behavior:** **Approve** → marks the form **Completed** and returns to the Dashboard. **Return to HR** → back to HR Approval View (rejection at this stage goes to HR, not Procurement).

### Reference — Solution Architecture Document — `Solution Architecture Document.dc.html`
A 13-section printable architecture doc (objective, architecture, Oracle DB schema/DDL, ERD, workflow, APEX pages, security/RBAC model, reporting, deployment plan, UAT scenarios, future enhancements). Use it as the authoritative spec for the data model and Oracle APEX build. **Not a UI screen** — it's documentation.

---

## Interactions & Behavior
- **Navigation:** All screen-to-screen moves are real page navigations. "+ New Hiring Form" opens a separate Create page; approval Approve/Return actions route to the next/previous stage.
- **Approval chain:** Preview → **HR Director** → **Procurement & Contracts** → **Sector Head** → Completed. Any stage's "Return" sends the form back to HR (Sector Head) or the prior stage (Procurement → HR); Completed status is set only after Sector Head approval.
- **Auto-calculations:** Annual Salary = Monthly × 12. Annual Contract Cost = (monthly salary + monthly benefits) × 12, summing all itemized costs including any family-member sub-rows. Difference column = Proposed − Current per row.
- **Conditional UI:** Marital Status = Married unlocks ＋Add Spouse / ＋Add Child in each of the three benefit sections (Air Ticket, Visa+Labour Card, Health Insurance), independently per section. New-Hire toggle hides the Current column.
- **Bilingual:** A language toggle flips the entire UI between English (LTR) and Arabic (RTL), including dropdown option labels and number/label alignment. `dir` switches `ltr`↔`rtl`; alignment helpers flip start/end.
- **Attachments:** attach / replace / remove per slot; restricted file types.
- **Status:** Draft (editable) and Completed (still editable). Save Draft and Mark Completed available from the form.

## State Management
State needed per form (see `Solution Architecture Document.dc.html` §Database for the canonical model):
- Identity/personal: name (EN/AR), marital status, nationality, passport, mobile, photo, academic qualification, years of experience, assessment result, current work location, security clearance.
- Employment: entity, sector/department, proposed job title, direct manager, contract type, contract duration, start date.
- Costs: proposed monthly salary; per-benefit current & proposed amounts (air ticket, visa+labour card, health insurance) each with optional spouse/children breakdown; end-of-service (manual); outsourcing-company share (manual, 9% or 18%).
- Workflow: status (Draft/Completed), current approval stage, per-stage notes, audit trail (who/what/when), attachment records with versions.
- UI-only: active language, active tab, new-hire toggle, selected entity logo.

In the prototype these persist in `localStorage` (`osf_forms`, `osf_active_id`, `osf_active_mode`, `osf_preview_*`). In production, replace with DB-backed state + an API.

## Design Tokens
**Colors**
- Primary maroon: `#7C1733` (deep), banner gradient `#7C1733 → #A6304F`
- Gold accents: `#9E7B2F` (primary gold), `#C7A24A` (light gold / input focus border), hover `#8C6B26`
- Gold tints: `#FBF6EA` (bg), `#F3ECDC` (hover), `#EDE2C7` (border), `#FFE6B0` / `#FFD0A0` (on-maroon text)
- Page background: `#F2F0E9`; desk (print): `#E9E6DD`
- Card / surface: `#FFFFFF`; subtle section bg: `#FBFAF6`, `#F8F6F0`
- Borders: `#E6E1D4` (default), `#D9D3C2` (button), `#F0EDE3` (inner divider)
- Text: `#23211C` (primary), `#332F28` (body), `#4A463C` / `#6B6657` (labels), `#8C877A` (muted), `#A8A293` (faint)
- Success/green: `#2F6B4F` (fill), `#255B41` (hover), `#E4EFE8`/`#BFD9C9` (tint) 
- Warning/amber (Draft): fg `#9A6B16`, bg `#F6ECD6`
- Danger/remove: fg `#B22234`/`#8B1A1A`, bg `#FDEAEA`, border `#F5C0C0`/`#F0C8C8`
- Diff colors: increase `#2F6B4F`, decrease `#B22234`, none `#8C877A`

**Typography**
- English: `IBM Plex Sans` (400/500/600/700)
- Arabic: `IBM Plex Sans Arabic` (400/500/600/700)
- Sizes: page title ~21px/700; section title ~14.5px/700; field label 11.5px/600; input 13–13.5px; table body 12.5–13px; KPI figure large; annual-total figure ~20px/700. Money always `font-variant-numeric: tabular-nums`.

**Radius:** cards 12px; inputs/buttons 7–9px; pills/status 20px; small remove-button 50%.
**Shadows:** cards mostly flat with 1px borders; primary buttons `0 2px 8px rgba(124,23,51,.25)` (maroon) or `rgba(158,123,47,.25)` (gold); print sheet `0 4px 24px rgba(0,0,0,.12)`.
**Spacing:** card padding 14–22px; grid gaps 14–16px; two-column form grids.

## Assets
- `designs/assets/` — Ministry / entity logos used in headers and the print sheet (e.g. `moca-logo.jpg`). The entity logo selector on the Create form chooses which of the (up to 7) entity logos appears on the document/preview.
- Employee photo — user-uploaded via the circular image slot (`image-slot.js` in the prototype; use the codebase's file-upload component in production).
- Fonts — IBM Plex Sans & IBM Plex Sans Arabic (Google Fonts).
- No SVG-drawn brand art; logos are raster assets in `assets/`.

## Files
In `designs/`:
- `Hiring Management Dashboard.dc.html` — Screen 1 (repository/dashboard)
- `Create Hiring Form.dc.html` — Screen 2 (3-tab form + costs + attachments)
- `Hiring Form Preview.dc.html` — Screen 3 (printable PDF preview)
- `HR Approval View.dc.html` — Screen 4 (HR Director)
- `Procurement Approval View.dc.html` — Screen 5 (Procurement & Contracts)
- `Sector Head Approval View.dc.html` — Screen 6 (Sector Head)
- `Solution Architecture Document.dc.html` — architecture & DB/APEX/security spec (reference, 13 sections)
- `support.js` — prototype runtime only (do **not** port)
- `image-slot.js` — prototype image-upload widget (replace with codebase equivalent)
- `assets/` — logos and images

### How to view the prototypes
Open any `.dc.html` in a browser. Use the language toggle to see EN/AR/RTL. To exercise the full flow: Dashboard → + New Hiring Form → fill tabs 1–3 → Preview Document → Send for HR Approval → Approve through Procurement → Sector Head → back to Dashboard as Completed.
