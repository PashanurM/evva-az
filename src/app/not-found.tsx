import Link from "next/link";
import { Home, Search, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found-shell">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>Səhifə tapılmadı</h1>
        <p className="not-found-copy">
          Axtardığınız səhifə mövcud deyil, silinib və ya ünvan səhv yazılıb.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="auth-btn primary">
            <Home size={16} aria-hidden />
            Ana səhifə
          </Link>
          <Link href="/#properties" className="auth-btn">
            <Search size={16} aria-hidden />
            Evlərə bax
          </Link>
          <Link href="/places" className="auth-btn">
            <Compass size={16} aria-hidden />
            Məkanlar
          </Link>
        </div>
      </div>
    </section>
  );
}
