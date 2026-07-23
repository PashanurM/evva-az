"use client";

import { useEffect } from "react";

/**
 * Next.js always injects <nextjs-portal> in `next dev` for the error overlay.
 * This turns off the visible DevTools indicator so it does not look like an app bug.
 */
export function SilenceNextDevtools() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    void fetch("/__nextjs_devtools_config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disableDevIndicator: true }),
      keepalive: true,
    }).catch(() => {
      // Endpoint may not exist on older Next builds — ignore.
    });
  }, []);

  return null;
}
