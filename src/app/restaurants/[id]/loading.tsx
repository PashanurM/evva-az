export default function RestaurantDetailLoading() {
  return (
    <section className="place-detail detail-loading" aria-busy="true" aria-live="polite">
      <div className="container">
        <div className="detail-loading-crumbs" />
        <div className="detail-loading-kicker" />
        <div className="detail-loading-title" />
        <div className="detail-loading-loc" />
        <div className="detail-loading-hero" />
        <div className="detail-loading-grid">
          <div className="detail-loading-card" />
          <div className="detail-loading-card detail-loading-card--side" />
        </div>
      </div>
    </section>
  );
}
