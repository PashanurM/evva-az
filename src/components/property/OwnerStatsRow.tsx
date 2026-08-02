"use client";

import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

function formatPercent(value?: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${Math.round(value * 100)}%`;
}

export function OwnerStatsRow({ owner }: { owner: NonNullable<Property["owner"]> }) {
  const { t } = useLocale();
  const responseRate = formatPercent(owner.responseRate);
  const approvalRate = formatPercent(owner.approvalRate);
  const avgHours =
    owner.avgResponseHours != null && Number.isFinite(owner.avgResponseHours)
      ? t("owner.statsAvgHoursValue", { hours: owner.avgResponseHours })
      : null;

  if (!responseRate && !approvalRate && !avgHours) return null;

  return (
    <div className="property-owner-stats">
      {responseRate ? (
        <span className="property-owner-stat">
          <strong>{responseRate}</strong>
          <small>{t("owner.statsResponseRate")}</small>
        </span>
      ) : null}
      {avgHours ? (
        <span className="property-owner-stat">
          <strong>{avgHours}</strong>
          <small>{t("owner.statsAvgResponse")}</small>
        </span>
      ) : null}
      {approvalRate ? (
        <span className="property-owner-stat">
          <strong>{approvalRate}</strong>
          <small>{t("owner.statsApprovalRate")}</small>
        </span>
      ) : null}
    </div>
  );
}
