import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useParallax } from "../../hooks/useParallax";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { useElementAspectRatio } from "../../hooks/useElementAspectRatio";
import { useProducts } from "../../hooks/useProducts";
import { SLIDE_DURATION, useDadosDoHero, type DadosDoHero } from "../../hooks/useDadosDoHero";
import { DEFAULT_IMAGE_SETTINGS, totalScale } from "../../lib/imageSettings";
import { StarRating } from "../ui/StarRating";
import { EVENTO_HERO, useExperiencia3D } from "../../lib/experiencia3d";
import { CenaDoHero } from "../3d/CenaDoHero";
import { paraVitrine, type ProdutoVitrine } from "../3d/qualidade";
import { MobileHero } from "../mobile/MobileHero";


/**
 * Hero da home. O celular é o desenho principal (`MobileHero`: composição
 * vertical com o produto pendurado no centro); a partir de 1024 px ele se
 * expande para a vitrine larga — texto grande à esquerda, as peças em
 * destaque à direita, foto do painel de ponta a ponta. Os dois leem os
 * mesmos dados (`useDadosDoHero`), então textos, imagens e CTA do painel
 * valem igual.
 */
export function Hero() {
  const movel = useIsMobileViewport();
  const dados = useDadosDoHero();

  // O header fica em vidro escuro por cima do hero: avisa quando ele (re)monta.
  useEffect(() => {
    window.dispatchEvent(new Event(EVENTO_HERO));
    return () => {
      window.dispatchEvent(new Event(EVENTO_HERO));
    };
  }, [movel]);

  return movel ? <MobileHero dados={dados} /> : <HeroDesktop dados={dados} />;
}

function HeroDesktop({ dados }: { dados: DadosDoHero }) {
  const { settings, carregando, slides, count, safeIndex, setIndex, currentSlide, isExternalCta, titleLines, averageRating } =
    dados;
  const { ref, offset } = useParallax(0.15);
  const aspect = useElementAspectRatio(ref, 16 / 9);
  const [prefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const secaoRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { nivel } = useExperiencia3D();
  const [cenaPronta, setCenaPronta] = useState(false);

  const { data: destaques = [] } = useProducts({ featured: true, limit: 8 });
  const produtos = useMemo(
    () => destaques.map(paraVitrine).filter((p): p is ProdutoVitrine => p !== null).slice(0, 3),
    [destaques],
  );

  const customSettings = currentSlide.desktopSettings;
  const effectiveSettings = customSettings ?? DEFAULT_IMAGE_SETTINGS;
  const zoomFactor = totalScale(effectiveSettings, aspect);
  const imgClassName = customSettings
    ? "absolute inset-0 h-full w-full object-cover"
    : "absolute inset-0 h-[120%] w-full object-cover object-[center_82%]";

  const cta = (
    <>
      {settings.heroCtaLabel}
      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
    </>
  );

  return (
    // Sobe por baixo do header (-mt): no topo ele fica transparente sobre a
    // foto. As alturas mínimas somam a altura do header, para a área visível
    // da foto continuar a mesma de antes.
    <section ref={secaoRef} data-hero data-cabecalho-escuro className="relative -mt-20">
      <div className="relative flex min-h-[calc(90vh+5rem)] items-end overflow-hidden bg-brand-ink">
        <div ref={ref} className="absolute inset-0" aria-hidden>
          <AnimatePresence>
            {!carregando && (
              <motion.img
                key={currentSlide.id}
                src={currentSlide.url}
                alt="Amigos vestindo peças da Inovação Store"
                initial={{ opacity: 0, scale: zoomFactor, rotate: effectiveSettings.rotation }}
                animate={{
                  opacity: 1,
                  scale: (prefersReducedMotion ? 1 : 1.04) * zoomFactor,
                  rotate: effectiveSettings.rotation,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.9, ease: "easeInOut" },
                  scale: { duration: SLIDE_DURATION / 1000 + 1.5, ease: "linear" },
                }}
                className={imgClassName}
                style={{
                  y: offset,
                  ...(customSettings
                    ? { objectPosition: `${customSettings.positionX}% ${customSettings.positionY}%` }
                    : {}),
                }}
                fetchPriority={safeIndex === 0 ? "high" : undefined}
              />
            )}
          </AnimatePresence>
          {/* Escurece de baixo para cima (onde fica o texto) e um pouco no
              topo (onde fica o header) — a foto continua a protagonista. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/55 to-transparent" />
        </div>

        {/* Vitrine 3D na metade direita: as peças em destaque penduradas, que
            o mouse traz para frente (com nome e preço) e o clique abre. */}
        {nivel !== "baixo" && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/55 to-transparent"
              aria-hidden
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-700 ease-out ${
                cenaPronta ? "opacity-100" : "opacity-0"
              }`}
            >
              <CenaDoHero
                layout="leque"
                area={secaoRef}
                eventSource={secaoRef}
                produtos={produtos}
                entradas={{}}
                onEscolher={(slug) => navigate(`/produto/${slug}`)}
                onPronto={() => setCenaPronta(true)}
              />
            </div>
          </>
        )}

        <div className="container-page relative z-10 pb-20 pt-40">
          {/* O texto espera junto com a imagem: título e descrição padrão de
              código também não são os que o lojista escreveu. A altura mínima da
              seção segura o layout, então nada pula quando o conteúdo entra. */}
          {!carregando && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl"
            >
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-white/60">{settings.heroEyebrow}</p>
              <h1 className="mt-3 font-display text-[clamp(3.5rem,8.5vw,8rem)] leading-[0.84] text-white">
                {titleLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-md text-lg leading-snug text-white/75">{settings.heroDescription}</p>
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                {isExternalCta ? (
                  <a href={settings.heroCtaUrl} target="_blank" rel="noreferrer" className="btn-accent group">
                    {cta}
                  </a>
                ) : (
                  <Link to={settings.heroCtaUrl} className="btn-accent group">
                    {cta}
                  </Link>
                )}
                {/* Prova social em texto corrido, ao lado do CTA — só quando existe
                    algum depoimento aprovado para sustentar a nota. */}
                {averageRating !== null && (
                  <div className="flex items-center gap-2.5 text-sm text-white/70">
                    <StarRating rating={averageRating} size={13} />
                    <span>
                      <strong className="font-semibold text-white">{averageRating.toFixed(1).replace(".", ",")}</strong> de 5 na
                      avaliação dos clientes
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {count > 1 && (
          <div className="absolute bottom-8 right-10 z-10 flex w-40 items-center gap-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                className="flex h-6 flex-1 items-center"
              >
                <span className="block h-0.5 w-full overflow-hidden bg-white/25">
                  {i === safeIndex ? (
                    <span
                      key={safeIndex}
                      className="block h-full w-full origin-left animate-[fill-bar_6s_linear] bg-white motion-reduce:animate-none"
                    />
                  ) : i < safeIndex ? (
                    <span className="block h-full w-full bg-white/70" />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
