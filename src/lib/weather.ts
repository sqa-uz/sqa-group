export type Weather = { temp: number; code: number; isDay: boolean };

/** Current weather in Tashkent from Open-Meteo (free, no key); cached for 15 minutes, null on any failure. */
export async function getTashkentWeather(): Promise<Weather | null> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=41.2995&longitude=69.2401&current=temperature_2m,weather_code,is_day&timezone=Asia%2FTashkent",
      { next: { revalidate: 900 }, signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number; is_day?: number } };
    const c = data.current;
    if (typeof c?.temperature_2m !== "number") return null;
    return { temp: Math.round(c.temperature_2m), code: c.weather_code ?? 0, isDay: c.is_day !== 0 };
  } catch {
    return null;
  }
}

/** WMO weather code -> one of a few icon kinds. */
export function weatherKind(code: number): "clear" | "cloud" | "fog" | "rain" | "snow" | "storm" {
  if (code <= 1) return "clear";
  if (code <= 3) return "cloud";
  if (code <= 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "rain";
}
