"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useLocale } from "@/providers/LocaleProvider";
import "./auth-pages.css";

export function AuthForgotPasswordForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (newPassword.length < 6) {
      setLoading(false);
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    const res = await api.forgotPassword({
      identifier: identifier.trim(),
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || t("auth.forgotFailed"));
      return;
    }

    // Prefer backend message when present; never keep legacy admin-queue text.
    const rawMessage = res.data?.message || t("auth.forgotSuccess");
    const message = /admin/i.test(rawMessage) ? t("auth.forgotSuccess") : rawMessage;
    setNotice(message);
    setNewPassword("");
    setConfirmPassword("");

    window.setTimeout(() => {
      router.push(`/login?reset=1`);
      router.refresh();
    }, 1200);
  }

  return (
    <>
      <section className="login-shell">
        <div className="login-card">
          <div className="auth-header login-auth-header">
            <h1>{t("auth.forgotTitle")}</h1>
            <p>{t("auth.forgotSubtitle")}</p>
          </div>

          {notice && (
            <div className="alert alert-success" role="status">
              {notice}
            </div>
          )}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <label htmlFor="identifier">{t("auth.forgotIdentifier")}</label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("auth.forgotIdentifier")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password">{t("auth.forgotNewPassword")}</label>
              <PasswordInput
                id="new_password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("auth.forgotNewPassword")}
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">{t("auth.forgotConfirmPassword")}</label>
              <PasswordInput
                id="confirm_password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth.forgotConfirmPassword")}
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              <KeyRound size={16} aria-hidden />
              {loading ? t("common.wait") : t("auth.forgotSubmit")}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link href="/login">{t("auth.forgotBackLogin")}</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
