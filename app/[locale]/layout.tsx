import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/routing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <NextIntlClientProvider locale={locale}>
      <div lang={locale}>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
