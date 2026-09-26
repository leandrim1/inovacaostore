import { STORE } from "../../data/store";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";
import { InstagramIcon } from "../ui/InstagramIcon";
import { AnimatedSection } from "../ui/AnimatedSection";

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

/**
 * Recorte do Instagram da loja: quadros encostados, sem moldura nem cantos
 * arredondados — uma folha de contato, que é o que o feed é. Oito fotos em
 * duas fileiras de quatro no celular, uma fileira só no computador.
 */
export function InstagramFeed() {
  return (
    <AnimatedSection tom="claro" className="py-14 sm:py-20">
      <div className="container-page">
        <SectionHeading
          title="Siga no Instagram"
          action={
            <a
              href={STORE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-2 text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
            >
              <InstagramIcon size={16} />
              {STORE.social.instagramHandle}
            </a>
          }
        />

        <div className="grid grid-cols-4 gap-1 lg:grid-cols-8">
          {IMAGES.map((src, i) => (
            <Reveal key={i} delay={(i % 4) * 0.03}>
              <a
                href={STORE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-square overflow-hidden bg-neutral-100"
              >
                <img
                  src={src}
                  alt="Publicação da Inovação Store no Instagram"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-85"
                />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
