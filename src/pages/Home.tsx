import { Seo } from "../components/seo/Seo";
import { Hero } from "../components/home/Hero";
import { PromotionsBanner } from "../components/home/PromotionsBanner";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { FeaturedProducts } from "../components/home/FeaturedProducts";
import { Benefits } from "../components/home/Benefits";
import { Testimonials } from "../components/home/Testimonials";
import { Gallery } from "../components/home/Gallery";
import { InstagramFeed } from "../components/home/InstagramFeed";
import { Newsletter } from "../components/home/Newsletter";
import { STORE } from "../data/store";

export default function Home() {
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
            streetAddress: STORE.address.street,
            addressLocality: STORE.address.city,
            addressRegion: STORE.address.state,
            addressCountry: "BR",
          },
          sameAs: [STORE.social.instagram],
        }}
      />
      <Hero />
      <Gallery />
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
