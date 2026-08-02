import Link from "next/link";
import { Suspense } from "react";
import { PropertyGrid } from "@/components/home/PropertyGrid";
import { mapApiProperty } from "@/lib/mappers";
import { getProperties, getSiteConfig } from "@/lib/server-api";
import { createPageMetadata } from "@/lib/site-metadata";

const EXPLORE_PAGES = {
  "qebele-hovuzlu-villa": {
    title: "Qəbələdə hovuzlu villa kirayəsi | EVVA.AZ",
    description:
      "Qəbələdə hovuzlu villa və ev elanları. Premium istirahət üçün seçilmiş hovuzlu villalar.",
    heading: "Qəbələdə hovuzlu villa kirayəsi",
    intro:
      "Hovuzlu villalar ailəvi istirahət və isti yay günləri üçün ideal seçimdir. Aşağıda hovuz tag-i ilə filter edilmiş elanları görə bilərsiniz.",
    filters: { tags: ["Hovuz"], sort: "rating_desc" as const },
    homesQuery: "/homes?tags=Hovuz&sort=rating_desc",
  },
  "vendam-a-frame": {
    title: "Vəndam A-frame ev kirayəsi | EVVA.AZ",
    description:
      "Vəndam istiqamətində A-frame tipli evlər. Romantik və premium istirahət seçimi.",
    heading: "Vəndam A-frame ev kirayəsi",
    intro:
      "Vəndamın sakit təbiət qoynunda A-frame evlər. Romantik həftəsonu və fotoşəkil üçün populyar seçim.",
    filters: { search: "A-frame", location: "Vəndam", sort: "rating_desc" as const },
    homesQuery: "/homes?search=A-frame&location=V%C9%99ndam&sort=rating_desc",
  },
  "qebele-gunluk-kiraye": {
    title: "Qəbələdə günlük kirayə evlər | EVVA.AZ",
    description:
      "Qəbələdə günlük kirayə ev, villa və A-frame elanları. EVVA.AZ seçilmiş elan vitrini.",
    heading: "Qəbələdə günlük kirayə evlər",
    intro:
      "Qəbələdə günlük kirayə ev axtaranlar üçün bütün aktiv elanlar. Filter edib uyğun evi seçin.",
    filters: { sort: "rating_desc" as const },
    homesQuery: "/homes?sort=rating_desc",
  },
} as const;

type ExploreSlug = keyof typeof EXPLORE_PAGES;

export function generateStaticParams() {
  return Object.keys(EXPLORE_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = EXPLORE_PAGES[slug as ExploreSlug];
  if (!page) {
    return createPageMetadata({ title: "Kəşf et | EVVA.AZ" });
  }
  return createPageMetadata({
    title: page.title,
    description: page.description,
  });
}

export default async function ExploreSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = EXPLORE_PAGES[slug as ExploreSlug];
  if (!page) {
    return (
      <section className="explore-landing">
        <div className="container">
          <h1>Səhifə tapılmadı</h1>
          <Link href="/homes">Evlərə bax</Link>
        </div>
      </section>
    );
  }

  const [listing] = await Promise.all([
    getProperties({
      search: "search" in page.filters ? page.filters.search : undefined,
      location: "location" in page.filters ? page.filters.location : undefined,
      sort: page.filters.sort,
      tags: "tags" in page.filters ? [...page.filters.tags] : undefined,
    }),
    getSiteConfig(),
  ]);

  const properties = listing.items.map(mapApiProperty);

  return (
    <section className="explore-landing">
      <div className="container">
        <span className="section-kicker">EVVA.AZ</span>
        <h1>{page.heading}</h1>
        <p className="explore-intro">{page.intro}</p>
        <Link href={page.homesQuery} className="hub-cta hub-cta--primary explore-all-link">
          Bütün uyğun elanlara bax
        </Link>
      </div>

      <Suspense fallback={null}>
        <PropertyGrid properties={properties.slice(0, 12)} />
      </Suspense>
    </section>
  );
}
