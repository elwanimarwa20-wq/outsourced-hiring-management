"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hrApprove, procurementApprove, sectorHeadApprove, returnForm } from "@/lib/forms/actions";

type Stage = "HR" | "PROCUREMENT" | "SECTOR_HEAD";

export function ApprovalActions({
  formId,
  stage,
  notesLabel,
  approveLabel,
  returnLabel,
}: {
  formId: string;
  stage: Stage;
  notesLabel: string;
  approveLabel: string;
  returnLabel: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setBusy(true);
    setError("");
    const fn = stage === "HR" ? hrApprove : stage === "PROCUREMENT" ? procurementApprove : sectorHeadApprove;
    const res = await fn(formId, notes || undefined);
    if (res.ok) router.push("/");
    else {
      setError(res.error);
      setBusy(false);
    }
  }

  async function doReturn() {
    setBusy(true);
    setError("");
    const res = await returnForm(formId, stage, notes || undefined);
    if (res.ok) router.push("/");
    else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-white p-5">
      <label className="mb-1.5 block text-xs font-semibold text-text-label-2">{notesLabel}</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="mb-4 w-full rounded-lg border border-border-btn bg-white px-3 py-2 text-sm focus:border-gold-light focus:outline-none"
      />
      {error ? <div className="mb-3 rounded-lg border border-danger bg-danger-tint px-3 py-2 text-sm text-danger-dark">{error}</div> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={approve}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#2F6B4F", boxShadow: "0 2px 8px rgba(47,107,79,.25)" }}
        >
          ✓ {approveLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={doReturn}
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
          style={{ borderColor: "#7C1733", color: "#7C1733", background: "#F3E4EA" }}
        >
          ↩ {returnLabel}
        </button>
      </div>
    </div>
  );
}
