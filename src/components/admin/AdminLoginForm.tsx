"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, KeyRound, Lock, LogIn, ShieldCheck, User } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { useAdmin } from "@/providers/AdminProvider";
import { PasswordInput } from "@/components/auth/PasswordInput";
import "@/components/auth/auth-pages.css";

export function AdminLoginForm() {
  const { refresh } = useAdmin();
  const [mode, setMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res =
      mode === "pin"
        ? await adminApi.loginWithPin(pin.trim())
        : await adminApi.loginWithPassword(username.trim(), password);

    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || "Admin girişi uğursuz oldu.");
      return;
    }

    await refresh();
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-top">
        <Link href="/" className="admin-login-back">
          <ArrowLeft size={16} aria-hidden />
          <span>Sayta qayıt</span>
        </Link>
      </div>

      <section className="login-shell admin-login-shell">
        <div className="login-card">
          <div className="login-kicker">
            <ShieldCheck size={16} aria-hidden />
            EVVA Admin Panel
          </div>

          <div className="auth-header login-auth-header">
            <h1>Admin girişi</h1>
            <p>Yalnız admin hesabları üçün təhlükəsiz giriş.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div
              className={`login-switch login-switch--${mode === "pin" ? "phone" : "username"}`}
              role="tablist"
              aria-label="Admin giriş növü"
            >
              <span className="login-switch-indicator" aria-hidden />
              <button
                type="button"
                role="tab"
                aria-selected={mode === "pin"}
                className={mode === "pin" ? "active" : ""}
                onClick={() => setMode("pin")}
              >
                <KeyRound size={16} aria-hidden />
                PIN
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "password"}
                className={mode === "password" ? "active" : ""}
                onClick={() => setMode("password")}
              >
                <User size={16} aria-hidden />
                Username
              </button>
            </div>

            {mode === "pin" ? (
              <div className="login-mode-panel" role="tabpanel">
                <div className="form-group">
                  <label htmlFor="admin-pin">
                    <KeyRound size={14} aria-hidden />
                    Admin PIN
                  </label>
                  <PasswordInput
                    id="admin-pin"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    required
                    showLabel="PIN-i göstər"
                    hideLabel="PIN-i gizlət"
                  />
                </div>
              </div>
            ) : (
              <div className="login-mode-panel" role="tabpanel">
                <div className="form-group">
                  <label htmlFor="admin-username">
                    <User size={14} aria-hidden />
                    Username
                  </label>
                  <input
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-password">
                    <Lock size={14} aria-hidden />
                    Şifrə
                  </label>
                  <PasswordInput
                    id="admin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    showLabel="Şifrəni göstər"
                    hideLabel="Şifrəni gizlət"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              <LogIn size={16} aria-hidden />
              {loading ? "Gözlə..." : "Daxil ol"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
