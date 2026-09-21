import { Seo } from "../components/seo/Seo";
import { Hero } from "../components/home/Hero";
import { PromotionsBanner } from "../components/home/PromotionsBanner";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { Banners } from "../components/home/Banners";
import { FeaturedProducts } from "../components/home/FeaturedProducts";
import { Benefits } from "../components/home/Benefits";
import { Testimonials } from "../components/home/Testimonials";
import { Gallery } from "../components/home/Gallery";
import { InstagramFeed } from "../components/home/InstagramFeed";
import { Newsletter } from "../components/home/Newsletter";
import { STORE } from "../data/store";
import { useSiteSettings } from "../hooks/useSiteSettings";

export default function Home() {
  const { data: settings } = useSiteSettings();

  return (
    <>
      <Seo
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ClothingStore",
          name: STORE.name,
          description: STORE.seoDefaultDescription,
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.addressStreet,
            addressLocality: settings.addressCity,
            addressRegion: settings.addressState,
            postalCode: settings.addressZip,
            addressCountry: "BR",
          },
          sameAs: [STORE.social.instagram],
        }}
      />
      <Hero />
      <Gallery />
      <Banners />
      <CategoryGrid />
      <PromotionsBanner />
      <FeaturedProducts />
      <Benefits />
      <Testimonials />
      <InstagramFeed />
      <Newsletter />
    </>
  );
}
