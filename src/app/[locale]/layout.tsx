import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import PageViewTracker from "@/components/public/PageViewTracker";
import { getDisabledPageKeys } from "@/lib/pageSettings";
import { PAGES } from "@/lib/pages";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { getTashkentWeather } from "@/lib/weather";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-golos",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: {
      default: "SQA Group — Standart and Quality Assessment Group",
      template: "%s · SQA Group",
    },
    description: t("heroText"),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [disabledKeys, weather] = await Promise.all([getDisabledPageKeys(), getTashkentWeather()]);
  const disabled = new Set(disabledKeys);
  const hiddenHrefs = PAGES.filter((p) => disabled.has(p.key)).map((p) => p.href);

  return (
    // The theme script sets data-theme on <html> before hydration.
    <html lang={locale} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${golos.variable} font-sans`}>
        <NextIntlClientProvider>
          <Header hiddenHrefs={hiddenHrefs} weather={weather} />
          <main>{children}</main>
          <Footer hiddenHrefs={hiddenHrefs} />
          <PageViewTracker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
