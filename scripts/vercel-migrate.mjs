// Runs `prisma migrate deploy` during the Vercel build, but only when a
// database is actually configured — and never fails the build if migration
// can't run yet (e.g. DATABASE_URL not set, or DB unreachable at build time).
// This lets Vercel deploy the site even before the database is wired up.
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn("[vercel-migrate] DATABASE_URL is not set — skipping migrations. " +
    "Set it in Vercel → Project → Settings → Environment Variables to enable the database.");
  process.exit(0);
}

try {
  console.log("[vercel-migrate] Applying database migrations…");
  execSync("prisma migrate deploy", { stdio: "inherit" });
  console.log("[vercel-migrate] Migrations applied.");
} catch (err) {
  console.warn("[vercel-migrate] Migration step failed (continuing build anyway): " +
    (err?.message ?? err));
  // Do not fail the build — the app can still deploy; fix the DB and redeploy.
  process.exit(0);
}
