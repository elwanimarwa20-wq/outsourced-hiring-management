import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "./LanguageToggle";
import type { Locale } from "@/lib/i18n/dictionaries";

type Props = {
  locale: Locale;
  langLabel: string;
  logoSrc?: string;
  logoAlt?: string;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
};

/** Fixed top chrome: 4px maroon→gold strip, then a white bar with a back
 *  affordance, centered entity logo, and language toggle + action slot. */
export function AppHeader({
  locale,
  langLabel,
  logoSrc = "/entity-logos/moca.jpg",
  logoAlt = "Ministry of Cabinet Affairs",
  backHref,
  backLabel,
  right,
}: Props) {
  return (
    <header className="sticky top-0 z-30 no-print">
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #7C1733 0%, #9E7B2F 100%)" }}
      />
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="rounded-lg border border-border-btn bg-white px-3 py-1.5 text-sm font-semibold text-text-label transition hover:bg-gold-hover-bg"
              >
                {locale === "ar" ? "→" : "←"} {backLabel}
              </Link>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-center">
            <Image src={logoSrc} alt={logoAlt} width={140} height={76} className="h-[68px] w-auto object-contain" priority />
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {right}
            <LanguageToggle locale={locale} label={langLabel} />
          </div>
        </div>
      </div>
    </header>
  );
}
