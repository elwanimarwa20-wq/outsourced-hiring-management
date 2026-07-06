"use client";

import { useRef, useState } from "react";
import { ATTACHMENT_SLOTS, type AttachmentInfo } from "./state";
import type { AttachmentSlot } from "@/generated/prisma/enums";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsCard({
  formId,
  attachments,
  onChange,
  labels,
}: {
  formId: string | undefined;
  attachments: Record<AttachmentSlot, AttachmentInfo>;
  onChange: (slot: AttachmentSlot, info: AttachmentInfo) => void;
  labels: {
    title: string;
    attach: string;
    replace: string;
    remove: string;
    slots: Record<AttachmentSlot, string>;
    saveFirst: string;
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h3 className="mb-3 text-[14.5px] font-bold text-text-primary">{labels.title}</h3>
      {!formId ? (
        <p className="mb-3 rounded-lg bg-warning-tint px-3 py-2 text-xs text-warning">{labels.saveFirst}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ATTACHMENT_SLOTS.map((slot) => (
          <AttachmentSlotRow
            key={slot}
            formId={formId}
            slot={slot}
            label={labels.slots[slot]}
            info={attachments[slot]}
            onChange={(info) => onChange(slot, info)}
            labels={labels}
          />
        ))}
      </div>
    </div>
  );
}

function AttachmentSlotRow({
  formId,
  slot,
  label,
  info,
  onChange,
  labels,
}: {
  formId: string | undefined;
  slot: AttachmentSlot;
  label: string;
  info: AttachmentInfo;
  onChange: (info: AttachmentInfo) => void;
  labels: { attach: string; replace: string; remove: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!formId) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("slot", slot);
    fd.append("file", file);
    const res = await fetch(`/api/forms/${formId}/attachments`, { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      onChange({ fileName: d.fileName, fileSize: d.fileSize, url: d.url });
    }
  }

  async function remove() {
    if (!formId) return;
    setBusy(true);
    await fetch(`/api/forms/${formId}/attachments?slot=${slot}`, { method: "DELETE" });
    setBusy(false);
    onChange(null);
  }

  return (
    <div className="rounded-lg border border-border-inner bg-surface-subtle p-3">
      <div className="mb-2 text-xs font-semibold text-text-label-2">{label}</div>
      {info ? (
        <div className="flex items-center justify-between gap-2">
          <a href={info.url} target="_blank" rel="noreferrer" className="truncate text-sm text-maroon underline">
            {info.fileName} <span className="text-text-muted">({fmtSize(info.fileSize)})</span>
          </a>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" disabled={busy || !formId} onClick={() => inputRef.current?.click()} className="rounded-md border border-border-btn bg-white px-2 py-1 text-xs font-semibold text-text-label transition hover:bg-gold-hover-bg disabled:opacity-50">
              {labels.replace}
            </button>
            <button type="button" disabled={busy} onClick={remove} className="rounded-md border border-danger px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger-tint disabled:opacity-50" style={{ borderColor: "#F5C0C0", background: "#FDEAEA" }}>
              {labels.remove}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={busy || !formId} onClick={() => inputRef.current?.click()} className="rounded-lg border border-gold bg-gold-bg px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold-hover-bg disabled:opacity-50">
          {labels.attach}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
