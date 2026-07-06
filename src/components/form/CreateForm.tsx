"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { LanguageToggle } from "@/components/LanguageToggle";
import { saveForm } from "@/lib/forms/actions";
import { type Role } from "@/lib/rbac";
import {
  emptyState,
  toInput,
  type FormState,
  type MemberRow,
} from "./state";
import { PhotoUpload } from "./PhotoUpload";
import { AttachmentsCard } from "./AttachmentsCard";
import { CostTable } from "./CostTable";
import type { BenefitSection, AttachmentSlot } from "@/generated/prisma/enums";

type EntityRef = { id: string; code: string; nameEn: string; nameAr: string; logoPath: string };
type NatRef = { code: string; nameEn: string; nameAr: string };

export function CreateForm({
  locale,
  entities,
  nationalities,
  initial,
}: {
  locale: Locale;
  role: Role;
  entities: EntityRef[];
  nationalities: NatRef[];
  initial: FormState | null;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [s, setS] = useState<FormState>(initial ?? emptyState());
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<FormState>) => {
    setS((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === s.entityId) ?? entities[0],
    [entities, s.entityId],
  );
  const logoSrc = selectedEntity?.logoPath ?? "/entity-logos/moca.jpg";

  // --- member (spouse/child) mutators ---
  const memberHandlers = {
    add: (section: BenefitSection, type: "SPOUSE" | "CHILD") => {
      setS((prev) => {
        const rows = prev.members[section];
        const nextIndex = type === "CHILD" ? rows.filter((r) => r.memberType === "CHILD").length + 1 : 0;
        const row: MemberRow = {
          key: `${section}-${type}-${Date.now()}`,
          memberType: type,
          memberIndex: nextIndex,
          current: 0,
          proposed: 0,
          included: true,
        };
        return { ...prev, members: { ...prev.members, [section]: [...rows, row] } };
      });
      setSaved(false);
    },
    remove: (section: BenefitSection, key: string) => {
      setS((prev) => ({
        ...prev,
        members: { ...prev.members, [section]: prev.members[section].filter((r) => r.key !== key) },
      }));
      setSaved(false);
    },
    update: (section: BenefitSection, key: string, patch: Partial<MemberRow>) => {
      setS((prev) => ({
        ...prev,
        members: {
          ...prev.members,
          [section]: prev.members[section].map((r) => (r.key === key ? { ...r, ...patch } : r)),
        },
      }));
      setSaved(false);
    },
  };

  async function persist(): Promise<string | null> {
    setSaving(true);
    setError("");
    const res = await saveForm(toInput(s));
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return null;
    }
    setSaved(true);
    if (!s.id) {
      setS((prev) => ({ ...prev, id: res.id }));
      // Reflect the new id in the URL without a full reload.
      window.history.replaceState(null, "", `/forms/${res.id}`);
    }
    return res.id;
  }

  async function onSaveDraft() {
    await persist();
  }

  async function onPreview() {
    const id = await persist();
    if (id) router.push(`/forms/${id}/preview`);
  }

  const inputCls =
    "w-full rounded-lg border border-border-btn bg-white px-3 py-2 text-[13.5px] text-text-body focus:border-gold-light focus:outline-none";
  const labelCls = "mb-1 block text-[11.5px] font-semibold text-text-label-2";

  const tabs = [dict.tabs.personal, dict.tabs.employment, dict.tabs.costs];

  return (
    <>
      {/* Header with entity logo selector */}
      <header className="sticky top-0 z-30 no-print">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#7C1733,#9E7B2F)" }} />
        <div className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
            <div className="flex-1">
              <Link href="/" className="rounded-lg border border-border-btn bg-white px-3 py-1.5 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg">
                {locale === "ar" ? "→" : "←"} {dict.common.back}
              </Link>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <Image src={logoSrc} alt="Entity" width={130} height={60} className="h-[56px] w-auto object-contain" />
              <select
                value={s.entityId}
                onChange={(e) => set({ entityId: e.target.value })}
                className="rounded-md border border-border-btn bg-white px-2 py-0.5 text-[11px] font-semibold focus:border-gold-light focus:outline-none"
              >
                <option value="">{dict.fields.entity}…</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>{locale === "ar" ? e.nameAr : e.nameEn}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              {saved ? <span className="text-xs font-semibold text-success">{dict.common.savedIndicator}</span> : null}
              <LanguageToggle locale={locale} label={dict.common.language} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === i ? "bg-gold text-white" : "border border-border-btn bg-white text-text-label hover:bg-gold-hover-bg"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${tab === i ? "bg-white/25" : "bg-surface-subtle-2"}`}>{i + 1}</span>
              {t}
            </button>
          ))}
        </div>

        {error ? <div className="mb-4 rounded-lg border border-danger bg-danger-tint px-4 py-2.5 text-sm text-danger-dark">{error}</div> : null}

        {/* Tab 1 */}
        {tab === 0 ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="mb-4 text-[14.5px] font-bold text-text-primary">{dict.tabs.personal}</h3>
              <div className="mb-6">
                <PhotoUpload
                  photoUrl={s.photoUrl}
                  onChange={(url) => set({ photoUrl: url })}
                  labels={{ title: dict.fields.employeePhoto, upload: dict.fields.uploadPhoto, hint: dict.fields.photoHint }}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{dict.fields.employeeName} <span className="text-danger">*</span></label>
                  <input className={inputCls} value={s.employeeName} onChange={(e) => set({ employeeName: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.maritalStatus}</label>
                  <select className={inputCls} value={s.maritalStatus} onChange={(e) => set({ maritalStatus: e.target.value as FormState["maritalStatus"] })}>
                    {(Object.keys(dict.fields.options.maritalStatus) as (keyof typeof dict.fields.options.maritalStatus)[]).map((k) => (
                      <option key={k} value={k}>{dict.fields.options.maritalStatus[k]}</option>
                    ))}
                  </select>
                </div>
                {s.maritalStatus === "MARRIED" ? (
                  <div>
                    <label className={labelCls}>{dict.fields.numberOfChildren}</label>
                    <input type="number" min={0} className={inputCls} value={s.numberOfChildren || ""} onChange={(e) => set({ numberOfChildren: Number(e.target.value) })} />
                  </div>
                ) : null}
                <div>
                  <label className={labelCls}>{dict.fields.nationality}</label>
                  <select className={inputCls} value={s.nationalityCode} onChange={(e) => set({ nationalityCode: e.target.value })}>
                    <option value="">—</option>
                    {nationalities.map((n) => <option key={n.code} value={n.code}>{locale === "ar" ? n.nameAr : n.nameEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.academicQualification}</label>
                  <select className={inputCls} value={s.academicQualification} onChange={(e) => set({ academicQualification: e.target.value as FormState["academicQualification"] })}>
                    <option value="">—</option>
                    {(Object.keys(dict.fields.options.academicQualification) as (keyof typeof dict.fields.options.academicQualification)[]).map((k) => (
                      <option key={k} value={k}>{dict.fields.options.academicQualification[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.yearsOfExperience}</label>
                  <select className={inputCls} value={s.yearsOfExperience} onChange={(e) => set({ yearsOfExperience: e.target.value as FormState["yearsOfExperience"] })}>
                    <option value="">—</option>
                    {(Object.keys(dict.fields.options.yearsOfExperience) as (keyof typeof dict.fields.options.yearsOfExperience)[]).map((k) => (
                      <option key={k} value={k}>{dict.fields.options.yearsOfExperience[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.sectorDepartment}</label>
                  <input className={inputCls} value={s.sectorDepartment} onChange={(e) => set({ sectorDepartment: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.assessmentResult}</label>
                  <select className={inputCls} value={s.assessmentResult} onChange={(e) => set({ assessmentResult: e.target.value as FormState["assessmentResult"] })}>
                    <option value="">—</option>
                    {(Object.keys(dict.fields.options.assessmentResult) as (keyof typeof dict.fields.options.assessmentResult)[]).map((k) => (
                      <option key={k} value={k}>{dict.fields.options.assessmentResult[k]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.currentWorkLocation}</label>
                  <input className={inputCls} value={s.currentWorkLocation} onChange={(e) => set({ currentWorkLocation: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>{dict.fields.securityClearance}</label>
                  <select className={inputCls} value={s.securityClearance} onChange={(e) => set({ securityClearance: e.target.value as FormState["securityClearance"] })}>
                    <option value="">—</option>
                    {(Object.keys(dict.fields.options.securityClearance) as (keyof typeof dict.fields.options.securityClearance)[]).map((k) => (
                      <option key={k} value={k}>{dict.fields.options.securityClearance[k]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <AttachmentsCard
              formId={s.id}
              attachments={s.attachments}
              onChange={(slot, info) => setS((prev) => ({ ...prev, attachments: { ...prev.attachments, [slot]: info } }))}
              labels={{
                title: dict.attachments.title,
                attach: dict.attachments.attach,
                replace: dict.attachments.replace,
                remove: dict.attachments.remove,
                saveFirst: locale === "ar" ? "احفظ النموذج كمسودة أولاً لتفعيل إرفاق الملفات." : "Save the form as a draft first to enable attachments.",
                slots: {
                  CV: dict.attachments.CV,
                  QUOTATION: dict.attachments.QUOTATION,
                  PASSPORT: dict.attachments.PASSPORT,
                  EMPLOYEE_ID: dict.attachments.EMPLOYEE_ID,
                } as Record<AttachmentSlot, string>,
              }}
            />
          </div>
        ) : null}

        {/* Tab 2 */}
        {tab === 1 ? (
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-[14.5px] font-bold text-text-primary">{dict.tabs.employment}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{dict.fields.proposedJobTitle} <span className="text-danger">*</span></label>
                <input className={inputCls} value={s.proposedJobTitle} onChange={(e) => set({ proposedJobTitle: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>{dict.fields.entity}</label>
                <select className={inputCls} value={s.entityId} onChange={(e) => set({ entityId: e.target.value })}>
                  <option value="">—</option>
                  {entities.map((e) => <option key={e.id} value={e.id}>{locale === "ar" ? e.nameAr : e.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{dict.fields.sectorDepartment}</label>
                <input className={inputCls} value={s.sectorDepartment} onChange={(e) => set({ sectorDepartment: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>{dict.fields.directManager}</label>
                <input className={inputCls} value={s.directManager} onChange={(e) => set({ directManager: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>{dict.fields.contractType}</label>
                <select className={inputCls} value={s.contractType} onChange={(e) => set({ contractType: e.target.value as FormState["contractType"] })}>
                  <option value="">—</option>
                  {(Object.keys(dict.fields.options.contractType) as (keyof typeof dict.fields.options.contractType)[]).map((k) => (
                    <option key={k} value={k}>{dict.fields.options.contractType[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{dict.fields.contractDuration}</label>
                <select className={inputCls} value={s.contractDuration} onChange={(e) => set({ contractDuration: e.target.value as FormState["contractDuration"] })}>
                  <option value="">—</option>
                  {(Object.keys(dict.fields.options.contractDuration) as (keyof typeof dict.fields.options.contractDuration)[]).map((k) => (
                    <option key={k} value={k}>{dict.fields.options.contractDuration[k]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab 3 */}
        {tab === 2 ? (
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="mb-4 text-[14.5px] font-bold text-text-primary">{dict.tabs.costs}</h3>
            <CostTable locale={locale} s={s} set={set} members={memberHandlers} />
          </div>
        ) : null}

        {/* Navigation buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {tab > 0 ? (
              <button type="button" onClick={() => setTab(tab - 1)} className="rounded-lg border border-border-btn bg-white px-4 py-2.5 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg">
                {locale === "ar" ? "→" : "←"} {dict.common.previous}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={saving} onClick={onSaveDraft} className="rounded-lg border border-gold bg-gold-bg px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold-hover-bg disabled:opacity-50">
              💾 {dict.common.saveDraft}
            </button>
            {tab < 2 ? (
              <button type="button" onClick={() => setTab(tab + 1)} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gold-hover">
                {dict.common.next} {locale === "ar" ? "←" : "→"}
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={onPreview} className="rounded-lg bg-maroon px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50" style={{ boxShadow: "0 2px 8px rgba(124,23,51,.25)" }}>
                📄 {dict.common.previewDocument} {locale === "ar" ? "←" : "→"}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
