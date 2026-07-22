"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

interface RatingFormProps {
  onRated?: (rating: number) => void;
}

export function PlaceRatingForm({ onRated }: RatingFormProps) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const active = hover ?? selected;

  function handleRate(rating: number) {
    setSelected(rating);
    setHover(null);
    setSubmitted(true);
    onRated?.(rating);
  }

  if (submitted && selected !== null) {
    return (
      <div className="place-rating-card place-rating-card--done">
        <CheckCircle2 size={22} aria-hidden />
        <div>
          <strong>{selected}/10</strong>
          <p>{t("places.rateSubmitted", { rating: selected })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="place-rating-card">
      <div className="place-rating-score" aria-live="polite">
        <span className="place-rating-score-value">{active ?? "—"}</span>
        <span className="place-rating-score-meta">
          <small>/ 10</small>
          <em>{active ? `${active}/10` : t("places.ratePrompt")}</em>
        </span>
      </div>

      <div
        className="place-rating-meter"
        role="radiogroup"
        aria-label={t("places.rateAria")}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const filled = active !== null && n <= active;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected === n}
              aria-label={`${n} / 10`}
              className={`place-rating-seg${filled ? " is-filled" : ""}${selected === n ? " is-selected" : ""}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onClick={() => handleRate(n)}
            />
          );
        })}
      </div>

      <div className="place-rating-ends" aria-hidden>
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}
