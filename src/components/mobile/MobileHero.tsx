import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftRight, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useArrastoInercial } from "../../hooks/useArrastoInercial";
import { useElementAspectRatio } from "../../hooks/useElementAspectRatio";
import { useExperiencia3D } from "../../lib/experiencia3d";
import { inclinacaoX, inclinacaoY, useSensorInclinacao } from "../../lib/sensorInclinacao";
import { DEFAULT_IMAGE_SETTINGS, totalScale } from "../../lib/imageSettings";
import type { DadosDoHero } from "../../hooks/useDadosDoHero";
import { CenaDoHero } from "../3d/CenaDoHero";
import { ProdutoCSS } from "../3d/ProdutoCSS";
import { paraVitrine, type ProdutoVitrine } from "../3d/qualidade";
import { Button3D } from "../ui/Button3D";

const CHAVE_DICA = "inovacao:dica-arraste";

/**
 * Hero do celular — composição vertical pensada para uma mão:
 *
 *   foto do painel de ponta a ponta, escurecida (é a campanha da loja)
 *   palco     ~40–55% da tela: o produto em destaque pendurado no cabide
 *             amarelo; o dedo gira de lado (com inércia) para ver as costas,
 *             tocar abre o produto
 *   etiqueta  nome e preço da peça, e a troca entre os destaques
 *   texto     sobretítulo, título e descrição do painel
 *   CTA       botão largo, ao alcance do polegar
 *
 * O 3D aqui tem um trabalho só: mostrar a peça de frente e de costas. Nada
 * flutua, brilha ou se mexe sozinho. O gesto vertical sempre rola a página:
 * só o arrasto de lado gira o produto.
 */
export function MobileHero({ dados }: { dados: DadosDoHero }) {
  const { settings, carregando, slides, count, safeIndex, setIndex, currentSlide, isExternalCta, titleLines } = dados;
  const secaoRef = useRef<HTMLElement>(null);
  const fotoRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { nivel, toque, reduzido } = useExperiencia3D();
  // Inclinação do celular: um toque de realismo onde o aparelho libera o
  // sensor sem pedir (Android). No iPhone, que exige um botão de permissão só
  // para isso, a peça simplesmente fica parada — o arrasto é o que importa.
  useSensorInclinacao(toque && !reduzido);

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
      <ArrowRight size={18} className="transition-transform duration-200 group-active:translate-x-0.5" />
    </>
  );

  return (
    <section ref={secaoRef} data-hero data-cabecalho-escuro className="relative -mt-16 sm:-mt-20">
      <div className="relative flex min-h-[calc(100svh-36px-var(--barra-inferior))] flex-col overflow-hidden bg-brand-ink pt-16 sm:pt-20">
        {/* A foto do painel, nítida e escurecida: a campanha fica de fundo e a
            peça em destaque, na frente, é o que o olho encontra primeiro. */}
        <div ref={fotoRef} aria-hidden className="absolute inset-0">
          <AnimatePresence>
            {!carregando && (
              <motion.img
                key={currentSlide.id}
                src={currentSlide.url}
                alt="Amigos vestindo peças da Inovação Store"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  objectPosition: `${ajuste.positionX}% ${ajuste.positionY}%`,
                  scale: zoom,
                  rotate: ajuste.rotation,
                }}
                fetchPriority={safeIndex === 0 ? "high" : undefined}
              />
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent via-black/70 to-black" />
        </div>

        {count > 1 && (
          <div className="relative z-20 mx-5 flex gap-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                className="-my-1.5 flex h-10 flex-1 items-center"
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

        {/* Palco. `pan-y`: o gesto vertical é do navegador (rola a página). */}
        <div
          className="relative z-[5] min-h-[34svh] flex-1 select-none [-webkit-touch-callout:none]"
          style={{ touchAction: "pan-y" }}
          {...arrasto.handlers}
        >
          {produto && (
            <>
              <div
                aria-hidden
                className={`absolute inset-x-0 bottom-1 top-[7%] transition-opacity duration-500 ${mostrarCena ? "opacity-0" : "opacity-100"}`}
              >
                <ProdutoCSS produto={produto} rotacao={arrasto.valor} giroX={inclinacaoX} giroY={inclinacaoY} />
              </div>
              {nivel !== "baixo" && (
                <div
                  aria-hidden
                  className={`absolute inset-0 transition-opacity duration-500 ${mostrarCena ? "opacity-100" : "opacity-0"}`}
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

              {/* Dica de gesto: some no primeiro arrasto, sozinha depois de
                  alguns segundos, e não volta na mesma sessão. */}
              <AnimatePresence>
                {!jaArrastou && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 1, duration: 0.3 }}
                    className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5 text-xs text-white/70"
                  >
                    <ArrowLeftRight size={13} aria-hidden />
                    Arraste para ver as costas
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Etiqueta da peça: nome, preço e a troca entre os destaques. Toques
            aqui são dos botões e do link — não viram "tocar no produto". */}
        {produto && (
          <div className="relative z-10 flex items-end justify-between gap-3 px-5 pt-2" onPointerDown={(e) => e.stopPropagation()}>
            <Link to={`/produto/${produto.slug}`} className="min-w-0 py-1">
              <span className="block truncate text-[13px] font-medium text-white/85">{produto.nome}</span>
              <span className="mt-1 inline-block bg-brand-yellow px-1.5 py-0.5 text-[13px] font-bold leading-tight text-brand-ink">
                {produto.preco}
              </span>
            </Link>
            {produtos.length > 1 && (
              <div className="flex shrink-0 items-center text-white">
                <span className="mr-1.5 text-xs tabular-nums text-white/50">
                  {(indice % produtos.length) + 1}/{produtos.length}
                </span>
                <button
                  type="button"
                  onClick={() => trocarProduto(-1)}
                  aria-label="Produto anterior"
                  className="grid h-11 w-11 place-items-center border border-white/20 active:bg-white/10"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => trocarProduto(1)}
                  aria-label="Próximo produto"
                  className="-ml-px grid h-11 w-11 place-items-center border border-white/20 active:bg-white/10"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Texto e CTA — ao alcance do polegar. */}
        <div className="relative z-10 px-5 pb-5 pt-5 [@media(max-height:740px)]:pb-4 [@media(max-height:740px)]:pt-3">
          {!carregando && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/55 [@media(max-height:740px)]:hidden">
                {settings.heroEyebrow}
              </p>
              <h1 className="mt-1.5 font-display text-[clamp(2.3rem,11.5vw,3.5rem)] leading-[0.86] text-white [@media(max-height:740px)]:mt-0 [@media(max-height:740px)]:text-[clamp(2rem,9.5vw,2.75rem)]">
                {titleLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <p className="mt-2.5 max-w-[34ch] text-[15px] leading-snug text-white/70 [@media(max-height:740px)]:line-clamp-2 [@media(max-height:740px)]:text-sm">
                {settings.heroDescription}
              </p>
              <div className="mt-5 [@media(max-height:740px)]:mt-3.5">
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
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
