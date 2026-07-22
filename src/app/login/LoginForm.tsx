"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { sanitizePhoneInput } from "@/lib/phone";
import { useAuth } from "@/providers/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"phone" | "username">("phone");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
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
      setError(res.error || "Giriş uğursuz oldu");
      return;
    }

    await refresh();
    router.push("/");
  };

  return (
    <>
      {/* <Link href="/" className="floating-back-btn premium-back-btn">
        <i className="fas fa-arrow-left" />
        <span>Geri</span>
      </Link> */}

      <section className="login-shell">
        <div className="login-card">
          <div className="login-kicker">
            <i className="fas fa-shield-heart" /> Təhlükəsiz giriş
          </div>
          <div className="auth-header" style={{ marginBottom: 20, textAlign: "left" }}>
            <h1>Daxil ol</h1>
            <p>İstifadəçi girişi üçün yalnız telefon nömrəsi və ya username istifadə et.</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className={`login-switch login-switch--${mode}`} role="tablist" aria-label="Giriş növü seçimi">
              <span className="login-switch-indicator" aria-hidden />
              <button
                type="button"
                className={mode === "phone" ? "active" : ""}
                onClick={() => setMode("phone")}
              >
                <i className="fas fa-phone" /> Telefon nömrəsi
              </button>
              <button
                type="button"
                className={mode === "username" ? "active" : ""}
                onClick={() => setMode("username")}
              >
                <i className="fas fa-at" /> Username
              </button>
            </div>

            {mode === "phone" && (
              <div className="login-mode-panel">
                <div className="form-group">
                  <label htmlFor="phone">
                    <i className="fas fa-phone" /> Telefon nömrəsi
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="phone"
                    placeholder="0554440830"
                    value={phone}
                    onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                  />
                </div>
              </div>
            )}

            {mode === "username" && (
              <div className="login-mode-panel">
                <div className="form-group">
                  <label htmlFor="username">
                    <i className="fas fa-at" /> Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    placeholder="Məs: ceka.az"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock" /> Şifrə
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              <i className="fas fa-right-to-bracket" /> {loading ? "Gözlə..." : "Daxil ol"}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: 22, textAlign: "left" }}>
            <p>
              Hesabın yoxdur? <Link href="/register">Qeydiyyatdan keç</Link>
            </p>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .login-shell {
          min-height: calc(100vh - 120px);
          display: grid;
          place-items: center;
          padding: 32px 16px;
        }
        .login-card {
          width: min(100%, 560px);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          box-shadow: var(--shadow-lg);
          padding: 30px;
        }
        .login-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(22, 163, 74, 0.1);
          color: var(--primary);
          font-weight: 800;
          margin-bottom: 14px;
        }
        .login-switch {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 5px;
          border-radius: 18px;
          gap: 4px;
          margin: 20px 0 18px;
          isolation: isolate;
        }
        .login-switch-indicator {
          position: absolute;
          top: 5px;
          bottom: 5px;
          left: 5px;
          width: calc((100% - 10px - 4px) / 2);
          border-radius: 14px;
          background: #fff;
          border: 1px solid rgba(63, 111, 82, 0.28);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 6px 18px rgba(63, 111, 82, 0.16),
            var(--shadow-sm);
          transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 0;
          pointer-events: none;
        }
        .login-switch--username .login-switch-indicator {
          transform: translateX(calc(100% + 4px));
        }
        .login-switch button {
          position: relative;
          z-index: 1;
          border: 1px solid transparent;
          background: transparent;
          min-height: 48px;
          border-radius: 14px;
          font-weight: 800;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.24s ease;
        }
        .login-switch button:hover:not(.active) {
          color: var(--text-secondary);
        }
        .login-switch button.active {
          color: var(--primary-dark);
        }
        :global(.dark) .login-switch {
          background: rgba(0, 0, 0, 0.28);
          border-color: var(--border-strong);
        }
        :global(.dark) .login-switch-indicator {
          background: linear-gradient(
            180deg,
            rgba(107, 159, 122, 0.22),
            rgba(63, 111, 82, 0.14)
          );
          border-color: rgba(107, 159, 122, 0.42);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.08) inset,
            0 8px 22px rgba(0, 0, 0, 0.38);
        }
        :global(.dark) .login-switch button:hover:not(.active) {
          color: var(--text-secondary);
        }
        :global(.dark) .login-switch button.active {
          color: var(--primary-light);
        }
      `}</style>
    </>
  );
}
