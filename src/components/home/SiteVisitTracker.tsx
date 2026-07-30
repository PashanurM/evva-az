"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

const VISIT_KEY = "evva_site_visit_day";

/** Counts one homepage visit per browser/day for admin analytics. */
export function SiteVisitTracker() {
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(VISIT_KEY) === today) return;
      localStorage.setItem(VISIT_KEY, today);
      void api.trackSiteVisit();
    } catch {
      // ignore storage / network failures
    }
  }, []);

  return null;
}
