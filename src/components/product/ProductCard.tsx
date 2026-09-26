import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "../../data/types";
import { PriceTag } from "../ui/PriceTag";
import { Badge } from "../ui/Badge";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { PositionedImage } from "../ui/PositionedImage";
import { Check, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCategories } from "../../hooks/useCategories";
import { BotaoFavorito } from "../ui/BotaoFavorito";
import { useExperiencia3D } from "../../lib/experiencia3d";
import { focarCard, useCardEmFoco } from "../../lib/cardEmFoco";
import { celebrarAdicao } from "../../lib/vooAoCarrinho";

/**
 * Card de produto no desenho de catálogo de moda: a foto manda, sem caixa
 * em volta; nome e preço logo abaixo, alinhados à esquerda.
 *
 * Toque (celular): tocar na foto destaca a peça — ela sobe alguns pixels,
 * ganha sombra e mostra a faixa "Ver produto | + Sacola" na base da foto.
 * Tocar de novo, fora dela ou rolar para longe devolve ao normal. O nome
 * continua sendo um link direto, e a sacola ao lado do preço abre a escolha
 * de tamanho sem passar pelo destaque. Nada depende de hover.
 *
 * Mouse (computador): a foto troca para o outro ângulo da peça e a faixa
 * "Adicionar ao carrinho" sobe no hover.
 *
 * Adicionar dispara a microinteração do carrinho (a foto voa até o ícone),
 * sem abrir a gaveta: a pessoa continua navegando.
 */
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  // O produto traz só o slug da categoria ("calcas"); o nome ("Calças") vem da
  // lista de categorias, que já está em cache (header, menu, home).
  const { data: categorias } = useCategories();
  const nomeCategoria = categorias?.find((c) => c.slug === product.category)?.name;
  const image = product.imageDetails[0];
  const outraFoto = product.imageDetails[1];
  const { inclinacao, toque } = useExperiencia3D();
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
    // No toque, a foto destaca a peça em vez de navegar (o nome e o botão
    // "Ver produto" navegam). Com mouse, é o link de sempre.
    if (!toque || isPicking) return;
    e.preventDefault();
    focarCard(focado ? null : chave);
  }

  const levantado = toque && focado && !isPicking;

  return (
    <article
      ref={cardRef}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && outraFoto && inclinacao) setMostrarOutra(true);
      }}
      className={`group relative flex h-full flex-col ${levantado ? "z-20" : ""}`}
    >
      {/* Área da foto: o link e, por cima dele (como irmãos — botão dentro de
          link não é HTML válido), favorito, adicionar, faixa de ações e tamanhos. */}
      <motion.div
        animate={toque ? { y: levantado ? -4 : 0 } : undefined}
        whileTap={toque && !focado ? { scale: 0.985 } : undefined}
        transition={{ type: "spring", stiffness: 480, damping: 34 }}
        className={`relative overflow-hidden rounded-[3px] bg-neutral-100 transition-shadow duration-200 ${
          levantado ? "shadow-[0_18px_30px_-18px_rgba(0,0,0,0.6)]" : ""
        }`}
      >
        <Link
          to={`/produto/${product.slug}`}
          onClick={tocarNaFoto}
          aria-expanded={toque ? focado : undefined}
          className="relative block aspect-[4/5] overflow-hidden [-webkit-tap-highlight-color:transparent]"
        >
          {image ? (
            <div ref={fotoRef} className="absolute inset-0">
              <PositionedImage
                src={image.url}
                alt={product.name}
                loading="lazy"
                desktopSettings={image.desktopSettings}
                mobileSettings={image.mobileSettings}
                className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              {mostrarOutra && outraFoto && (
                <PositionedImage
                  src={outraFoto.url}
                  alt=""
                  aria-hidden
                  desktopSettings={outraFoto.desktopSettings}
                  mobileSettings={outraFoto.mobileSettings}
                  wrapperClassName="absolute inset-0 h-full w-full"
                  className="scale-[1.03] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                />
              )}
            </div>
          ) : (
            <PlaceholderImage label="Em breve" />
          )}

          {product.tags && product.tags.length > 0 && (
            <span className="absolute left-2 top-2 flex flex-col items-start gap-1">
              {product.tags.map((tag) => (
                <Badge key={tag} tag={tag} />
              ))}
            </span>
          )}
        </Link>

        {/* Favoritar: sempre visível no toque; no computador aparece no hover
            (ou quando já está favoritado). */}
        <div
          className={`absolute right-0.5 top-0.5 z-[7] transition-opacity duration-200 ${
            toque ? "" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100 has-[[aria-pressed=true]]:opacity-100"
          }`}
        >
          <BotaoFavorito produtoId={product.id} nome={product.name} />
        </div>

        {/* Mouse: faixa que sobe no hover. */}
        {!toque && hasStock && !isPicking && (
          <button
            type="button"
            onClick={openPicker}
            className="absolute inset-x-0 bottom-0 z-[5] flex h-11 translate-y-full items-center justify-center gap-2 bg-brand-ink font-display text-[13px] tracking-[0.12em] text-white transition-transform duration-200 ease-out hover:bg-black group-hover:translate-y-0 focus-visible:translate-y-0"
          >
            {justAdded ? (
              <>
                <Check size={14} /> Adicionado
              </>
            ) : (
              <>
                <Plus size={14} /> Adicionar ao carrinho
              </>
            )}
          </button>
        )}

        {/* Toque em destaque: a faixa de ações ocupa a base da foto. */}
        <AnimatePresence>
          {levantado && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 z-[8] flex"
            >
              <Link
                to={`/produto/${product.slug}`}
                className="flex min-h-12 flex-1 items-center justify-center gap-1 bg-white font-display text-[13px] tracking-[0.1em] text-brand-ink active:bg-neutral-100"
              >
                Ver produto
              </Link>
              {hasStock && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="flex min-h-12 flex-1 items-center justify-center gap-1 bg-brand-yellow font-display text-[13px] tracking-[0.1em] text-brand-ink active:bg-brand-yellow-dark"
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 z-[8] flex flex-col gap-2 border-t border-black/10 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">Escolha o tamanho</span>
                <button
                  type="button"
                  onClick={closePicker}
                  aria-label="Fechar"
                  className="-mr-2 grid h-9 w-9 place-items-center text-neutral-400 hover:text-brand-ink"
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
                      className={`h-7 w-7 shrink-0 rounded-full border border-black/10 ring-1 ring-offset-2 transition-shadow ${
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
                      className={`flex min-w-10 items-center justify-center rounded-[2px] border px-2 text-xs font-semibold transition-colors ${
                        toque ? "h-10" : "h-8"
                      } ${
                        stock <= 0
                          ? "border-black/10 text-neutral-300 line-through"
                          : "border-black/20 bg-white text-neutral-800 hover:border-brand-ink hover:bg-brand-ink hover:text-white active:bg-brand-ink active:text-white"
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
      </motion.div>

      <div className="flex flex-1 flex-col pt-2.5">
        <Link to={`/produto/${product.slug}`} className="line-clamp-2 text-[14px] font-medium leading-snug text-brand-ink hover:underline">
          {product.name}
        </Link>
        {nomeCategoria && <span className="mt-0.5 text-xs text-neutral-500">{nomeCategoria}</span>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
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
              className="-mr-1.5 grid h-11 w-11 shrink-0 place-items-center text-brand-ink active:scale-90"
            >
              <span className="grid h-9 w-9 place-items-center rounded-[3px] border border-brand-ink/20 bg-white">
                {justAdded ? <Check size={16} /> : <ShoppingBag size={16} strokeWidth={1.8} />}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
