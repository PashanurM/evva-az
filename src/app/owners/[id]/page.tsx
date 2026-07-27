import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Eye, Home, Star, CalendarCheck } from "lucide-react";
import { mapApiProperty } from "@/lib/mappers";
import { assetUrl } from "@/lib/assets";
import { getPublicOwner } from "@/lib/server-api";
import { createDynamicMetadata, KEYWORDS } from "@/lib/site-metadata";
import { PropertyCard } from "@/components/home/PropertyCard";
import { OwnerProfileMap } from "./OwnerProfileMap";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const ownerId = Number(id);
  if (!Number.isFinite(ownerId) || ownerId <= 0) {
    return { title: "Ev sahibi tapılmadı | EVVA.AZ" };
  }

  const profile = await getPublicOwner(ownerId);
  if (!profile) return { title: "Ev sahibi tapılmadı | EVVA.AZ" };

  const name = profile.owner.name || "Ev sahibi";
  return createDynamicMetadata({
    title: `${name} | Ev sahibi profili | EVVA.AZ`,
    description:
      profile.owner.bio ||
      `${name} adlı ev sahibinin EVVA.AZ profilinə və aktiv kirayə evlərinə baxın.`,
    keywords: [...KEYWORDS.property, name, "ev sahibi"],
  });
}

export default async function OwnerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const ownerId = Number(id);
  if (!Number.isFinite(ownerId) || ownerId <= 0) notFound();

  const profile = await getPublicOwner(ownerId);
  if (!profile) notFound();

  const { owner, stats } = profile;
  const name = owner.name || "Ev sahibi";
  const avatar = assetUrl(owner.profile_image_url || owner.profile_image);
  const initial = name.trim().charAt(0).toLocaleUpperCase("az") || "E";
  const properties = profile.properties.map(mapApiProperty);

  return (
    <section className="owner-profile-shell">
      <div className="container">
        <nav className="crumbs">
          <Link href="/">Ana səhifə</Link>
          <ChevronRight size={14} />
          <span>{name}</span>
        </nav>

        <div className="owner-profile-hero glass">
          <div className="owner-profile-identity">
            <span className="owner-profile-avatar" aria-hidden>
              {avatar ? (
                <Image src={avatar} alt={name} width={88} height={88} unoptimized />
              ) : (
                initial
              )}
            </span>
            <div>
              <p className="owner-profile-kicker">Ev sahibi</p>
              <h1>{name}</h1>
              <p className="owner-profile-bio">
                {owner.bio?.trim() ||
                  "Bu ev sahibi haqqında əlavə məlumat hələ daxil edilməyib. Aktiv elanlarına əsasən seçim edə bilərsiniz."}
              </p>
            </div>
          </div>

          <div className="owner-profile-stats">
            <div className="owner-profile-stat">
              <Home size={18} aria-hidden />
              <strong>{stats.property_count}</strong>
              <span>Aktiv ev</span>
            </div>
            {stats.rating_count > 0 ? (
              <div className="owner-profile-stat">
                <Star size={18} aria-hidden />
                <strong>{stats.avg_rating.toFixed(1)}</strong>
                <span>{stats.rating_count} rəy</span>
              </div>
            ) : null}
            <div className="owner-profile-stat">
              <Eye size={18} aria-hidden />
              <strong>{stats.total_views}</strong>
              <span>Baxış</span>
            </div>
            <div className="owner-profile-stat">
              <CalendarCheck size={18} aria-hidden />
              <strong>{stats.approved_bookings}</strong>
              <span>Təsdiqli rezerv</span>
            </div>
          </div>
        </div>

        <div className="owner-profile-list-head">
          <h2>Aktiv evlər</h2>
          <p>{properties.length} elan</p>
        </div>

        <OwnerProfileMap properties={properties} />

        {properties.length > 0 ? (
          <div className="properties-grid">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="owner-profile-empty glass">
            <h3>Aktiv ev yoxdur</h3>
            <p>Bu ev sahibi üçün hazırda public görünən aktiv elan tapılmadı.</p>
            <Link href="/#properties" className="auth-btn primary">
              Digər evlərə bax
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
