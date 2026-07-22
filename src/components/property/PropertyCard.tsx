"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Property } from "@/lib/types";
import { assetUrl } from "@/lib/api";
import { propertyMapLink } from "@/lib/map";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorite, setFavorite] = useState(property.is_favorite);

  const coverUrl = assetUrl(property.cover_url || property.cover_path);

  const toggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const action = favorite ? "remove" : "add";
    const res = await api.toggleFavorite(property.id, action);
    if (res.success) setFavorite(action === "add");
  };

  return (
    <div
      className={`property-card ${property.is_premium ? "premium-property-card" : ""}`}
      id={`property-${property.id}`}
      data-id={property.id}
    >
      {user && (
        <button
          className={`favorite-btn ${favorite ? "active" : ""}`}
          type="button"
          onClick={toggleFavorite}
          aria-label="Seçilmişlərə əlavə et"
        >
          <i className="fas fa-heart" />
        </button>
      )}

      <Link href={`/property/${property.id}`} className="card-image">
        {coverUrl ? (
          <img src={coverUrl} alt={property.title} loading="lazy" decoding="async" />
        ) : (
          <div className="no-image">
            <i className="fas fa-image" />
          </div>
        )}

        {property.is_premium && (
          <span className="premium-crown-badge" aria-label="Seçilmiş ev">
            <i className="fas fa-crown" />
          </span>
        )}

        <div className="card-overlay" />

        <div className="card-badges">
          <span className="location-badge">
            <i className="fas fa-map-marker-alt" /> {property.location}
          </span>
          <span className="price-badge">{property.price} ₼/gecə</span>
        </div>
      </Link>

      <div className="card-content">
        <div className="card-topline">
          <h3>{property.title}</h3>
        </div>

        <div className="mobile-card-meta" aria-label="Ev məlumatları">
          <span title="Nəfər"><i className="fas fa-users" />{property.capacity}</span>
          <span title="Otaq"><i className="fas fa-door-open" />{property.rooms}</span>
          <span title="Hamam"><i className="fas fa-bath" />{property.bathrooms}</span>
          <span title="Baxış"><i className="fas fa-eye" />{property.views}</span>
        </div>

        <div className="card-meta">
          <span><i className="fas fa-users" /> {property.capacity} nəfər</span>
          <span><i className="fas fa-door-open" /> {property.rooms} otaq</span>
          <span><i className="fas fa-eye" /> {property.views} baxış</span>
          <span><i className="fas fa-star" /> {property.avg_rating.toFixed(1)}/10</span>
        </div>

        {property.tags.length > 0 && (
          <div className="card-tags" aria-label="Əsas xüsusiyyətlər">
            {property.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {property.latitude && property.longitude && (
          <a
            className="premium-map-btn"
            href={propertyMapLink(property.latitude, property.longitude)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-map-location-dot" /> Xəritədə bax
          </a>
        )}

        <div className="card-actions card-actions-3">
          <Link href={`/property/${property.id}`} className="view-btn" aria-label="Ətraflı">
            <i className="fas fa-eye" aria-hidden />
            <span className="btn-label">Ətraflı</span>
          </Link>
          <Link href={`/chat?property_id=${property.id}`} className="contact-btn" aria-label="Mesaj yaz">
            <i className="fas fa-comments" aria-hidden />
            <span className="btn-label">Mesaj yaz</span>
          </Link>
          <Link href={`/booking?property_id=${property.id}`} className="reserve-btn" aria-label="Rezerv et">
            <i className="fas fa-calendar-check" aria-hidden />
            <span className="btn-label">Rezerv et</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
