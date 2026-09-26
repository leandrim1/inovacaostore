import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteSettings, type Banner } from "../../hooks/useSiteSettings";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { PositionedImage } from "../ui/PositionedImage";
import { isDefaultImageSettings } from "../../lib/imageSettings";

/**
 * Faixa de imagens logo acima das Categorias.
 *
 * É um espaço só de arte: nada de título, destaque ou botão desenhados por
 * cima — o lojista sobe a peça pronta. As medidas são as mesmas do banner de
 * promoção (mesma altura, mesma largura de página, mesmos cantos), para
 * as duas faixas se lerem como irmãs e não como dois blocos diferentes.
 */
function BannerSlide({ banner }: { banner: Banner }) {
  const isMobile = useIsMobileViewport();
  // O enquadramento é salvo por breakpoint, então a decisão também é: o admin
  // pode ter recortado só para o computador e deixado o celular no natural.
  const enquadrado = !isDefaultImageSettings(
    isMobile ? banner.mobileSettings : banner.desktopSettings,
  );

  const arte = (
    <>
      {/* A peça quase nunca tem a proporção exata da tela. Em vez de cortar a
          arte (o que o lojista não quer) ou deixar tarjas pretas, as sobras são
          preenchidas com a própria imagem desfocada — a peça aparece inteira e
          o bloco continua parecendo intencional. Com enquadramento salvo não há
          sobra, então o fundo não entra. */}
      {!enquadrado && (
        <img
          src={banner.url}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
        />
      )}
      {/* Com recorte salvo a imagem vira camada absoluta e não empurra mais a
          caixa. Esta cópia invisível fica no fluxo só para dar à caixa a
          proporção do arquivo: o quadro fixo (retrato no celular, deitado no
          computador) decapitaria a peça antes de o zoom do lojista entrar. */}
      {enquadrado && (
        <img src={banner.url} alt="" aria-hidden className="invisible block h-auto max-h-[70vh] w-full" />
      )}
      <PositionedImage
        src={banner.url}
        alt=""
        desktopSettings={banner.desktopSettings}
        mobileSettings={banner.mobileSettings}
        // Sem enquadramento salvo, a arte manda na altura: a imagem entra
        // inteira, na proporção original, seja no celular ou no computador.
        // Com enquadramento, vale o recorte que o admin escolheu.
        wrapperClassName={enquadrado ? "absolute inset-0 h-full w-full" : "relative block w-full"}
        fallbackClassName="h-auto max-h-[70vh] object-contain"
      />
    </>
  );

  // A caixa sempre encolhe até a arte — sem recorte é a própria imagem que a
  // define; com recorte, a cópia invisível acima. Nada de quadro fixo: era ele
  // que mudava o formato entre celular e computador e cortava a peça.
  const caixa = "relative block w-full overflow-hidden rounded-[3px] bg-brand-ink";

  if (!banner.linkUrl) {
    return <div className={caixa}>{arte}</div>;
  }

  // Com link, a imagem inteira é o alvo — é o que se espera de uma peça
  // publicitária, e aqui não existe botão para clicar.
  const isExternal = /^https?:\/\//.test(banner.linkUrl);
  return isExternal ? (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Ver a oferta"
      className={`${caixa} cursor-pointer`}
    >
      {arte}
    </a>
  ) : (
    <Link to={banner.linkUrl} aria-label="Ver a oferta" className={`${caixa} cursor-pointer`}>
      {arte}
    </Link>
  );
}

export function Banners() {
  const { data: settings } = useSiteSettings();
  const banners = settings.banners ?? [];
  const [index, setIndex] = useState(0);

  const count = banners.length;
  const safeIndex = index < count ? index : 0;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(timer);
  }, [count]);

  // Sem imagem cadastrada a seção inteira some — nada de espaço vazio na home.
  if (count === 0) return null;

  const atual = banners[safeIndex];

  return (
    <section className="py-10 sm:py-14">
      <div className="container-page">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={atual.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BannerSlide banner={atual} />
            </motion.div>
          </AnimatePresence>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
                aria-label="Imagem anterior"
                className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white text-brand-ink transition-colors hover:bg-neutral-200"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % count)}
                aria-label="Próxima imagem"
                className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white text-brand-ink transition-colors hover:bg-neutral-200"
              >
                <ChevronRight size={18} />
              </button>

              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    aria-current={i === safeIndex}
                    className="flex h-6 w-7 items-center"
                  >
                    <span className={`block h-0.5 w-full transition-colors ${i === safeIndex ? "bg-white" : "bg-white/40"}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
