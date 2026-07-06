import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Dict = ReturnType<typeof getDictionary>;

export function label(dict: Dict, group: keyof Dict["fields"]["options"], key: string | null | undefined): string {
  if (!key) return "—";
  const opts = dict.fields.options[group] as Record<string, string>;
  return opts[key] ?? key;
}

export function natLabel(nationalities: { code: string; nameEn: string; nameAr: string }[], code: string | null, locale: Locale) {
  if (!code) return "—";
  const n = nationalities.find((x) => x.code === code);
  return n ? (locale === "ar" ? n.nameAr : n.nameEn) : code;
}

export function entityLabel(form: any, locale: Locale) {
  if (!form.entity) return "—";
  return locale === "ar" ? form.entity.nameAr : form.entity.nameEn;
}

export function entityLogo(form: any) {
  return form.entity?.logoPath ?? "/entity-logos/moca.jpg";
}
