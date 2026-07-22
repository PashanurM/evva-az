"use client";

import { useEffect } from "react";

/**
 * Loads legacy mobile/polish helpers after React hydration so they
 * do not mutate SSR markup before the client attaches.
 */
export function ClientLegacyScripts() {
  useEffect(() => {
    if (document.querySelector('script[data-evva-legacy-scripts="1"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "/assets/mobile-premium-fix.js";
    script.defer = true;
    script.dataset.evvaLegacyScripts = "1";
    document.body.appendChild(script);
  }, []);

  return null;
}
