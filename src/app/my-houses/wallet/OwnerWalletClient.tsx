"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Crown, Copy, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";

type WalletPackage = { key: string; label: string; days: number; price: number };
type PaymentAccount = {
  account_title: string;
  bank_name: string;
  card_holder: string;
  card_number_masked: string;
  card_number: string;
  phone: string;
  whatsapp: string;
};

export function OwnerWalletClient() {
  const { user, loading: authLoading, refresh } = useAuth();
  const searchParams = useSearchParams();
  const queryPropertyId = Number(searchParams.get("property_id") || 0);
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState<WalletPackage[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [hint, setHint] = useState("");
  const [adminWa, setAdminWa] = useState("994554440830");
  const [houses, setHouses] = useState<Array<{ id: number; title: string; is_featured: boolean }>>([]);
  const [propertyId, setPropertyId] = useState(queryPropertyId > 0 ? queryPropertyId : 0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      const [walletRes, housesRes] = await Promise.all([
        api.getOwnerWallet(),
        api.getOwnerProperties(),
      ]);
      if (walletRes.success && walletRes.data) {
        setBalance(walletRes.data.balance);
        setPackages(walletRes.data.packages || []);
        setAccounts(walletRes.data.payment_accounts || []);
        setHint(walletRes.data.topup_hint || "");
        setAdminWa(String(walletRes.data.admin_whatsapp || "994554440830").replace(/\D/g, ""));
      } else {
        setError(walletRes.error || "Balans yüklənmədi");
      }
      if (housesRes.success && housesRes.data) {
        const items = (housesRes.data.items || []).map((h) => ({
          id: h.id,
          title: h.title,
          is_featured: Boolean(h.is_featured),
        }));
        setHouses(items);
        setPropertyId((current) => {
          if (current > 0 && items.some((h) => h.id === current)) return current;
          if (queryPropertyId > 0 && items.some((h) => h.id === queryPropertyId)) {
            return queryPropertyId;
          }
          return items[0]?.id || 0;
        });
      }
      setLoading(false);
    })();
  }, [authLoading, user, queryPropertyId]);

  async function buy(pkgKey: string) {
    if (!propertyId) {
      setError("Əvvəlcə ev seçin.");
      return;
    }
    setBusy(pkgKey);
    setError("");
    setSuccess("");
    const res = await api.buyOwnerPremium(propertyId, pkgKey);
    if (!res.success || !res.data) {
      setError(res.error || "Premium aktivləşmədi");
      setBusy(null);
      return;
    }
    setBalance(res.data.balance);
    setSuccess(res.data.message);
    setHouses((prev) =>
      prev.map((h) => (h.id === propertyId ? { ...h, is_featured: true } : h)),
    );
    await refresh();
    setBusy(null);
  }

  function copyCard(number: string) {
    void navigator.clipboard.writeText(number.replace(/\D/g, ""));
    setSuccess("Kart nömrəsi kopyalandı");
  }

  if (authLoading || loading) {
    return <p className="owner-panel-empty">Yüklənir...</p>;
  }

  if (!user) {
    return (
      <AuthRequiredGate
        kicker="Ev sahibi"
        title="Balans / Premium"
        description="Balans və premium üçün daxil olun."
        loginHref={`/login?return=${encodeURIComponent("/my-houses/wallet")}`}
        registerHref={`/register?return=${encodeURIComponent("/my-houses/wallet")}`}
      />
    );
  }

  const waTopup = `https://wa.me/${adminWa}?text=${encodeURIComponent(
    "Salam! Balans artırmaq üçün ödəniş qəbzini göndərirəm.",
  )}`;

  return (
    <div className="owner-panel">
      <div className="container">
        <div className="owner-panel-section owner-panel-card">
          <div className="owner-panel-section-head">
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>Balans / Premium</h1>
              <p className="owner-panel-empty" style={{ marginTop: 6, padding: 0 }}>
                Balansı artırın və seçilmiş evi ödənişli premium edin.
              </p>
            </div>
            <span className="owner-wallet-balance">
              <Wallet size={16} aria-hidden />
              {balance.toFixed(2)} ₼
            </span>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}

          <section className="owner-wallet-block">
            <h2>1. Balansı necə artırmaq olar?</h2>
            <p>{hint || "Kart hesabına ödəyib qəbzi adminə göndərin."}</p>
            <div className="owner-payment-grid">
              {accounts.length === 0 ? (
                <p className="owner-panel-empty">Hələ ödəniş hesabı əlavə olunmayıb. Adminə yazın.</p>
              ) : (
                accounts.map((acc, idx) => (
                  <article key={`${acc.card_number}-${idx}`} className="owner-payment-card">
                    <strong>{acc.account_title || acc.bank_name}</strong>
                    <span>{acc.bank_name}</span>
                    <span>{acc.card_holder}</span>
                    <code>{acc.card_number_masked || acc.card_number}</code>
                    <div className="owner-payment-actions">
                      {acc.card_number ? (
                        <button type="button" className="auth-btn" onClick={() => copyCard(acc.card_number)}>
                          <Copy size={14} /> Kopyala
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
            <a href={waTopup} target="_blank" rel="noopener noreferrer" className="auth-btn primary" style={{ marginTop: 12, display: "inline-flex" }}>
              WhatsApp ilə qəbz göndər
            </a>
          </section>

          <section className="owner-wallet-block">
            <h2>2. Premium paket seç</h2>
            <label className="form-field">
              <span>Hansı ev premium olsun?</span>
              <select
                value={propertyId || ""}
                onChange={(e) => setPropertyId(Number(e.target.value))}
              >
                {houses.length === 0 ? <option value="">Ev yoxdur</option> : null}
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                    {h.is_featured ? " (premium)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="owner-premium-grid">
              {packages.map((pkg) => {
                const enough = balance + 0.0001 >= pkg.price;
                return (
                  <div key={pkg.key} className="owner-premium-card">
                    <Crown size={18} aria-hidden />
                    <strong>{pkg.label}</strong>
                    <span className="owner-premium-price">{pkg.price.toFixed(0)} ₼</span>
                    <small>{pkg.days} gün · seçilmiş ev</small>
                    <button
                      type="button"
                      className="auth-btn primary"
                      disabled={!enough || !propertyId || busy === pkg.key}
                      onClick={() => void buy(pkg.key)}
                    >
                      {busy === pkg.key ? "Gözlə..." : enough ? "Paketi al" : "Balans azdır"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="owner-wallet-back">
              <Link href="/my-houses" className="auth-btn owner-wallet-back-btn">
                <ArrowLeft size={16} aria-hidden />
                Evlərimə qayıt
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
