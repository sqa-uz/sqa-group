import { defineRouting } from "next-intl/routing";

export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "uz",
  localePrefix: "always",
  // Always open the Uzbek version first; don't switch by browser language or a remembered choice.
  localeDetection: false,
});
