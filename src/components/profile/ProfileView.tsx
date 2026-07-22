"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import "@/components/auth/auth-pages.css";

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

  useEffect(() => {
    if (user?.username) setUsername(user.username);
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
        <Link href="/login" className="auth-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
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
    setPassMsg(res.data?.message || "Şifrə dəyişdirildi");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
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
          {user.role_links.map((link) => (
            <a key={link.url} href={link.url} className="auth-btn">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
