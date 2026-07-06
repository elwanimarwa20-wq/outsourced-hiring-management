"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { formatAED, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { canCreateForm, type Role } from "@/lib/rbac";
import type { FormListItem } from "@/lib/forms/types";
import type { FormStatus } from "@/generated/prisma/enums";

type Ref = { code: string; nameEn: string; nameAr: string };

export function DashboardClient({
  locale,
  role,
  forms,
  nationalities,
}: {
  locale: Locale;
  role: Role;
  forms: FormListItem[];
  entities: { id: string; code: string; nameEn: string; nameAr: string }[];
  nationalities: Ref[];
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const natLabel = (code: string | null) => {
    if (!code) return "—";
    const n = nationalities.find((x) => x.code === code);
    return n ? (locale === "ar" ? n.nameAr : n.nameEn) : code;
  };

  const [f, setF] = useState({
    name: "",
    status: "" as "" | FormStatus,
    manager: "",
    created: "",
    updated: "",
    nationality: "",
    contractType: "" as "" | "OUTSOURCED" | "SERVICE_CONTRACT",
  });

  const managers = useMemo(
    () => Array.from(new Set(forms.map((x) => x.createdByName).filter(Boolean))) as string[],
    [forms],
  );

  const filtered = useMemo(() => {
    return forms.filter((x) => {
      if (f.name && !x.employeeName.toLowerCase().includes(f.name.toLowerCase())) return false;
      if (f.status && x.status !== f.status) return false;
      if (f.manager && x.createdByName !== f.manager) return false;
      if (f.nationality && x.nationalityCode !== f.nationality) return false;
      if (f.contractType && x.contractType !== f.contractType) return false;
      if (f.created && !x.createdAt.startsWith(f.created)) return false;
      if (f.updated && !x.updatedAt.startsWith(f.updated)) return false;
      return true;
    });
  }, [forms, f]);

  const kpis = useMemo(() => {
    const total = forms.length;
    const completed = forms.filter((x) => x.status === "COMPLETED").length;
    const draft = forms.filter((x) => x.status === "DRAFT").length;
    return { total, completed, draft };
  }, [forms]);

  const inputCls =
    "w-full rounded-lg border border-border-btn bg-white px-3 py-2 text-sm text-text-body focus:border-gold-light focus:outline-none";
  const labelCls = "mb-1 block text-[11.5px] font-semibold text-text-label-2";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      {/* Title row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[21px] font-bold text-text-primary">{dict.dashboard.title}</h1>
        {canCreateForm(role) ? (
          <Link
            href="/forms/new"
            className="rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-hover"
            style={{ boxShadow: "0 2px 8px rgba(158,123,47,.25)" }}
          >
            {dict.common.newHiringForm}
          </Link>
        ) : null}
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: dict.dashboard.kpiTotal, value: kpis.total },
          { label: dict.dashboard.kpiCompleted, value: kpis.completed },
          { label: dict.dashboard.kpiDraft, value: kpis.draft },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-white p-5">
            <div className="text-[12px] font-medium text-text-muted">{k.label}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-text-primary">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-border bg-surface-subtle p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>{dict.dashboard.filters.employeeName}</label>
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{dict.dashboard.filters.status}</label>
            <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as "" | FormStatus })}>
              <option value="">—</option>
              {(Object.keys(dict.status) as FormStatus[]).map((s) => (
                <option key={s} value={s}>{dict.status[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{dict.dashboard.filters.hiringManager}</label>
            <select className={inputCls} value={f.manager} onChange={(e) => setF({ ...f, manager: e.target.value })}>
              <option value="">—</option>
              {managers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{dict.dashboard.filters.nationality}</label>
            <select className={inputCls} value={f.nationality} onChange={(e) => setF({ ...f, nationality: e.target.value })}>
              <option value="">—</option>
              {nationalities.map((n) => (
                <option key={n.code} value={n.code}>{locale === "ar" ? n.nameAr : n.nameEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{dict.dashboard.filters.contractType}</label>
            <select className={inputCls} value={f.contractType} onChange={(e) => setF({ ...f, contractType: e.target.value as typeof f.contractType })}>
              <option value="">—</option>
              <option value="OUTSOURCED">{dict.fields.options.contractType.OUTSOURCED}</option>
              <option value="SERVICE_CONTRACT">{dict.fields.options.contractType.SERVICE_CONTRACT}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{dict.dashboard.filters.creationDate}</label>
            <input type="date" className={inputCls} value={f.created} onChange={(e) => setF({ ...f, created: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{dict.dashboard.filters.lastUpdated}</label>
            <input type="date" className={inputCls} value={f.updated} onChange={(e) => setF({ ...f, updated: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setF({ name: "", status: "", manager: "", created: "", updated: "", nationality: "", contractType: "" })}
              className="rounded-lg border border-border-btn bg-white px-3 py-2 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg"
            >
              {dict.dashboard.filters.clear}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[1100px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-subtle-2 text-text-label-2">
              {[
                dict.dashboard.columns.formId,
                dict.dashboard.columns.employeeName,
                dict.dashboard.columns.position,
                dict.dashboard.columns.nationality,
                dict.dashboard.columns.proposedMonthly,
                dict.dashboard.columns.annualSalary,
                dict.dashboard.columns.status,
                dict.dashboard.columns.createdBy,
                dict.dashboard.columns.createdDate,
                dict.dashboard.columns.lastUpdated,
                dict.dashboard.columns.actions,
              ].map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2.5 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-text-muted">{dict.dashboard.empty}</td>
              </tr>
            ) : (
              filtered.map((x) => (
                <tr
                  key={x.id}
                  className="cursor-pointer border-b border-border-inner transition hover:bg-surface-subtle"
                  onClick={() => router.push(`/forms/${x.id}`)}
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12px] font-semibold text-maroon">{x.formCode}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">{x.employeeName}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{x.proposedJobTitle}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{natLabel(x.nationalityCode)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatAED(x.proposedMonthlySalary, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatAED(x.annualSalary, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5"><StatusPill status={x.status} label={dict.status[x.status]} /></td>
                  <td className="whitespace-nowrap px-3 py-2.5">{x.createdByName ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-text-label-2">{formatDate(x.createdAt, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-text-label-2">{formatDate(x.updatedAt, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/forms/${x.id}`}
                      className="rounded-full border border-gold bg-gold-bg px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold-hover-bg"
                    >
                      {dict.common.open}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
