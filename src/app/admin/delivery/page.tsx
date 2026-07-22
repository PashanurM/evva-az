import { AdminShell } from "@/components/admin/AdminShell";
import { ExternalLink } from "lucide-react";

const LEGACY_BASE = process.env.NEXT_PUBLIC_LEGACY_URL || "http://localhost/evva";

export default function AdminDeliveryPage() {
  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Delivery</span>
          <h1>EVVA Delivery</h1>
          <p>Delivery modulu hələ ayrıca PHP panelində idarə olunur.</p>
        </div>
        <div className="admin-panel-card">
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Delivery admin panelini açmaq üçün legacy PHP interfeysindən istifadə edin.
            Növbəti mərhələdə bu bölmə də Next.js-ə köçürüləcək.
          </p>
          <div style={{ marginTop: 16 }}>
            <a
              href={`${LEGACY_BASE}/legacy-ui/delivery/admin/dashboard.php`}
              className="admin-nav-link active"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              Delivery panelini aç
            </a>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
