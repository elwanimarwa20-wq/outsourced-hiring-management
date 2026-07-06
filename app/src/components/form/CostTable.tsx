"use client";

import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { formatAED } from "@/lib/format";
import {
  computeTotals,
  sectionTotal,
  num,
  type FormState,
  type MemberRow,
} from "./state";
import type { BenefitSection } from "@/generated/prisma/enums";

type Setter = (patch: Partial<FormState>) => void;

function MoneyInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      disabled={disabled}
      value={value === 0 ? "" : value}
      placeholder="0"
      onChange={(e) => onChange(num(e.target.value))}
      className="w-28 rounded-lg border border-border-btn bg-white px-2.5 py-1.5 text-right text-[13px] tabular-nums focus:border-gold-light focus:outline-none disabled:bg-surface-subtle-2 disabled:text-text-muted"
    />
  );
}

function Diff({ current, proposed, dict }: { current: number; proposed: number; dict: ReturnType<typeof getDictionary> }) {
  const d = num(proposed) - num(current);
  if (d === 0) return <span className="text-text-muted">{dict.costs.noChange}</span>;
  const color = d > 0 ? "#2F6B4F" : "#B22234";
  return (
    <span className="tabular-nums font-semibold" style={{ color }}>
      {d > 0 ? "+" : ""}
      {d.toLocaleString()}
    </span>
  );
}

export function CostTable({
  locale,
  s,
  set,
  members,
}: {
  locale: Locale;
  s: FormState;
  set: Setter;
  members: {
    add: (section: BenefitSection, type: "SPOUSE" | "CHILD") => void;
    remove: (section: BenefitSection, key: string) => void;
    update: (section: BenefitSection, key: string, patch: Partial<MemberRow>) => void;
  };
}) {
  const dict = getDictionary(locale);
  const isMarried = s.maritalStatus === "MARRIED";
  const showCurrent = !s.isNewHire;
  const totals = computeTotals(s);

  const sectionConfig: { section: BenefitSection; label: string; current: keyof FormState; proposed: keyof FormState }[] = [
    { section: "AIR_TICKET", label: dict.costs.airTicket, current: "airTicketCurrent", proposed: "airTicketProposed" },
    { section: "VISA_LABOUR", label: dict.costs.visaLabour, current: "visaLabourCurrent", proposed: "visaLabourProposed" },
    { section: "MEDICAL", label: dict.costs.medical, current: "medicalCurrent", proposed: "medicalProposed" },
  ];

  const colCount = showCurrent ? 4 : 3;

  return (
    <div className="space-y-5">
      <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm font-medium text-text-label">
        <input
          type="checkbox"
          checked={s.isNewHire}
          onChange={(e) => set({ isNewHire: e.target.checked })}
          className="h-4 w-4 accent-[var(--gold)]"
        />
        {dict.costs.isNewHire}
      </label>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-subtle-2 text-text-label-2">
              <th className="px-3 py-2.5 text-start font-semibold">{dict.costs.colItem}</th>
              {showCurrent ? <th className="px-3 py-2.5 text-end font-semibold">{dict.costs.colCurrent}</th> : null}
              <th className="px-3 py-2.5 text-end font-semibold">{dict.costs.colProposed}</th>
              {showCurrent ? <th className="px-3 py-2.5 text-end font-semibold">{dict.costs.colDifference}</th> : null}
            </tr>
          </thead>
          <tbody>
            {/* Group: salary & allowances */}
            <GroupRow colSpan={colCount} label={dict.costs.groupSalary} />
            <tr className="border-b border-border-inner">
              <td className="px-3 py-2.5 font-medium">{dict.costs.monthlySalary}</td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end">
                  <MoneyInput value={s.monthlySalaryCurrent} onChange={(v) => set({ monthlySalaryCurrent: v })} />
                </td>
              ) : null}
              <td className="px-3 py-2 text-end">
                <MoneyInput value={s.proposedMonthlySalary} onChange={(v) => set({ proposedMonthlySalary: v })} />
              </td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end">
                  <Diff current={s.monthlySalaryCurrent} proposed={s.proposedMonthlySalary} dict={dict} />
                </td>
              ) : null}
            </tr>

            {/* Group: additional benefits */}
            <GroupRow colSpan={colCount} label={dict.costs.groupBenefits} />
            {sectionConfig.map((cfg) => (
              <SectionRows
                key={cfg.section}
                cfg={cfg}
                s={s}
                set={set}
                members={members}
                dict={dict}
                showCurrent={showCurrent}
                isMarried={isMarried}
              />
            ))}

            {/* End of Service — manual */}
            <tr className="border-b border-border-inner">
              <td className="px-3 py-2.5 font-medium">{dict.costs.endOfService}</td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end">
                  <MoneyInput value={s.endOfServiceCurrent} onChange={(v) => set({ endOfServiceCurrent: v })} />
                </td>
              ) : null}
              <td className="px-3 py-2 text-end">
                <MoneyInput value={s.endOfServiceProposed} onChange={(v) => set({ endOfServiceProposed: v })} />
              </td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end"><Diff current={s.endOfServiceCurrent} proposed={s.endOfServiceProposed} dict={dict} /></td>
              ) : null}
            </tr>

            {/* Outsourcing Co. Share — manual + % selector */}
            <tr className="border-b border-border-inner">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dict.costs.outsourcingShare}</span>
                  <select
                    value={s.outsourcingSharePercent}
                    onChange={(e) => set({ outsourcingSharePercent: e.target.value as "P9" | "P18" })}
                    className="rounded-md border border-border-btn bg-white px-1.5 py-1 text-xs font-semibold focus:border-gold-light focus:outline-none"
                  >
                    <option value="P9">{dict.fields.options.outsourcingShare.P9}</option>
                    <option value="P18">{dict.fields.options.outsourcingShare.P18}</option>
                  </select>
                </div>
              </td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end">
                  <MoneyInput value={s.outsourcingShareCurrent} onChange={(v) => set({ outsourcingShareCurrent: v })} />
                </td>
              ) : null}
              <td className="px-3 py-2 text-end">
                <MoneyInput value={s.outsourcingShareProposed} onChange={(v) => set({ outsourcingShareProposed: v })} />
              </td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end"><Diff current={s.outsourcingShareCurrent} proposed={s.outsourcingShareProposed} dict={dict} /></td>
              ) : null}
            </tr>

            {/* Totals */}
            <tr className="border-t border-border bg-surface-subtle">
              <td className="px-3 py-2.5 font-semibold">{dict.costs.totalMonthly}</td>
              {showCurrent ? <td /> : null}
              <td className="px-3 py-2.5 text-end font-semibold tabular-nums">{formatAED(totals.totalMonthlyCost, locale)}</td>
              {showCurrent ? <td /> : null}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Annual Contract Cost band */}
      <div
        className="flex items-center justify-between rounded-xl px-5 py-4"
        style={{ background: "linear-gradient(90deg,#7C1733,#A6304F)" }}
      >
        <span className="text-sm font-semibold text-white">{dict.costs.annualContractCost}</span>
        <span className="text-xl font-bold tabular-nums" style={{ color: "#FFE6B0" }}>
          {formatAED(totals.annualContractCost, locale)}
        </span>
      </div>
    </div>
  );
}

function GroupRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr className="bg-gold-bg">
      <td colSpan={colSpan} className="px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-gold">
        {label}
      </td>
    </tr>
  );
}

function SectionRows({
  cfg,
  s,
  set,
  members,
  dict,
  showCurrent,
  isMarried,
}: {
  cfg: { section: BenefitSection; label: string; current: keyof FormState; proposed: keyof FormState };
  s: FormState;
  set: Setter;
  members: {
    add: (section: BenefitSection, type: "SPOUSE" | "CHILD") => void;
    remove: (section: BenefitSection, key: string) => void;
    update: (section: BenefitSection, key: string, patch: Partial<MemberRow>) => void;
  };
  dict: ReturnType<typeof getDictionary>;
  showCurrent: boolean;
  isMarried: boolean;
}) {
  const rows = s.members[cfg.section];
  const hasSpouse = rows.some((r) => r.memberType === "SPOUSE");
  const curVal = s[cfg.current] as number;
  const propVal = s[cfg.proposed] as number;

  return (
    <>
      <tr className="border-b border-border-inner">
        <td className="px-3 py-2.5 font-medium">
          {cfg.label}
          {isMarried ? <span className="ms-1 text-xs text-text-muted">· {dict.costs.employee}</span> : null}
        </td>
        {showCurrent ? (
          <td className="px-3 py-2 text-end">
            <MoneyInput value={curVal} onChange={(v) => set({ [cfg.current]: v } as Partial<FormState>)} />
          </td>
        ) : null}
        <td className="px-3 py-2 text-end">
          <MoneyInput value={propVal} onChange={(v) => set({ [cfg.proposed]: v } as Partial<FormState>)} />
        </td>
        {showCurrent ? (
          <td className="px-3 py-2 text-end"><Diff current={curVal} proposed={propVal} dict={dict} /></td>
        ) : null}
      </tr>

      {isMarried
        ? rows.map((m) => (
            <tr key={m.key} className={`border-b border-border-inner ${m.included ? "" : "opacity-40"}`}>
              <td className="ps-8 pe-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={m.included}
                    onChange={(e) => members.update(cfg.section, m.key, { included: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[var(--gold)]"
                  />
                  <span className="text-[12.5px] text-text-label-2">
                    {m.memberType === "SPOUSE" ? dict.costs.spouse : `${dict.costs.child} ${m.memberIndex}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => members.remove(cfg.section, m.key)}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-danger transition hover:bg-danger-tint"
                    title={dict.costs.remove}
                  >
                    {dict.costs.remove}
                  </button>
                </div>
              </td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end">
                  <MoneyInput value={m.current} onChange={(v) => members.update(cfg.section, m.key, { current: v })} />
                </td>
              ) : null}
              <td className="px-3 py-2 text-end">
                <MoneyInput value={m.proposed} onChange={(v) => members.update(cfg.section, m.key, { proposed: v })} />
              </td>
              {showCurrent ? (
                <td className="px-3 py-2 text-end"><Diff current={m.current} proposed={m.proposed} dict={dict} /></td>
              ) : null}
            </tr>
          ))
        : null}

      {isMarried ? (
        <tr className="border-b border-border-inner">
          <td colSpan={showCurrent ? 4 : 3} className="ps-8 pe-3 py-2">
            <div className="flex flex-wrap gap-2">
              {!hasSpouse ? (
                <button
                  type="button"
                  onClick={() => members.add(cfg.section, "SPOUSE")}
                  className="rounded-lg border border-gold bg-gold-bg px-2.5 py-1 text-xs font-semibold text-gold transition hover:bg-gold-hover-bg"
                >
                  {dict.costs.addSpouse}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => members.add(cfg.section, "CHILD")}
                className="rounded-lg border border-gold bg-gold-bg px-2.5 py-1 text-xs font-semibold text-gold transition hover:bg-gold-hover-bg"
              >
                {dict.costs.addChild}
              </button>
              <span className="ms-1 self-center text-xs text-text-muted tabular-nums">
                {dict.costs.colProposed}: {formatAED(sectionTotal(s, cfg.section, "proposed"), dict.dir === "rtl" ? "ar" : "en")}
              </span>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
