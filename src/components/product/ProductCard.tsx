import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "../../data/types";
import { PriceTag } from "../ui/PriceTag";
import { Badge } from "../ui/Badge";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { PositionedImage } from "../ui/PositionedImage";
import { ArrowRight, Check, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { Tilt3D, TiltCamada } from "../ui/Tilt3D";
import { BotaoFavorito } from "../ui/BotaoFavorito";
import { useExperiencia3D } from "../../lib/experiencia3d";
import { focarCard, useCardEmFoco } from "../../lib/cardEmFoco";
import { celebrarAdicao } from "../../lib/vooAoCarrinho";

/**
 * Card de produto como um pequeno objeto físico.
 *
 * Toque (celular): tocar na foto "levanta" o card — ele sobe e inclina, a
 * sombra cresce, a peça sai da moldura e aparece o painel com "Ver produto"
 * e "Adicionar". Tocar de novo, fora dele ou rolar para longe devolve ao
 * plano. O nome continua sendo um link direto, e a sacola no canto abre a
 * escolha de tamanho sem passar pelo foco. Nada depende de hover.
 *
 * Mouse (computador): o card inclina sob o ponteiro, a foto afunda e troca
 * para o outro ângulo, e a barra "Adicionar ao carrinho" sobe no hover.
 *
 * Adicionar dispara a microinteração do carrinho (a foto voa até o ícone),
 * sem abrir a gaveta: a pessoa continua navegando.
 */
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const image = product.imageDetails[0];
  const outraFoto = product.imageDetails[1];
  const { inclinacao, toque, profundidade } = useExperiencia3D();
  const chave = useId();
  const focado = useCardEmFoco(chave);
  const cardRef = useRef<HTMLElement>(null);
  const fotoRef = useRef<HTMLDivElement>(null);
  // A segunda foto (outro ângulo da peça) só é baixada depois que o mouse
  // passa pelo card — e nunca no toque, onde não existe "passar por cima".
  const [mostrarOutra, setMostrarOutra] = useState(false);
  const hasStock = product.variants.some((v) => v.stock > 0);

  const [isPicking, setIsPicking] = useState(false);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [justAdded, setJustAdded] = useState(false);

  // Em foco: toque fora devolve o card ao plano, e ele também desce sozinho
  // se sair da tela pela rolagem.
  useEffect(() => {
    if (!focado) return;
    const el = cardRef.current;
    const fora = (e: PointerEvent) => {
      if (el && !el.contains(e.target as Node)) focarCard(null);
    };
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) focarCard(null);
    });
    document.addEventListener("pointerdown", fora);
    if (el) observador.observe(el);
    return () => {
      document.removeEventListener("pointerdown", fora);
      observador.disconnect();
    };
  }, [focado]);

  function openPicker(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setColor(product.colors[0]?.name ?? "");
    setIsPicking(true);
  }

  function closePicker(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsPicking(false);
  }

  function handlePickSize(e: MouseEvent, size: string) {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants.find((v) => v.color === color && v.size === size);
    if (!variant || variant.stock <= 0) return;
    addItem(product, { variantId: variant.id, color: variant.color, size: variant.size, abrirCarrinho: false });
    celebrarAdicao(fotoRef.current, {
      nome: product.name,
      imagem: image?.url,
      detalhe: [variant.size, product.colors.length > 1 ? variant.color : ""].filter(Boolean).join(" · "),
    });
    setIsPicking(false);
    focarCard(null);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  function tocarNaFoto(e: MouseEvent) {
    // No toque, a foto levanta o card em vez de navegar (o nome e o botão
    // "Ver produto" navegam). Com mouse, é o link de sempre.
    if (!toque || isPicking) return;
    e.preventDefault();
    focarCard(focado ? null : chave);
  }

  const levantado = toque && focado && !isPicking;

  return (
    // Com mouse, o card inclina sob o ponteiro, a foto "afunda" e gira um
    // pouco dentro da moldura e os selos vêm para frente. Parado enquanto o
    // seletor de tamanho está aberto, para os botões não andarem sob o cursor.
    <Tilt3D className="h-full rounded-2xl" max={6} sombra pausado={isPicking}>
      <motion.article
        ref={cardRef}
        whileHover={inclinacao ? { y: -6 } : undefined}
        whileTap={toque && !focado ? { scale: 0.975 } : undefined}
        animate={
          toque
            ? levantado
              ? { y: -10, scale: 1.03, rotateX: profundidade ? 5 : 0 }
              : { y: 0, scale: 1, rotateX: 0 }
            : undefined
        }
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        style={{ transformPerspective: 900 }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse" && outraFoto && inclinacao) setMostrarOutra(true);
        }}
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300 ${
          levantado
            ? "z-20 border-brand-ink/25 shadow-[0_34px_50px_-22px_rgba(0,0,0,0.6),0_8px_16px_-10px_rgba(0,0,0,0.3)]"
            : "border-brand-ink/10 hover:border-brand-ink/25"
        } ${inclinacao ? "" : levantado ? "" : "shadow-[0_10px_24px_-20px_rgba(0,0,0,0.5)]"}`}
      >
        {/* Área da foto: o link e, por cima dele (como irmãos — botão dentro de
            link não é HTML válido), favorito, adicionar, painel e tamanhos. */}
        <div className="relative overflow-hidden">
          <Link
            to={`/produto/${product.slug}`}
            onClick={tocarNaFoto}
            aria-expanded={toque ? focado : undefined}
            className="relative block aspect-[4/5] overflow-hidden bg-neutral-100 [-webkit-tap-highlight-color:transparent]"
          >
            {image ? (
              <TiltCamada className="absolute inset-0" profundidade={6} giro={4}>
                <motion.div
                  ref={fotoRef}
                  className="absolute inset-0"
                  animate={toque ? (levantado ? { scale: 1.1, y: -6 } : { scale: 1, y: 0 }) : undefined}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <PositionedImage
                    src={image.url}
                    alt={product.name}
                    loading="lazy"
                    desktopSettings={image.desktopSettings}
                    mobileSettings={image.mobileSettings}
                    className="transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {mostrarOutra && outraFoto && (
                    <PositionedImage
                      src={outraFoto.url}
                      alt=""
                      aria-hidden
                      desktopSettings={outraFoto.desktopSettings}
                      mobileSettings={outraFoto.mobileSettings}
                      wrapperClassName="absolute inset-0 h-full w-full"
                      className="scale-105 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                    />
                  )}
                </motion.div>
              </TiltCamada>
            ) : (
              <PlaceholderImage label="Em breve" />
            )}

            {/* Profundidade do fundo em foco: luz vindo de cima, chão escurecendo. */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(245,196,0,0.22),transparent_70%),linear-gradient(to_top,rgba(0,0,0,0.55),transparent_55%)] transition-opacity duration-300 ${
                levantado ? "opacity-100" : "opacity-0"
              }`}
            />

            <TiltCamada className="absolute left-3 top-3 flex flex-col gap-1.5" profundidade={-5}>
              {product.tags?.map((tag) => <Badge key={tag} tag={tag} />)}
            </TiltCamada>
          </Link>

          {/* Favoritar: sempre visível no toque; no computador aparece no hover
              (ou quando já está favoritado). */}
          <div
            className={`absolute right-1.5 top-1.5 z-[7] transition-opacity duration-200 ${
              toque ? "" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100 has-[[aria-pressed=true]]:opacity-100"
            }`}
          >
            <BotaoFavorito produtoId={product.id} nome={product.name} />
          </div>

          {/* Mouse: barra que sobe no hover. */}
          {!toque && hasStock && !isPicking && (
            <button
              type="button"
              onClick={openPicker}
              className="absolute inset-x-0 bottom-0 z-[5] flex h-11 translate-y-full items-center justify-center gap-2 bg-brand-ink font-display text-xs tracking-[0.2em] text-white opacity-0 transition-[transform,opacity] duration-300 ease-out hover:bg-black group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
            >
              {justAdded ? (
                <>
                  <Check size={14} /> Adicionado!
                </>
              ) : (
                <>
                  <ShoppingBag size={14} /> Adicionar ao carrinho
                </>
              )}
            </button>
          )}

          {/* Toque em foco: o painel de ações sobe de dentro da foto. */}
          <AnimatePresence>
            {levantado && (
              <motion.div
                initial={{ opacity: 0, y: 24, rotateX: -20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                style={{ transformPerspective: 600 }}
                className="vidro-escuro absolute inset-x-2 bottom-2 z-[8] flex gap-1.5 rounded-2xl p-1.5"
              >
                <Link
                  to={`/produto/${product.slug}`}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 font-display text-[11px] tracking-[0.14em] text-white active:scale-95"
                >
                  Ver <ArrowRight size={13} />
                </Link>
                {hasStock && (
                  <button
                    type="button"
                    onClick={openPicker}
                    className="flex min-h-11 flex-[1.3] items-center justify-center gap-1 rounded-xl bg-brand-yellow font-display text-[11px] tracking-[0.14em] text-brand-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_3px_0_#b08a00] active:translate-y-[2px] active:shadow-[0_1px_0_#b08a00]"
                  >
                    <Plus size={14} /> Sacola
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isPicking && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-x-0 bottom-0 z-[8] flex flex-col gap-2 bg-white/98 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] tracking-[0.2em] text-neutral-400">ESCOLHA O TAMANHO</span>
                  <button
                    type="button"
                    onClick={closePicker}
                    aria-label="Fechar"
                    className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink"
                  >
                    <X size={15} />
                  </button>
                </div>

                {product.colors.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setColor(c.name);
                        }}
                        title={c.name}
                        aria-label={`Cor ${c.name}`}
                        aria-pressed={color === c.name}
                        className={`h-7 w-7 shrink-0 rounded-full ring-2 ring-offset-1 transition-all ${
                          color === c.name ? "ring-brand-ink" : "ring-transparent hover:ring-black/20"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => {
                    const stock = product.variants.find((v) => v.color === color && v.size === s)?.stock ?? 0;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={(e) => handlePickSize(e, s)}
                        disabled={stock <= 0}
                        className={`flex min-w-10 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-all active:translate-y-[2px] ${
                          toque ? "h-10" : "h-8"
                        } ${
                          stock <= 0
                            ? "border-black/10 text-neutral-300 line-through"
                            : "border-black/15 bg-white text-neutral-700 shadow-[0_2px_0_rgba(10,10,10,0.12)] hover:border-brand-ink hover:bg-brand-ink hover:text-white active:shadow-none"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 border-t border-brand-ink/10 p-3 sm:p-4">
          <span className="text-[11px] uppercase tracking-wide text-neutral-400">{product.category}</span>
          <Link to={`/produto/${product.slug}`} className="font-medium leading-snug text-brand-ink hover:underline">
            {product.name}
          </Link>
          <div className="mt-auto flex items-end justify-between gap-2">
            {product.comingSoon ? (
              <span className="text-sm font-medium text-neutral-500">Em breve</span>
            ) : (
              <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
            )}
            {toque && hasStock && !isPicking && (
              <button
                type="button"
                onClick={openPicker}
                aria-label={`Adicionar ${product.name} ao carrinho`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-ink text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_0_#000,0_8px_14px_-8px_rgba(0,0,0,0.6)] transition-transform active:translate-y-[2px] active:shadow-[0_1px_0_#000]"
              >
                {justAdded ? <Check size={17} className="text-brand-yellow" /> : <ShoppingBag size={17} />}
              </button>
            )}
          </div>
        </div>
      </motion.article>
    </Tilt3D>
  );
}
