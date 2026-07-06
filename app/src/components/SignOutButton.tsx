"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-border-btn bg-white px-3 py-1.5 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg"
    >
      {label}
    </button>
  );
}
