"use client";

import { useState } from "react";

export default function AppealTemplate({
  body,
  copyLabel,
  copiedLabel,
}: {
  body: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="card overflow-hidden">
      <pre className="whitespace-pre-wrap bg-band p-6 font-sans text-sm leading-relaxed text-ink">{body}</pre>
      <div className="flex justify-end border-t border-line bg-paper px-4 py-3">
        <button
          onClick={copy}
          className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-bright"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
