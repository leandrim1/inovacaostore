import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useParallax } from "../../hooks/useParallax";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { useElementAspectRatio } from "../../hooks/useElementAspectRatio";
import { useProducts } from "../../hooks/useProducts";
import { SLIDE_DURATION, useDadosDoHero, type DadosDoHero } from "../../hooks/useDadosDoHero";
import { DEFAULT_IMAGE_SETTINGS, totalScale } from "../../lib/imageSettings";
import { StarRating } from "../ui/StarRating";
import { EVENTO_HERO, comPerspectiva, useExperiencia3D } from "../../lib/experiencia3d";
import { CenaDoHero } from "../3d/CenaDoHero";
import { paraVitrine, type ProdutoVitrine } from "../3d/qualidade";
import { MobileHero } from "../mobile/MobileHero";
import { PoeiraDeLuz } from "./PoeiraDeLuz";

const PERSPECTIVA = comPerspectiva(1400);

/**
 * Hero da home. O celular é o desenho principal (`MobileHero`: composição
 * vertical com o produto 3D no centro); a partir de 1024 px ele se expande
 * para a vitrine larga — texto à esquerda, leque de produtos à direita, foto
 * do painel de ponta a ponta. Os dois leem os mesmos dados
 * (`useDadosDoHero`), então textos, imagens e CTA do painel valem igual.
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
  const { nivel, profundidade } = useExperiencia3D();
  const [cenaPronta, setCenaPronta] = useState(false);

  const { data: destaques = [] } = useProducts({ featured: true, limit: 8 });
  const produtos = useMemo(
    () => destaques.map(paraVitrine).filter((p): p is ProdutoVitrine => p !== null).slice(0, 3),
    [destaques],
  );

  // Ao rolar, o palco do hero recua como uma tela se afastando (encolhe,
  // inclina para trás e arredonda os cantos) e o texto se apaga — a transição
  // de profundidade para a próxima seção. A base fica ancorada, então não
  // abre vão entre o hero e o que vem depois.
  const { scrollYProgress } = useScroll({ target: secaoRef, offset: ["start start", "end start"] });
  const palcoEscala = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const palcoGiro = useTransform(scrollYProgress, [0, 1], [0, 7]);
  const palcoRaio = useTransform(scrollYProgress, [0, 0.35], [0, 36]);
  const textoOpacidade = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const textoY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const customSettings = currentSlide.desktopSettings;
  const effectiveSettings = customSettings ?? DEFAULT_IMAGE_SETTINGS;
  const zoomFactor = totalScale(effectiveSettings, aspect);
  const imgClassName = customSettings
    ? "absolute inset-0 h-full w-full object-cover"
    : "absolute inset-0 h-[120%] w-full object-cover object-[center_82%]";

  return (
    // Sobe por baixo do header (-mt): o header vira vidro escuro sobre a foto
    // enquanto o hero está na tela. As alturas mínimas somam a altura do
    // header, para a área visível da foto continuar a mesma de antes.
    <section ref={secaoRef} data-hero data-cabecalho-escuro className="relative -mt-20">
      <motion.div
        className="relative flex min-h-[calc(90vh+5rem)] items-end overflow-hidden bg-brand-ink"
        transformTemplate={PERSPECTIVA}
        style={
          profundidade
            ? {
                scale: palcoEscala,
                rotateX: palcoGiro,
                borderBottomLeftRadius: palcoRaio,
                borderBottomRightRadius: palcoRaio,
                transformOrigin: "50% 100%",
              }
            : undefined
        }
      >
        <div ref={ref} className="absolute inset-0" aria-hidden>
          <AnimatePresence>
            {!carregando && (
              <motion.img
                key={currentSlide.id}
                src={currentSlide.url}
                alt="Amigos vestindo peças da Inovação Store"
                initial={{ opacity: 0, scale: 1.02 * zoomFactor, rotate: effectiveSettings.rotation }}
                animate={{
                  opacity: 0.95,
                  scale: (prefersReducedMotion ? 1 : 1.18) * zoomFactor,
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
          {/* Duotone + vinheta no lugar do degradê plano — dá profundidade e mantém o texto legível */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_15%_100%,rgba(245,196,0,0.16),transparent_70%)]" />
          <div className="absolute inset-0 [box-shadow:inset_0_0_180px_60px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Palco da vitrine 3D: escurece a metade direita para os painéis de
            vidro ganharem contraste sobre qualquer foto que o lojista subir. */}
        {nivel !== "baixo" && (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_46%_70%_at_76%_48%,rgba(0,0,0,0.62),transparent_74%)]"
              aria-hidden
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-[1400ms] ease-out ${
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
        {nivel === "baixo" && profundidade && <PoeiraDeLuz />}

        <motion.div
          className="container-page relative z-10 pb-24 pt-40"
          style={profundidade ? { opacity: textoOpacidade, y: textoY } : undefined}
        >
          {/* O texto espera junto com a imagem: título e descrição padrão de
              código também não são os que o lojista escreveu. A altura mínima da
              seção segura o layout, então nada pula quando o conteúdo entra. */}
          {!carregando && (
            <div className="max-w-3xl border-l-2 border-brand-yellow pl-7">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="mb-4 flex items-center gap-2.5"
              >
                <span className="h-px w-8 bg-brand-yellow" aria-hidden />
                <span className="font-display text-xs tracking-[0.4em] text-brand-yellow">{settings.heroEyebrow}</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-display text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.86] text-white"
              >
                {titleLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-6 max-w-md text-lg text-white/75"
              >
                {settings.heroDescription}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-9 flex flex-wrap items-center gap-5"
              >
                {isExternalCta ? (
                  <a href={settings.heroCtaUrl} target="_blank" rel="noreferrer" className="btn-accent group">
                    {settings.heroCtaLabel}
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                ) : (
                  <Link to={settings.heroCtaUrl} className="btn-accent group">
                    {settings.heroCtaLabel}
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Cartão flutuante de prova social — quebra o limite da foto para dar profundidade.
            Só aparece quando existe algum depoimento aprovado para sustentar a nota. */}
        {averageRating !== null && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute bottom-28 right-6 z-10 flex animate-float items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md"
          >
            <StarRating rating={averageRating} size={13} />
            <div className="h-8 w-px bg-white/20" aria-hidden />
            <div className="leading-tight">
              <p className="font-display text-sm text-white">{averageRating.toFixed(1).replace(".", ",")} / 5</p>
              <p className="text-[11px] text-white/60">Avaliação dos clientes</p>
            </div>
          </motion.div>
        )}

        {count > 1 && (
          <div className="absolute bottom-14 left-7 z-10 flex w-40 items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
              >
                {i === safeIndex ? (
                  <span
                    key={safeIndex}
                    className="block h-full w-full origin-left animate-[fill-bar_6s_linear] bg-brand-yellow motion-reduce:animate-none"
                  />
                ) : i < safeIndex ? (
                  <span className="block h-full w-full bg-brand-yellow/70" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        <a
          href="#categorias"
          aria-label="Rolar para baixo"
          className="absolute inset-x-0 bottom-5 z-10 mx-auto grid w-fit place-items-center text-white/60 transition-colors hover:text-brand-yellow"
        >
          <ChevronDown size={20} className="animate-bounce-slow motion-reduce:animate-none" aria-hidden />
        </a>
      </motion.div>
    </section>
  );
}
