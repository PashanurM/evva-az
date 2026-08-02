"use client";

import Link from "next/link";
import { ArrowLeft, Home, Lock, LogIn, UserPlus } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import "@/app/chat/chat-page.css";

type AuthRequiredGateProps = {
  title: string;
  description: string;
  kicker?: string;
  propertyTitle?: string;
  loginHref: string;
  registerHref?: string;
  backHref?: string;
  backLabel?: string;
};

export function AuthRequiredGate({
  title,
  description,
  kicker,
  propertyTitle,
  loginHref,
  registerHref = "/register",
  backHref = "/",
  backLabel,
}: AuthRequiredGateProps) {
  const { t } = useLocale();

  return (
    <section className="chat-page">
      <div className="chat-page-glow" aria-hidden />
      <div className="chat-panel chat-panel--gate">
        <Link href={backHref} className="chat-back-btn chat-gate-back">
          <ArrowLeft size={18} aria-hidden />
          <span>{backLabel || t("common.back")}</span>
        </Link>
        <div className="chat-gate-icon" aria-hidden>
          <Lock size={28} />
        </div>
        {kicker ? <p className="chat-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        <p className="chat-gate-copy">{description}</p>
        {propertyTitle ? (
          <div className="chat-property-chip">
            <Home size={16} aria-hidden />
            <span>{propertyTitle}</span>
          </div>
        ) : null}
        <div className="chat-alert chat-alert--login" role="status">
          <strong>{t("common.loginRequiredShort")}</strong>
          <span>{description}</span>
        </div>
        <div className="chat-gate-actions">
          <Link href={loginHref} className="chat-btn chat-btn--primary">
            <LogIn size={18} aria-hidden />
            {t("common.login")}
          </Link>
          <Link href={registerHref} className="chat-btn chat-btn--ghost">
            <UserPlus size={18} aria-hidden />
            {t("common.register")}
          </Link>
        </div>
      </div>
    </section>
  );
}
