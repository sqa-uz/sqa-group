"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { weatherKind, type Weather } from "@/lib/weather";

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false });

function subscribe(cb: () => void) {
  const id = setInterval(cb, 10_000);
  return () => clearInterval(id);
}

const ICONS: Record<ReturnType<typeof weatherKind> | "night", string> = {
  clear: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  night: "M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a8.5 8.5 0 1 0 10.6 10.6z",
  cloud: "M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z",
  fog: "M4 10h16M3 14h18M5 18h14M7 6h10",
  rain: "M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 5.5 4.25 4.25 0 0 0 7 14zM8 17l-1 3M12 17l-1 3M16 17l-1 3",
  snow: "M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 5.5 4.25 4.25 0 0 0 7 14zM8 18h.01M12 20h.01M16 18h.01",
  storm: "M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 5.5 4.25 4.25 0 0 0 7 14zM12 15l-2 4h3l-2 4",
};

/** "Tashkent 10:28 · +19°C" — the clock ticks in the visitor's browser, the temperature comes from the server. */
export default function TashkentNow({ weather }: { weather: Weather | null }) {
  const t = useTranslations("common");
  // The server renders a placeholder; the browser fills in the real Tashkent time after hydration.
  const time = useSyncExternalStore(subscribe, () => fmt.format(new Date()), () => "--:--");
  const kind = weather ? (weather.isDay || weatherKind(weather.code) !== "clear" ? weatherKind(weather.code) : "night") : null;

  return (
    <span className="flex items-center gap-2 whitespace-nowrap" aria-label={t("weatherLabel")}>
      <span>{t("tashkent")}</span>
      <span className="tabular-nums font-semibold text-ink">{time}</span>
      {weather && kind && (
        <>
          <span aria-hidden="true">·</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS[kind]} />
          </svg>
          <span className="tabular-nums font-semibold text-ink">
            {weather.temp > 0 ? "+" : ""}
            {weather.temp}°C
          </span>
        </>
      )}
    </span>
  );
}
