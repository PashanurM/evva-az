"use client";

import type { PublicOwnerProfile } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

type Stats = PublicOwnerProfile["stats"];

function formatPercent(value?: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${Math.round(value * 100)}%`;
}

export function OwnerPublicStats({ stats }: { stats: Stats }) {
  const { t } = useLocale();
  const responseRate = formatPercent(stats.response_rate);
  const approvalRate = formatPercent(stats.approval_rate);
  const avgHours =
    stats.avg_response_hours != null && Number.isFinite(stats.avg_response_hours)
      ? t("owner.statsAvgHoursValue", { hours: stats.avg_response_hours })
      : null;

  if (!responseRate && !approvalRate && !avgHours) return null;

  return (
    <div className="owner-profile-stats owner-profile-stats--extra">
      {responseRate ? (
        <div className="owner-profile-stat">
          <strong>{responseRate}</strong>
          <span>{t("owner.statsResponseRate")}</span>
        </div>
      ) : null}
      {avgHours ? (
        <div className="owner-profile-stat">
          <strong>{avgHours}</strong>
          <span>{t("owner.statsAvgResponse")}</span>
        </div>
      ) : null}
      {approvalRate ? (
        <div className="owner-profile-stat">
          <strong>{approvalRate}</strong>
          <span>{t("owner.statsApprovalRate")}</span>
        </div>
      ) : null}
    </div>
  );
}
