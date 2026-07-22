"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bike,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export function Footer() {
  const { t } = useLocale();

  const exploreLinks = [
    { href: "/?tags=Hovuzlu", label: t("footer.poolHomes"), icon: Home },
    { href: "/?search=A-frame", label: t("footer.aframeHomes"), icon: Home },
    { href: "/?location=Vəndam", label: t("footer.vendamHomes"), icon: MapPin },
    { href: "/places", label: t("nav.places"), icon: MapPin },
    { href: "/restaurants", label: t("nav.restaurants"), icon: UtensilsCrossed },
    { href: "/delivery", label: t("nav.delivery"), icon: Bike },
  ];

  const footerKeywordKeys = [
    "footer.keyword1",
    "footer.keyword2",
    "footer.keyword3",
    "footer.keyword4",
    "footer.keyword5",
  ] as const;

  return (
    <footer className="site-footer">
      <div className="site-footer-wave" aria-hidden />

      <div className="site-footer-main">
        <div className="container site-footer-main-inner">
          <div className="site-footer-brand-block">
          <Link href="/" className="site-footer-brand">
            <Image
              className="site-footer-mark"
              src="/assets/evva-logo-mark.png"
              alt="EVVA.AZ"
              width={56}
              height={56}
              unoptimized
            />
            <div>
              <strong>EVVA.AZ</strong>
              <span>{t("footer.tagline")}</span>
            </div>
          </Link>
          <p className="site-footer-about">{t("footer.about")}</p>
          <a
            className="site-footer-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            href="https://wa.me/994554440830?text=Salam%2C+EVVA.AZ+haqq%C4%B1nda+m%C9%99lumat+almaq+ist%C9%99yir%C9%99m."
          >
            {t("footer.whatsapp")}
          </a>
        </div>

        <div className="site-footer-columns">
          <div className="site-footer-col">
            <h4>{t("footer.explore")}</h4>
            <ul>
              {exploreLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href}>
                    <Icon size={14} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>{t("footer.platform")}</h4>
            <ul>
              <li>
                <Link href="/#properties">{t("common.browseHomes")}</Link>
              </li>
              <li>
                <Link href="/login">{t("common.login")}</Link>
              </li>
              <li>
                <Link href="/register">{t("common.register")}</Link>
              </li>
              <li>
                <Link href="/messages">
                  <MessageCircle size={14} aria-hidden />
                  {t("nav.messages")}
                </Link>
              </li>
              <li>
                <Link href="/#qebele-kiraye-rehberi">{t("footer.rentalGuide")}</Link>
              </li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>{t("footer.contact")}</h4>
            <ul>
              <li>
                <a href="tel:+994554440830">
                  <Phone size={14} aria-hidden />
                  055 444 08 30
                </a>
              </li>
              <li>
                <Link href="/messages">{t("footer.messageAdmin")}</Link>
              </li>
            </ul>
            <p className="site-footer-note">{t("footer.note")}</p>
          </div>
          </div>
        </div>
      </div>

      <div className="site-footer-keywords-wrap">
        <div className="container site-footer-keywords">
          {footerKeywordKeys.map((key) => (
            <span key={key}>{t(key)}</span>
          ))}
        </div>
      </div>

      <div className="site-footer-bottom">
        <div className="container site-footer-bottom-inner">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.copyrightSub")}</span>
        </div>
      </div>
    </footer>
  );
}
