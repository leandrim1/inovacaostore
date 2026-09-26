import { STORE } from "../../data/store";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { InstagramIcon } from "../ui/InstagramIcon";
import { Tilt3D } from "../ui/Tilt3D";

// Versões de 400 px geradas por scripts/otimizar-imagens.mjs: a grade é um
// quadrado de ~114 px no celular, então os arquivos de 1200 px baixavam
// dez vezes mais pixel do que a tela mostra.
import insta01 from "../../assets/images/otimizadas/insta-01.webp";
import insta02 from "../../assets/images/otimizadas/insta-02.webp";
import insta03 from "../../assets/images/otimizadas/insta-03.webp";
import insta04 from "../../assets/images/otimizadas/insta-04.webp";
import insta05 from "../../assets/images/otimizadas/insta-05.webp";
import camiseta01 from "../../assets/images/otimizadas/product-camiseta-01.webp";
import camiseta03 from "../../assets/images/otimizadas/product-camiseta-03.webp";
import bermuda02 from "../../assets/images/otimizadas/product-bermuda-02.webp";

const IMAGES = [
  insta01,
  camiseta01,
  insta02,
  insta03,
  bermuda02,
  insta04,
  camiseta03,
  insta05,
];

export function InstagramFeed() {
  return (
    <section className="bg-brand-cream py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading
          index="04"
          eyebrow="Comunidade"
          title="Siga no Instagram"
          description={
            <a
              href={STORE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-display text-sm tracking-widest text-brand-yellow-dark hover:underline"
            >
              <InstagramIcon size={16} />
              {STORE.social.instagramHandle}
            </a>
          }
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-8">
          {IMAGES.map((src, i) => (
            <Reveal key={i} delay={(i % 8) * 0.03}>
              <Tilt3D className="rounded-2xl" max={9}>
                <a
                  href={STORE.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-2xl"
                >
                  <img
                    src={src}
                    alt="Publicação da Inovação Store no Instagram"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/50">
                    <InstagramIcon
                      size={20}
                      className="text-white opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </a>
              </Tilt3D>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
