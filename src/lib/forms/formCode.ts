import type { Prisma } from "@/generated/prisma/client";

/**
 * Generates the next sequential form code (OSF-YYYY-NNNN) for the current year.
 * Runs inside the caller's transaction so the count is consistent.
 */
export async function nextFormCode(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OSF-${year}-`;
  const rows = await tx.hiringForm.findMany({
    where: { formCode: { startsWith: prefix } },
    select: { formCode: true },
    orderBy: { formCode: "desc" },
    take: 1,
  });
  let seq = 1;
  if (rows.length) {
    const last = parseInt(rows[0].formCode.slice(prefix.length), 10);
    if (!Number.isNaN(last)) seq = last + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
