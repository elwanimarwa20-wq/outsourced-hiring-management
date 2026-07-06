"use client";

import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageToggle({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setLocale(next, pathname))}
      className="rounded-lg border border-border-btn bg-white px-3 py-1.5 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg disabled:opacity-50"
    >
      {label}
    </button>
  );
}
