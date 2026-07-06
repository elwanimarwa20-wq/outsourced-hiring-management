import { cookies } from "next/headers";
import type { Locale } from "./dictionaries";

export const LOCALE_COOKIE = "osf_locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "ar" ? "ar" : "en";
}
