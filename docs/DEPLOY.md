# Deploying to a live, testable URL

GitHub only stores the code — it can't run this app. To get a public link you can
open in a browser, deploy the app to **Vercel** and use a hosted **PostgreSQL**
database (**Neon** has a free tier). Both connect directly to this GitHub repo.
Total time: ~10 minutes, no credit card required.

---

## 1. Create a free PostgreSQL database (Neon)

1. Go to <https://neon.tech> and sign up (GitHub login works).
2. Create a project → it gives you a **connection string** like:
   `postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Copy that string — it's your `DATABASE_URL`.

## 2. Deploy the app (Vercel)

1. Go to <https://vercel.com> → **Add New… → Project** → **Import Git Repository**.
2. Choose **`elwanimarwa20-wq/outsourced-hiring-management`**.
3. **Root Directory:** leave as the repo root (`./`) — the Next.js app is at the root, so Vercel detects it automatically.
4. Add the **Environment Variables** below, then click **Deploy**.

Vercel automatically runs `prisma migrate deploy && next build` (the `vercel-build`
script), so the schema, triggers, Row-Level Security, and reference data are created
on first deploy.

### Environment variables (minimum to test)

| Name | Value |
|------|-------|
| `DATABASE_URL` | your Neon connection string |
| `AUTH_SECRET` | any long random string (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | your Vercel URL, e.g. `https://your-app.vercel.app` |
| `ENABLE_DEV_LOGIN` | `true` (lets you sign in with the role picker to test) |

> Leave the OIDC/SAML variables empty for now — the app falls back to the dev
> role-picker login so you can test immediately. Add SSO later (see
> `Security-Handover.md`).

## 3. Load demo data (optional, one time)

To pre-populate the dashboard with sample users and forms, run once from your
machine against the Neon database:

```bash
git clone https://github.com/elwanimarwa20-wq/outsourced-hiring-management
cd outsourced-hiring-management
npm ci
DATABASE_URL="<your-neon-url>" npm run db:seed
```

(You can skip this — signing in as any role via the dev login lets you create
forms from scratch.)

## 4. Test it

Open your `https://<project>.vercel.app`, sign in with the **role picker**, and walk
the flow: **New Hiring Form → fill tabs 1–3 → Preview → Send for HR Approval**, then
re-sign-in as HR Director → Procurement → Sector Head to approve through to
**Completed**. Toggle **العربية** for the Arabic/RTL view.

---

## Notes for a hardened / production deploy

- **Full Row-Level Security:** the app can run with a single `DATABASE_URL`, but for
  the RLS policies to bind, set `RUNTIME_DATABASE_URL` to the restricted
  `app_runtime` role the migration creates (give it a strong password and use it in
  the connection string). See `IT-Handover.md` §2 & §4.
- **Turn off `ENABLE_DEV_LOGIN`** and wire real SSO (SAML/OIDC) before handling live
  data — see `Security-Handover.md`.
- **Attachments** use local disk in this build; on Vercel's ephemeral filesystem,
  switch `src/lib/uploads.ts` to object storage (S3/Neon/Vercel Blob) for persistence.
