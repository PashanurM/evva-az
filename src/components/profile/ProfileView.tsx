"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { api, assetUrl } from "@/lib/api";
import { mapApiProperty } from "@/lib/mappers";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PropertyCard } from "@/components/home/PropertyCard";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import type { Property } from "@/types";
import "@/components/auth/auth-pages.css";

type RatingHistoryItem = {
  property_id: number;
  title: string;
  location: string;
  price: number;
  cover_url: string;
  rating: number;
  cleanliness_rating: number;
  location_rating: number;
  comfort_rating: number;
  homeowner_rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export function ProfileView() {
  const { user, loading, refresh } = useAuth();
  const { t } = useLocale();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [ratings, setRatings] = useState<RatingHistoryItem[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setRatings([]);
      return;
    }

    let active = true;
    setFavoritesLoading(true);
    setRatingsLoading(true);

    void (async () => {
      const [favRes, ratingRes] = await Promise.all([api.getFavorites(), api.getMyRatings()]);
      if (!active) return;

      if (favRes.success && favRes.data?.items) {
        setFavorites(favRes.data.items.map(mapApiProperty));
      } else {
        setFavorites([]);
      }
      setFavoritesLoading(false);

      if (ratingRes.success && ratingRes.data?.items) {
        setRatings(ratingRes.data.items);
      } else {
        setRatings([]);
      }
      setRatingsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "60px 20px" }}>
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p>{t("profile.loginRequired")}</p>
        <Link href="/login?next=/profile" className="auth-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
          {t("common.login")}
        </Link>
      </div>
    );
  }

  async function handleUsername(e: FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setSavingProfile(true);
    const res = await api.updateProfile(username.trim());
    setSavingProfile(false);
    if (!res.success) {
      setProfileErr(res.error || "Yenilənmədi");
      return;
    }
    setProfileMsg(res.data?.message || "Username yeniləndi");
    await refresh();
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setPassMsg("");
    setPassErr("");
    setSavingPass(true);
    const res = await api.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setSavingPass(false);
    if (!res.success) {
      setPassErr(res.error || "Şifrə dəyişdirilmədi");
      return;
    }
    setPassMsg(res.data?.message || "Şifrə yeniləndi");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="profile-page">
      <div className="auth-card" style={{ maxWidth: 640, margin: "0 auto" }}>
        <span className="section-kicker">{t("profile.kicker")}</span>
        <h1 style={{ marginTop: 8 }}>{user.full_name || user.username}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{user.role_text}</p>

        <dl className="place-details-list" style={{ marginTop: 24 }}>
          <div>
            <dt>{t("common.phone")}</dt>
            <dd>{user.phone || "—"}</dd>
          </div>
          <div>
            <dt>{t("common.status")}</dt>
            <dd>{user.is_approved ? t("common.approved") : t("common.pendingApproval")}</dd>
          </div>
        </dl>

        <form className="auth-form" onSubmit={handleUsername} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{t("profile.editUsername")}</h2>
          {profileErr ? <div className="alert alert-error">{profileErr}</div> : null}
          {profileMsg ? <div className="alert alert-success">{profileMsg}</div> : null}
          <div className="form-field">
            <label htmlFor="username">{t("common.username")}</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={savingProfile}>
            {savingProfile ? t("common.wait") : t("profile.saveUsername")}
          </button>
        </form>

        <form className="auth-form" onSubmit={handlePassword} style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>{t("profile.changePassword")}</h2>
          {passErr ? <div className="alert alert-error">{passErr}</div> : null}
          {passMsg ? <div className="alert alert-success">{passMsg}</div> : null}
          <div className="form-field">
            <label htmlFor="current_password">{t("profile.currentPassword")}</label>
            <PasswordInput
              id="current_password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
            />
          </div>
          <div className="form-field">
            <label htmlFor="new_password">{t("profile.newPassword")}</label>
            <PasswordInput
              id="new_password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirm_password">{t("profile.confirmPassword")}</label>
            <PasswordInput
              id="confirm_password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              showLabel={t("auth.showPassword")}
              hideLabel={t("auth.hidePassword")}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={savingPass}>
            {savingPass ? t("common.wait") : t("profile.savePassword")}
          </button>
        </form>

        {user.role_links.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
            {user.role_links.map((link) => {
              const mode = link.mode === "admin" || link.mode === "owner" ? link.mode : null;
              if (mode) {
                return (
                  <button
                    key={`${link.url}-${mode}`}
                    type="button"
                    className="auth-btn"
                    onClick={() => {
                      void (async () => {
                        const res = await api.switchMode(mode);
                        if (!res.success) return;
                        await refresh();
                        window.location.href = res.data?.redirect || link.url;
                      })();
                    }}
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <a key={link.url} href={link.url} className="auth-btn">
                  {link.label}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <section className="profile-section-block">
        <div className="profile-section-head">
          <div>
            <span className="section-kicker">{t("nav.favorites")}</span>
            <h2>{t("profile.favoritesTitle")}</h2>
            <p>{t("profile.favoritesHint")}</p>
          </div>
          <Link href="/favorites" className="auth-btn">
            {t("profile.favoritesLink")}
          </Link>
        </div>
        {favoritesLoading ? (
          <p>{t("common.loading")}</p>
        ) : favorites.length === 0 ? (
          <p className="profile-empty">{t("favorites.empty")}</p>
        ) : (
          <div className="property-grid profile-favorites-grid">
            {favorites.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavoriteChange={(favorite) => {
                  if (!favorite) {
                    setFavorites((prev) => prev.filter((item) => item.id !== property.id));
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="profile-section-block">
        <div className="profile-section-head">
          <div>
            <span className="section-kicker">{t("profile.ratingsKicker")}</span>
            <h2>{t("profile.ratingsTitle")}</h2>
            <p>{t("profile.ratingsHint")}</p>
          </div>
        </div>
        {ratingsLoading ? (
          <p>{t("common.loading")}</p>
        ) : ratings.length === 0 ? (
          <p className="profile-empty">{t("profile.ratingsEmpty")}</p>
        ) : (
          <div className="profile-rating-history">
            {ratings.map((item) => (
              <article key={`${item.property_id}-${item.updated_at}`} className="profile-rating-card">
                <Link href={`/property/${item.property_id}`} className="profile-rating-cover">
                  {item.cover_url ? (
                    <Image
                      src={assetUrl(item.cover_url)}
                      alt={item.title}
                      width={120}
                      height={90}
                      unoptimized
                    />
                  ) : (
                    <span className="profile-rating-cover-empty">
                      <Heart size={18} />
                    </span>
                  )}
                </Link>
                <div className="profile-rating-body">
                  <div className="profile-rating-topline">
                    <div>
                      <Link href={`/property/${item.property_id}`}>
                        <strong>{item.title}</strong>
                      </Link>
                      <p>{item.location}</p>
                    </div>
                    <span className="profile-rating-score">
                      <Star size={14} fill="currentColor" />
                      {Number(item.rating || 0).toFixed(1)}/10
                    </span>
                  </div>
                  <div className="owner-house-ratings">
                    <span>
                      {t("property.rateCleanliness")} {item.cleanliness_rating}
                    </span>
                    <span>
                      {t("property.rateLocation")} {item.location_rating}
                    </span>
                    <span>
                      {t("property.rateComfort")} {item.comfort_rating}
                    </span>
                    <span>
                      {t("property.rateHomeowner")} {item.homeowner_rating}
                    </span>
                  </div>
                  {item.comment ? <p className="profile-rating-comment">{item.comment}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
