"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import type { Property } from "@/types";

type CategoryKey = "cleanliness" | "location" | "comfort" | "homeowner";

const CATEGORIES: Array<{ key: CategoryKey; labelKey: string }> = [
  { key: "cleanliness", labelKey: "property.rateCleanliness" },
  { key: "location", labelKey: "property.rateLocation" },
  { key: "comfort", labelKey: "property.rateComfort" },
  { key: "homeowner", labelKey: "property.rateHomeowner" },
];

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value || 0)));
}

function averageOf(scores: Record<CategoryKey, number>): number {
  const values = CATEGORIES.map((item) => scores[item.key]);
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) / 10;
}

export function PropertyRatingSection({ property }: { property: Property }) {
  const { t } = useLocale();
  const { user } = useAuth();

  const initialScores = useMemo(() => {
    const ur = property.userRating;
    return {
      cleanliness: clampScore(ur?.cleanliness_rating || 10),
      location: clampScore(ur?.location_rating || 10),
      comfort: clampScore(ur?.comfort_rating || 10),
      homeowner: clampScore(ur?.homeowner_rating || 10),
    };
  }, [property.userRating]);

  const [scores, setScores] = useState(initialScores);
  const [comment, setComment] = useState(property.userRating?.comment || "");
  const [summary, setSummary] = useState(
    property.ratingSummary || {
      avg_rating: property.rating || 0,
      rating_count: property.ratingCount || 0,
      cleanliness_avg: 0,
      location_avg: 0,
      comfort_avg: 0,
      homeowner_avg: 0,
    },
  );
  const [reviews, setReviews] = useState(property.reviews || []);
  const [canRate, setCanRate] = useState(Boolean(property.canRate));
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(
    Boolean(property.hasConfirmedBooking),
  );
  const [hasRated, setHasRated] = useState(Boolean(property.userRating?.has_rated));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const liveAverage = averageOf(scores);

  const breakdown = [
    { label: t("property.rateCleanliness"), value: summary.cleanliness_avg || 0 },
    { label: t("property.rateLocation"), value: summary.location_avg || 0 },
    { label: t("property.rateComfort"), value: summary.comfort_avg || 0 },
    { label: t("property.rateHomeowner"), value: summary.homeowner_avg || 0 },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    const res = await api.rateProperty(property.id, {
      cleanliness_rating: scores.cleanliness,
      location_rating: scores.location,
      comfort_rating: scores.comfort,
      homeowner_rating: scores.homeowner,
      comment: comment.trim(),
    });

    setBusy(false);

    if (!res.success || !res.data) {
      setError(res.error || t("property.rateFailed"));
      return;
    }

    setSummary(res.data.rating_summary);
    setReviews(res.data.reviews || []);
    setCanRate(Boolean(res.data.can_rate));
    setHasConfirmedBooking(Boolean(res.data.has_confirmed_booking));
    setHasRated(true);
    if (res.data.user_rating) {
      setScores({
        cleanliness: clampScore(res.data.user_rating.cleanliness_rating),
        location: clampScore(res.data.user_rating.location_rating),
        comfort: clampScore(res.data.user_rating.comfort_rating),
        homeowner: clampScore(res.data.user_rating.homeowner_rating),
      });
      setComment(res.data.user_rating.comment || "");
    }
    setSuccess(t("property.rateSuccess"));
  }

  return (
    <section className="glass section-block property-rating-section">
      <div className="section-title">
        <h2>{t("property.ratingsTitle")}</h2>
        <div style={{ fontSize: 13, opacity: 0.72 }}>{t("property.ratingsSubtitle")}</div>
      </div>

      <div className="property-rating-summary">
        <div className="property-rating-overview">
          <span className="property-rating-kicker">
            <Star size={14} fill="currentColor" /> {t("property.overallScore")}
          </span>
          <strong>{Number(summary.avg_rating || 0).toFixed(1)}</strong>
          <span>
            {summary.rating_count || 0} {t("property.reviewCount")}
          </span>
        </div>
        <div className="property-rating-breakdown">
          {breakdown.map((row) => (
            <div key={row.label} className="property-rating-breakdown-row">
              <strong>{row.label}</strong>
              <div className="property-rating-track">
                <div
                  className="property-rating-fill"
                  style={{ width: `${Math.max(0, Math.min(100, row.value * 10))}%` }}
                />
              </div>
              <b>{Number(row.value || 0).toFixed(1)}/10</b>
            </div>
          ))}
        </div>
      </div>

      {!user ? (
        <p className="property-rating-note">
          {t("property.rateLoginRequired")}{" "}
          <Link href={`/login?return=/property/${property.id}`}>{t("common.login")}</Link>
        </p>
      ) : canRate ? (
        <form className="property-rating-form" onSubmit={handleSubmit}>
          <div className="property-rating-live">
            <span>{t("property.yourLiveAverage")}</span>
            <strong>{liveAverage.toFixed(1)}/10</strong>
          </div>

          <div className="property-rating-categories">
            {CATEGORIES.map((cat) => (
              <label key={cat.key} className="property-rating-category">
                <span className="property-rating-category-top">
                  <em>{t(cat.labelKey)}</em>
                  <b>{scores[cat.key]}/10</b>
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={scores[cat.key]}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [cat.key]: clampScore(Number(e.target.value)),
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <label className="property-rating-comment">
            <span>{t("property.rateComment")}</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("property.rateCommentPlaceholder")}
            />
          </label>

          {error ? <div className="alert alert-error">{error}</div> : null}
          {success ? (
            <div className="alert alert-success">
              <CheckCircle2 size={16} /> {success}
            </div>
          ) : null}

          <button type="submit" className="auth-btn primary" disabled={busy}>
            {busy
              ? t("common.wait")
              : hasRated
                ? t("property.rateUpdate")
                : t("property.rateSubmit")}
          </button>
        </form>
      ) : (
        <p className="property-rating-note">
          <Lock size={14} />{" "}
          {user && property.owner?.id && user.id === property.owner.id
            ? t("property.rateOwnerBlocked")
            : hasConfirmedBooking
              ? t("property.rateOwnerBlocked")
              : t("property.rateNeedsBooking")}
        </p>
      )}

      {reviews.length > 0 ? (
        <div className="property-reviews-list">
          <h3>{t("property.reviewsHeading")}</h3>
          {reviews.map((review, index) => (
            <article key={`${review.username}-${review.created_at}-${index}`} className="property-review-card">
              <div className="property-review-head">
                <strong>{review.full_name || review.username || t("property.guestReviewer")}</strong>
                <span>{Number(review.rating || 0).toFixed(1)}/10</span>
              </div>
              {review.comment ? <p>{review.comment}</p> : null}
              <div className="property-review-cats">
                <span>
                  {t("property.rateCleanliness")}: {review.cleanliness_rating}
                </span>
                <span>
                  {t("property.rateLocation")}: {review.location_rating}
                </span>
                <span>
                  {t("property.rateComfort")}: {review.comfort_rating}
                </span>
                <span>
                  {t("property.rateHomeowner")}: {review.homeowner_rating}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
