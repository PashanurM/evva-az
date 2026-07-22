"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { sanitizePhoneInput } from "@/lib/phone";
import { useLocale } from "@/providers/LocaleProvider";

export function AuthRegisterForm() {
  const { t } = useLocale();
  const [form, setForm] = useState({
    phone: "",
    full_name: "",
    username: "",
    website: "",
  });
  const [error, setError] = useState("");
  const [errorTone, setErrorTone] = useState<"warning" | "error">("warning");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const fields = [
    ["full_name", t("common.fullName"), "text", t("auth.fullNameHint"), "name"],
    ["phone", t("common.phone"), "tel", t("auth.registerPhoneHint"), "tel"],
    ["username", t("common.username"), "text", t("auth.registerUsernameHint"), "username"],
  ] as const;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setErrorTone("warning");
    setNotice("");

    if ([form.full_name, form.phone, form.username].some((value) => value.trim() === "")) {
      setError(t("auth.allFieldsRequired"));
      return;
    }
    if (!/^[a-z0-9._-]{3,50}$/i.test(form.username)) {
      setError(t("auth.usernameInvalid"));
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(form);

      if (!res.success) {
        const status = res.status || 0;
        setErrorTone([400, 409, 422, 429].includes(status) ? "warning" : "error");
        setError(res.error || t("auth.registerFailed"));
        return;
      }

      setNotice(res.data?.message || t("auth.registerSuccess"));
      setForm({ full_name: "", phone: "", username: "", website: "" });
    } catch {
      setErrorTone("error");
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="section-kicker">{t("auth.registerKicker")}</span>
        <h1>{t("auth.registerTitle")}</h1>
        <p>{t("auth.registerSubtitle")}</p>

        <form className="auth-form" onSubmit={submit} noValidate>
          {fields.map(([key, label, type, hint, autoComplete]) => (
            <div className="form-field" key={key}>
              <label htmlFor={key}>{label}</label>
              <input
                id={key}
                type={type}
                inputMode={key === "phone" ? "numeric" : undefined}
                pattern={key === "phone" ? "[0-9]*" : key === "username" ? "[A-Za-z0-9._-]{3,50}" : undefined}
                required
                minLength={key === "username" ? 3 : undefined}
                maxLength={key === "username" ? 50 : key === "phone" ? 20 : undefined}
                autoComplete={autoComplete}
                aria-describedby={`${key}-hint`}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [key]: key === "phone" ? sanitizePhoneInput(e.target.value) : e.target.value,
                  }))
                }
              />
              <small className="form-field-hint" id={`${key}-hint`}>{hint}</small>
            </div>
          ))}

          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            />
          </div>

          {notice && <div className="auth-notice auth-notice-success" role="status">{notice}</div>}
          {error && <div className={`auth-notice auth-notice-${errorTone}`} role="alert">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t("common.wait") : t("auth.registerSubmit")}
          </button>
        </form>

        <div className="auth-links">
          {t("auth.hasAccount")} <Link href="/login">{t("auth.loginTitle")}</Link>
        </div>
      </div>
    </div>
  );
}
