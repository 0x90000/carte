"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";

function localizedPath(pathname: string, locale: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  if (locales.includes(segments[0] as Locale)) segments.shift();
  return `/${locale}${segments.length > 0 ? `/${segments.join("/")}` : ""}`;
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const t = useTranslations("common");
  return (
    <nav aria-label={t("language")} className="flex items-center gap-1 text-xs">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={localizedPath(pathname, locale)}
          aria-current={currentLocale === locale ? "page" : undefined}
          className={`rounded-md px-2.5 py-1.5 transition-colors ${currentLocale === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          {locale === "en" ? t("english") : t("chinese")}
        </Link>
      ))}
    </nav>
  );
}
