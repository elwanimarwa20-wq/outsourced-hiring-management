"use client";

import { useRef, useState } from "react";

export function PhotoUpload({
  photoUrl,
  onChange,
  labels,
}: {
  photoUrl: string;
  onChange: (url: string) => void;
  labels: { title: string; upload: string; hint: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/photo", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const { url } = await res.json();
    onChange(url);
  }

  return (
    <div className="flex items-center gap-5">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gold-light bg-surface-subtle"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Employee" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-gold-light" fill="currentColor">
            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9Z" />
          </svg>
        )}
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold text-text-label">{labels.title}</div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition hover:bg-gold-hover disabled:opacity-50"
        >
          {labels.upload}
        </button>
        <div className="mt-1 text-xs text-text-muted">{labels.hint}</div>
        {error ? <div className="mt-1 text-xs text-danger">{error}</div> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
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
