import type { Locale } from "@/i18n/routing";

export function localePath(locale: Locale | string, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
}
