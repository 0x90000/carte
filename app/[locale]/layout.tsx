import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
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
        <div className="border-b border-border/60 bg-background px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl justify-end"><LanguageSwitcher /></div>
        </div>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
