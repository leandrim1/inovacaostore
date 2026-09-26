import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Hand, Smartphone } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useArrastoInercial } from "../../hooks/useArrastoInercial";
import { useElementAspectRatio } from "../../hooks/useElementAspectRatio";
import { comPerspectiva, useExperiencia3D } from "../../lib/experiencia3d";
import { inclinacaoX, inclinacaoY, pedirPermissao, useSensorInclinacao } from "../../lib/sensorInclinacao";
import { DEFAULT_IMAGE_SETTINGS, totalScale } from "../../lib/imageSettings";
import type { DadosDoHero } from "../../hooks/useDadosDoHero";
import { CenaDoHero } from "../3d/CenaDoHero";
import { ProdutoCSS } from "../3d/ProdutoCSS";
import { paraVitrine, type ProdutoVitrine } from "../3d/qualidade";
import { Button3D } from "../ui/Button3D";
import { GlassPanel } from "../ui/GlassPanel";

const PERSPECTIVA = comPerspectiva(1200);
const CHAVE_DICA = "inovacao:dica-arraste";

/**
 * Hero do celular — composição vertical pensada para uma mão:
 *
 *   header de vidro (sobre a foto)
 *   palco 3D  ~40–55% da tela: um produto em destaque flutuando no cabide,
 *             que o dedo gira de lado (com inércia) e o giroscópio inclina;
 *             tocar abre o produto
 *   texto     eyebrow, título e descrição do painel
 *   CTA       botão grande, ao alcance do polegar
 *
 * A foto do hero (do painel) vira o fundo do palco, escurecida, com parallax
 * pelo giroscópio. O gesto vertical sempre rola a página: só o arrasto de
 * lado gira o produto.
 */
