import { auth } from "@/auth";
import type { SessionContext } from "@/lib/db";
import type { Role } from "@/lib/rbac";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

export function rlsContext(user: CurrentUser): SessionContext {
  return { userId: user.id, role: user.role };
}
