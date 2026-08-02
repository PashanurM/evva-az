"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MapPin } from "lucide-react";
import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

interface CompareClientProps {
  properties: Property[];
}

export function CompareClient({ properties }: CompareClientProps) {
  const { t } = useLocale();

  if (properties.length === 0) {
    return (
      <section className="compare-page">
        <div className="container">
          <h1>{t("compare.title")}</h1>
          <p>{t("compare.empty")}</p>
          <Link href="/homes#properties" className="hub-cta hub-cta--primary">
            {t("common.browseHomes")}
          </Link>
        </div>
      </section>
    );
  }

  const rows: Array<{
    key: string;
    label: string;
    render: (property: Property) => ReactNode;
  }> = [
    {
      key: "image",
      label: t("compare.image"),
      render: (property) => (
        <Link href={`/property/${property.id}`} className="compare-thumb">
          <Image src={property.image} alt={property.title} width={120} height={80} unoptimized />
        </Link>
      ),
    },
    {
      key: "title",
      label: t("compare.name"),
      render: (property) => (
        <Link href={`/property/${property.id}`}>{property.title}</Link>
      ),
    },
    {
      key: "price",
      label: t("compare.price"),
      render: (property) => (
        <span>
          {property.price} {t("common.perNight")}
        </span>
      ),
    },
    {
      key: "rooms",
      label: t("compare.rooms"),
      render: (property) => property.rooms,
    },
    {
      key: "bathrooms",
      label: t("compare.bathrooms"),
      render: (property) => property.bathrooms,
    },
    {
      key: "guests",
      label: t("compare.guests"),
      render: (property) => property.guests,
    },
    {
      key: "rating",
      label: t("common.rating"),
      render: (property) =>
        property.rating > 0 ? `${property.rating.toFixed(1)}/10` : "—",
    },
    {
      key: "location",
      label: t("common.location"),
      render: (property) => (
        <span className="compare-location">
          <MapPin size={14} aria-hidden /> {property.location}
        </span>
      ),
    },
    {
      key: "available",
      label: t("compare.availability"),
      render: (property) =>
        property.availableNext7Days ? (
          <span className="availability-badge">
            <CheckCircle2 size={12} aria-hidden />
            {t("home.availableNext7")}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "tags",
      label: t("compare.tags"),
      render: (property) =>
        property.tags?.length ? (
          <span className="compare-tags">{property.tags.join(", ")}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      label: t("compare.actions"),
      render: (property) => (
        <div className="compare-actions">
          <Link href={`/property/${property.id}`}>{t("common.viewDetails")}</Link>
          <Link href={`/booking?property_id=${property.id}`}>{t("common.reserve")}</Link>
        </div>
      ),
    },
  ];

  return (
    <section className="compare-page">
      <div className="container">
        <span className="section-kicker">{t("compare.kicker")}</span>
        <h1>{t("compare.title")}</h1>
        <p className="compare-intro">{t("compare.intro", { count: properties.length })}</p>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">{t("compare.feature")}</th>
                {properties.map((property) => (
                  <th key={property.id} scope="col">
                    {property.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {properties.map((property) => (
                    <td key={`${row.key}-${property.id}`}>{row.render(property)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="compare-cards">
          {properties.map((property) => (
            <article key={property.id} className="compare-card">
              <div className="compare-card-media">
                <Image src={property.image} alt={property.title} width={360} height={220} unoptimized />
              </div>
              <h2>{property.title}</h2>
              <p>
                <MapPin size={14} aria-hidden /> {property.location}
              </p>
              <ul>
                <li>
                  {t("compare.price")}: {property.price} {t("common.perNight")}
                </li>
                <li>
                  {t("compare.rooms")}: {property.rooms}
                </li>
                <li>
                  {t("compare.bathrooms")}: {property.bathrooms}
                </li>
                <li>
                  {t("compare.guests")}: {property.guests}
                </li>
                {property.rating > 0 ? (
                  <li>
                    {t("common.rating")}: {property.rating.toFixed(1)}/10
                  </li>
                ) : null}
                {property.availableNext7Days ? (
                  <li className="availability-badge">
                    <CheckCircle2 size={12} aria-hidden />
                    {t("home.availableNext7")}
                  </li>
                ) : null}
              </ul>
              {property.tags?.length ? (
                <p className="compare-tags">{property.tags.join(", ")}</p>
              ) : null}
              <div className="compare-actions">
                <Link href={`/property/${property.id}`}>{t("common.viewDetails")}</Link>
                <Link href={`/booking?property_id=${property.id}`}>{t("common.reserve")}</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
