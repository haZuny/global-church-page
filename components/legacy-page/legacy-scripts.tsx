"use client";

import Script from "next/script";

export function LegacyScripts() {
  return <Script src="/legacy-script.js" strategy="afterInteractive" />;
}
