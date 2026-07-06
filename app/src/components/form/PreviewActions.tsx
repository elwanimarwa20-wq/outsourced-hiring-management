"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitForHrApproval } from "@/lib/forms/actions";
import type { Locale } from "@/lib/i18n/dictionaries";

export function PreviewActions({
  formId,
  locale,
  labels,
}: {
  formId: string;
  locale: Locale;
  labels: { backToForm: string; print: string; sendForHrApproval: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-white no-print">
      <div className="mx-auto flex max-w-[820px] items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => router.push(`/forms/${formId}`)}
          className="rounded-lg border border-border-btn bg-white px-3 py-2 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg"
        >
          {locale === "ar" ? "→" : "←"} {labels.backToForm}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-gold bg-white px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold-hover-bg"
          >
            ⎙ {labels.print}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await submitForHrApproval(formId);
              if (res.ok) router.push(`/forms/${formId}/approval`);
              else setBusy(false);
            }}
            className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-white transition hover:bg-gold-hover disabled:opacity-50"
            style={{ boxShadow: "0 2px 8px rgba(158,123,47,.25)" }}
          >
            {labels.sendForHrApproval}
          </button>
        </div>
      </div>
    </div>
  );
}