export function MobileHero({ dados }: { dados: DadosDoHero }) {
  const { settings, carregando, slides, count, safeIndex, setIndex, currentSlide, isExternalCta, titleLines } = dados;
  const secaoRef = useRef<HTMLElement>(null);
  const fotoRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { nivel, toque, reduzido, profundidade } = useExperiencia3D();
  const sensor = useSensorInclinacao(toque && !reduzido);

  const { data: destaques = [] } = useProducts({ featured: true, limit: 8 });
  const produtos = useMemo(
    () => destaques.map(paraVitrine).filter((p): p is ProdutoVitrine => p !== null).slice(0, 3),
    [destaques],
  );
  const [indice, setIndice] = useState(0);
  const produto = produtos.length ? produtos[indice % produtos.length] : undefined;
  const [cenaPronta, setCenaPronta] = useState(false);
  // Se a cena cair para o nível "baixo" (FPS, memória), a versão em CSS volta.
  const mostrarCena = cenaPronta && nivel !== "baixo";
  const [jaArrastou, setJaArrastou] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_DICA) === "1";
    } catch {
      return false;
    }
  });

  // A dica também sai sozinha: quem já entendeu não precisa dela na cara.
  useEffect(() => {
    if (jaArrastou) return;
    const t = setTimeout(() => setJaArrastou(true), 6500);
    return () => clearTimeout(t);
  }, [jaArrastou]);

  const abrirProduto = () => {
    if (produto) navigate(`/produto/${produto.slug}`);
  };
  const arrasto = useArrastoInercial({ limite: 0.75, sensibilidade: 0.011, onToque: abrirProduto });

  useEffect(
    () =>
      arrasto.arrastando.on("change", (v) => {
        if (v !== 1) return;
        setJaArrastou(true);
        try {
          sessionStorage.setItem(CHAVE_DICA, "1");
        } catch {
          // sem armazenamento: a dica só volta na próxima visita
        }
      }),
    [arrasto.arrastando],
  );

  const entradas = useMemo(
    () => ({ rotacao: arrasto.valor, arrastando: arrasto.arrastando, giroX: inclinacaoX, giroY: inclinacaoY }),
    [arrasto.valor, arrasto.arrastando],
  );

  // Fundo: a foto anda ao contrário da inclinação (é a camada mais distante).
  const fotoX = useTransform(inclinacaoX, (v) => v * -12);
  const fotoY = useTransform(inclinacaoY, (v) => v * -9);

  // Saída com profundidade: o palco recua e o texto se apaga ao rolar.
  const { scrollYProgress } = useScroll({ target: secaoRef, offset: ["start start", "end start"] });
  const palcoEscala = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const palcoGiro = useTransform(scrollYProgress, [0, 1], [0, 6]);
  const textoOpacidade = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const aspecto = useElementAspectRatio(fotoRef, 9 / 16);
  const ajuste = currentSlide.mobileSettings ?? DEFAULT_IMAGE_SETTINGS;
  const zoom = totalScale(ajuste, aspecto);

  function trocarProduto(passo: number) {
    if (produtos.length < 2) return;
    setIndice((i) => (i + passo + produtos.length) % produtos.length);
    arrasto.voltarAoInicio(false);
  }

  const cta = (
    <>
      {settings.heroCtaLabel}
      <ArrowRight size={18} className="transition-transform duration-300 group-active:translate-x-1" />
    </>
  );

  return (
    <section ref={secaoRef} data-hero data-cabecalho-escuro className="relative -mt-16 sm:-mt-20">
      <motion.div
        className="relative flex min-h-[calc(100svh-36px-var(--barra-inferior))] flex-col overflow-hidden bg-brand-ink pt-16 sm:pt-20"
        transformTemplate={PERSPECTIVA}
        style={profundidade ? { scale: palcoEscala, rotateX: palcoGiro, transformOrigin: "50% 100%" } : undefined}
      >
        {/* Camada de fundo: a foto do painel. */}
        <motion.div
          ref={fotoRef}
          aria-hidden
          className="absolute -inset-4"
          style={profundidade ? { x: fotoX, y: fotoY } : undefined}
        >
          <AnimatePresence>
            {!carregando && (
              <motion.img
                key={currentSlide.id}
                src={currentSlide.url}
                alt="Amigos vestindo peças da Inovação Store"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.42 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover blur-[2px]"
                style={{
                  objectPosition: `${ajuste.positionX}% ${ajuste.positionY}%`,
                  scale: zoom,
                  rotate: ajuste.rotation,
                }}
                fetchPriority={safeIndex === 0 ? "high" : undefined}
              />
            )}
          </AnimatePresence>
        </motion.div>
        {/* Ambiente: vinheta, brilho amarelo atrás do produto e o chão escuro sob o texto. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_38%_at_50%_42%,rgba(245,196,0,0.22),transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black" />

        {count > 1 && (
          <div className="relative z-20 mx-4 flex gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                className="flex h-8 flex-1 items-center"
              >
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-white/25">
                  {i === safeIndex ? (
                    <span
                      key={safeIndex}
                      className="block h-full w-full origin-left animate-[fill-bar_6s_linear] bg-brand-yellow motion-reduce:animate-none"
                    />
                  ) : i < safeIndex ? (
                    <span className="block h-full w-full bg-brand-yellow/70" />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Palco 3D. `pan-y`: o gesto vertical é do navegador (rola a página). */}
        <div
          className="relative z-[5] min-h-[34svh] flex-1 select-none [-webkit-touch-callout:none]"
          style={{ touchAction: "pan-y" }}
          {...arrasto.handlers}
        >
          {produto && (
            <>
              <div
                aria-hidden
                className={`absolute inset-x-0 bottom-11 top-[7%] transition-opacity duration-700 ${mostrarCena ? "opacity-0" : "opacity-100"}`}
              >
                <ProdutoCSS
                  produto={produto}
                  rotacao={arrasto.valor}
                  giroX={inclinacaoX}
                  giroY={inclinacaoY}
                  flutuar={!reduzido}
                />
              </div>
              {nivel !== "baixo" && (
                <div
                  aria-hidden
                  className={`absolute inset-x-0 bottom-9 top-0 transition-opacity duration-700 ${mostrarCena ? "opacity-100" : "opacity-0"}`}
                >
                  <CenaDoHero
                    layout="vertical"
                    area={secaoRef}
                    produtos={[produto]}
                    entradas={entradas}
                    onEscolher={abrirProduto}
                    crescer={indice !== 0}
                    onPronto={() => setCenaPronta(true)}
                    onFalha={() => setCenaPronta(false)}
                  />
                </div>
              )}

              {/* Dica de gesto sobre o produto (padrão dos visualizadores 3D): some
                  no primeiro arrasto, sozinha depois de alguns segundos, e não
                  volta na mesma sessão. */}
              <AnimatePresence>
                {!jaArrastou && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                    className="pointer-events-none absolute left-1/2 top-[58%] z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-3.5 py-2 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md"
                  >
                    <Hand size={14} className="animate-arraste text-brand-yellow motion-reduce:animate-none" aria-hidden />
                    Arraste para explorar
                  </motion.div>
                )}
              </AnimatePresence>

              {sensor === "precisa-permissao" && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => pedirPermissao()}
                  className="absolute right-3 top-2 z-10 flex h-11 items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 text-[11px] font-medium text-white/85 backdrop-blur-md"
                >
                  <Smartphone size={14} className="text-brand-yellow" aria-hidden />
                  Movimento
                </button>
              )}

              {/* Etiqueta do produto no palco: nome, preço e troca entre os destaques. */}
              {/* Toques aqui são dos botões e do link — não viram "tocar no produto". */}
              <div className="absolute inset-x-3 bottom-0 z-10 flex justify-center" onPointerDown={(e) => e.stopPropagation()}>
                <GlassPanel className="flex max-w-full items-center rounded-full p-1">
                  {produtos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => trocarProduto(-1)}
                      aria-label="Produto anterior"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full active:bg-white/10"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <Link to={`/produto/${produto.slug}`} className="min-w-0 px-2 py-1 text-center leading-tight">
                    <span className="block max-w-[52vw] truncate font-display text-[13px] tracking-[0.12em]">{produto.nome}</span>
                    <span className="block text-xs font-semibold text-brand-yellow">{produto.preco}</span>
                  </Link>
                  {produtos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => trocarProduto(1)}
                      aria-label="Próximo produto"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full active:bg-white/10"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </GlassPanel>
              </div>
            </>
          )}
        </div>

        {/* Texto e CTA — mais perto do visitante, ao alcance do polegar. */}
        <motion.div
          className="relative z-10 px-5 pb-5 pt-3 [@media(max-height:740px)]:pb-4 [@media(max-height:740px)]:pt-2"
          style={profundidade ? { opacity: textoOpacidade } : undefined}
        >
          {!carregando && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mb-2 flex items-center gap-2.5 [@media(max-height:740px)]:hidden"
              >
                <span className="h-px w-7 bg-brand-yellow" aria-hidden />
                <span className="font-display text-[11px] tracking-[0.38em] text-brand-yellow">{settings.heroEyebrow}</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="font-display text-[clamp(2.1rem,10vw,3.3rem)] leading-[0.9] text-white [@media(max-height:740px)]:text-[clamp(1.9rem,8.6vw,2.6rem)]"
              >
                {titleLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-2.5 text-[15px] leading-snug text-white/75 [@media(max-height:740px)]:line-clamp-2 [@media(max-height:740px)]:text-sm"
              >
                {settings.heroDescription}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-5 [@media(max-height:740px)]:mt-3.5"
              >
                {isExternalCta ? (
                  <a
                    href={settings.heroCtaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-accent btn-3d-accent group min-h-[52px] w-full text-[15px]"
                  >
                    {cta}
                  </a>
                ) : (
                  <Button3D to={settings.heroCtaUrl} tamanho="lg" className="group w-full">
                    {cta}
                  </Button3D>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
