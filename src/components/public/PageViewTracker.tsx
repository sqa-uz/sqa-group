"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Sends one anonymous page view per route change. No cookies; honours Do Not Track. */
export default function PageViewTracker() {
  const pathname = usePathname(); // includes the locale prefix, e.g. /ru/about
  const first = useRef(true);

  useEffect(() => {
    if (navigator.doNotTrack === "1") return;
    const body = JSON.stringify({ path: pathname, referrer: first.current ? document.referrer : "" });
    first.current = false;
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
