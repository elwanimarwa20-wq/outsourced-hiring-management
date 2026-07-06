import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient() {
  // Runtime traffic connects as the restricted `app_runtime` Postgres role
  // (not the migration-owner role in DATABASE_URL) so Row-Level Security
  // policies actually apply — see prisma/migrations/*/migration.sql.
  const connectionString = process.env.RUNTIME_DATABASE_URL ?? process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type SessionContext = {
  userId: string | null;
  role: string;
};

/**
 * Runs `fn` inside a transaction with Postgres session GUCs
 * (`app.role` / `app.user_id`) set, so the Row-Level
 * Security policies defined in the init migration are enforced by the
 * database itself — not just by application-level checks.
 */
export async function withRlsContext<T>(
  ctx: SessionContext,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = '${ctx.role.replace(/'/g, "")}'`);
    await tx.$executeRawUnsafe(
      `SET LOCAL app.user_id = '${(ctx.userId ?? "").replace(/'/g, "")}'`,
    );
    return fn(tx);
  });
}
