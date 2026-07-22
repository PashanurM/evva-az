"use client";

import { CheckCircle } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export function GuideSection() {
  const { t } = useLocale();

  const guideItems = [
    t("home.guideItem1"),
    t("home.guideItem2"),
    t("home.guideItem3"),
    t("home.guideItem4"),
  ];

  return (
    <section className="seo-blog-section" id="qebele-kiraye-rehberi">
      <div className="container">
        <article className="seo-blog-card">
          <div className="seo-blog-grid">
            <div>
              <span className="section-kicker">{t("home.guideKicker")}</span>
              <h2>{t("home.guideTitle")}</h2>
              <p>{t("home.guideP1")}</p>
              <p>{t("home.guideP2")}</p>
            </div>
            <aside className="seo-side-card">
              <h3>{t("home.guideListTitle")}</h3>
              <ul>
                {guideItems.map((item) => (
                  <li key={item}>
                    <CheckCircle size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </article>
      </div>
    </section>
  );
}
