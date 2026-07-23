import { Suspense } from "react";
import { SearchBox } from "@/components/home/SearchBox";
import { PropertyGrid } from "@/components/home/PropertyGrid";
import { DiscoverHub } from "@/components/home/DiscoverHub";
import { MapSection } from "@/components/home/MapSection";
import { GuideSection } from "@/components/home/GuideSection";
import { BottomCta } from "@/components/home/BottomCta";
import { mapApiProperty } from "@/lib/mappers";
import { getProperties, getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.home;

interface HomeProps {
  searchParams: Promise<{
    search?: string;
    location?: string;
    min_price?: string;
    max_price?: string;
    min_rooms?: string;
    min_bathrooms?: string;
    check_in?: string;
    check_out?: string;
    tags?: string | string[];
    sort?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const tags = params.tags
    ? Array.isArray(params.tags)
      ? params.tags
      : [params.tags]
    : undefined;

  const [config, listing] = await Promise.all([
    getSiteConfig(),
    getProperties({
      search: params.search,
      location: params.location,
      min_price: params.min_price,
      max_price: params.max_price,
      min_rooms: params.min_rooms,
      min_bathrooms: params.min_bathrooms,
      check_in: params.check_in,
      check_out: params.check_out,
      tags,
      sort: params.sort || "newest",
    }),
  ]);

  const properties = listing.items.map(mapApiProperty);
  const locations = config.locations;
  const filterTags = Object.keys(config.tag_options);

  return (
    <>
      <Suspense fallback={<div className="hero" />}>
        <SearchBox
          totalCount={listing.total}
          locations={locations}
          filterTags={filterTags}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PropertyGrid properties={properties} />
      </Suspense>
      <DiscoverHub />
      <MapSection properties={properties} />
      <GuideSection />
      <BottomCta />
    </>
  );
}
