"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AtSign, Lock, LogIn, Phone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { sanitizePhoneInput } from "@/lib/phone";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { PasswordInput } from "@/components/auth/PasswordInput";
import "./auth-pages.css";

export function AuthLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState<"phone" | "username">("phone");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice] = useState(() =>
    searchParams.get("reset") === "1" ? t("auth.forgotSuccess") : "",
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await api.login({
      login_mode: mode,
      phone,
      username,
      password,
    });

    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || t("auth.loginFailed"));
      return;
    }

    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* <Link href="/" className="floating-back-btn premium-back-btn">
        <ArrowLeft size={16} aria-hidden />
        <span>Geri</span>
      </Link> */}

      <section className="login-shell">
        <div className="login-card">
          <div className="login-kicker">
            <ShieldCheck size={16} aria-hidden />
            {t("auth.secureLogin")}
          </div>

          <div className="auth-header login-auth-header">
            <h1>{t("auth.loginTitle")}</h1>
            <p>{t("auth.loginSubtitle")}</p>
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
            <div
              className={`login-switch login-switch--${mode}`}
              role="tablist"
              aria-label={t("auth.loginTabList")}
            >
              <span className="login-switch-indicator" aria-hidden />
              <button
                type="button"
                role="tab"
                aria-selected={mode === "phone"}
                className={mode === "phone" ? "active" : ""}
                onClick={() => setMode("phone")}
              >
                <Phone size={16} aria-hidden />
                {t("auth.loginTabPhone")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "username"}
                className={mode === "username" ? "active" : ""}
                onClick={() => setMode("username")}
              >
                <AtSign size={16} aria-hidden />
                {t("common.username")}
              </button>
            </div>

            {mode === "phone" && (
              <div className="login-mode-panel" role="tabpanel">
                <div className="form-group">
                  <label htmlFor="phone">
                    <Phone size={14} aria-hidden />
                    {t("common.phone")}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    pattern="[0-9]*"
                    placeholder="0554440830"
                    value={phone}
                    onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                  />
                  <div className="login-hint">{t("auth.phoneHint")}</div>
                </div>
              </div>
            )}

            {mode === "username" && (
              <div className="login-mode-panel" role="tabpanel">
                <div className="form-group">
                  <label htmlFor="username">
                    <AtSign size={14} aria-hidden />
                    {t("common.username")}
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder={t("auth.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                  <div className="login-hint">{t("auth.usernameHint")}</div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={14} aria-hidden />
                {t("common.password")}
              </label>
              <PasswordInput
                id="password"
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              <LogIn size={16} aria-hidden />
              {loading ? t("common.wait") : t("auth.loginTitle")}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t("auth.noAccount")}{" "}
              <Link href="/register">{t("auth.registerLink")}</Link>
            </p>
            <p>
              <Link href="/forgot-password">{t("auth.forgotPassword")}</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
