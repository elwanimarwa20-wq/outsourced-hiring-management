import type { FormStatus } from "@/generated/prisma/enums";

const STYLES: Record<FormStatus, { bg: string; fg: string; dot: string }> = {
  DRAFT: { bg: "#F6ECD6", fg: "#9A6B16", dot: "#9A6B16" },
  PENDING_HR: { bg: "#F3E4EA", fg: "#7C1733", dot: "#7C1733" },
  PENDING_PROCUREMENT: { bg: "#F3E4EA", fg: "#7C1733", dot: "#A6304F" },
  PENDING_SECTOR_HEAD: { bg: "#F3E4EA", fg: "#7C1733", dot: "#7C1733" },
  COMPLETED: { bg: "#E4EFE8", fg: "#2F6B4F", dot: "#2F6B4F" },
};

export function StatusPill({ status, label }: { status: FormStatus; label: string }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {label}
    </span>
  );
}
