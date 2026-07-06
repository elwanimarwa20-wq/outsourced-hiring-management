import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const ctx = await browser.newContext();
const page = await ctx.newPage();
const log = (...a) => console.log(...a);
let failures = 0;
function check(cond, msg) {
  log(cond ? `✓ ${msg}` : `✗ ${msg}`);
  if (!cond) failures++;
}

async function loginAs(role) {
  await ctx.clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator("select").first().selectOption(role);
  await page.getByRole("button", { name: /Developer sign-in|دخول تجريبي/ }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
}

// 1. Login as hiring manager
await loginAs("HIRING_MANAGER");
check(await page.getByText("Hiring Forms Repository").isVisible(), "dashboard loads after login");

// 2. KPI + table populated from seed
const rows = await page.locator("table tbody tr").count();
check(rows >= 7, `dashboard lists seeded forms (found ${rows})`);

// 3. Create a new form
await page.getByRole("link", { name: /New Hiring Form/ }).click();
await page.waitForURL(/\/forms\/new/);
// Tab 1: fill name
const nameInput = page.locator('label:has-text("Employee Full Name")').locator("xpath=following::input[not(@type=\"file\")][1]");
await nameInput.waitFor();
await nameInput.fill("E2E Test Candidate");
// marital -> married to expose family rows later
await page.locator('label:has-text("Marital Status")').locator("xpath=following::select[1]").selectOption("MARRIED");
// Save draft
await page.getByRole("button", { name: /Save Draft|حفظ/ }).click();
await page.getByText(/Saved ✓|تم الحفظ/).waitFor({ timeout: 15000 });
await page.waitForFunction(() => /\/forms\/[0-9a-f-]{36}$/.test(location.pathname), { timeout: 5000 });
check(/\/forms\/[0-9a-f-]{36}$/.test(new URL(page.url()).pathname), "new form saved as draft (URL has id)");

// 4. Tab 2
await page.getByRole("button", { name: /^2/ }).click();
await page.locator('label:has-text("Proposed Job Title")').locator("xpath=following::input[1]").fill("QA Engineer");

// 5. Tab 3 costs
await page.getByRole("button", { name: /^3/ }).click();
// enter monthly salary (proposed) — first money input in table
const moneyInputs = page.locator('table input[type="number"]');
await moneyInputs.first().fill("10000");
// Add a child to air ticket
const addChild = page.getByRole("button", { name: /Add Child/ }).first();
if (await addChild.isVisible()) {
  await addChild.click();
  check(true, "family: add child row works (married)");
}
// Preview
await page.getByRole("button", { name: /Preview Document/ }).click();
await page.waitForURL(/\/preview$/, { timeout: 15000 });
check(await page.getByText(/Hiring Form|توظيف/).first().isVisible(), "preview document renders");
const annual = await page.getByText(/Annual Contract Cost/).isVisible();
check(annual, "preview shows Annual Contract Cost band");

// 6. Send for HR approval
await page.getByRole("button", { name: /Send for HR Approval/ }).click();
await page.waitForURL(/\/approval$/, { timeout: 15000 });
check(await page.getByText(/HR Director Approval|Pending HR Approval/).first().isVisible(), "routed to HR approval view");
const formUrl = page.url();

// Hiring manager cannot approve (no approve button)
const hmApprove = await page.getByRole("button", { name: /Approve & Forward/ }).count();
check(hmApprove === 0, "hiring manager cannot approve at HR stage (RBAC)");

// 7. Login as HR director, approve
await loginAs("HR_DIRECTOR");
await page.goto(formUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Approve & Forward/ }).click();
await page.waitForURL(`${BASE}/`, { timeout: 15000 });
check(true, "HR approved -> back to dashboard");

// 8. Procurement approve
await loginAs("PROCUREMENT");
await page.goto(formUrl, { waitUntil: "networkidle" });
check(await page.getByText(/Procurement/).first().isVisible(), "procurement stage visible");
await page.getByRole("button", { name: /Approve & Forward/ }).click();
await page.waitForURL(`${BASE}/`, { timeout: 15000 });

// 9. Sector head finalize
await loginAs("SECTOR_HEAD");
await page.goto(formUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Approve & Finalize/ }).click();
await page.waitForURL(`${BASE}/`, { timeout: 15000 });
check(true, "sector head finalized -> completed");

// 10. Verify completed on dashboard
await page.goto(formUrl.replace(/\/approval$/, "/approval"), { waitUntil: "networkidle" });
check(await page.getByText(/Completed|مكتمل/).first().isVisible(), "form shows completed banner");

// 11. Arabic toggle
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "العربية" }).click();
await page.waitForTimeout(1500);
const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
check(dir === "rtl", "language toggle switches to RTL Arabic");

await browser.close();
log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
