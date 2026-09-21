import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "../../data/types";
import { PriceTag } from "../ui/PriceTag";
import { Badge } from "../ui/Badge";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { PositionedImage } from "../ui/PositionedImage";
import { Check, ShoppingBag, X } from "lucide-react";
import { useCart } from "../../context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const image = product.imageDetails[0];
  const hasStock = product.variants.some((v) => v.stock > 0);

  const [isPicking, setIsPicking] = useState(false);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [justAdded, setJustAdded] = useState(false);

  function openPicker(e: React.MouseEvent) {
    e.preventDefault();
    setColor(product.colors[0]?.name ?? "");
    setIsPicking(true);
  }

  function closePicker(e: React.MouseEvent) {
    e.preventDefault();
    setIsPicking(false);
  }

  function handlePickSize(e: React.MouseEvent, size: string) {
    e.preventDefault();
    const variant = product.variants.find((v) => v.color === color && v.size === size);
    if (!variant || variant.stock <= 0) return;
    addItem(product, { variantId: variant.id, color: variant.color, size: variant.size });
    setIsPicking(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-ink/10 bg-white transition-colors duration-300 hover:border-brand-ink/25 hover:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.35)]"
    >
      <Link
        to={`/produto/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-neutral-100"
      >
        {image ? (
          <PositionedImage
            src={image.url}
            alt={product.name}
            loading="lazy"
            desktopSettings={image.desktopSettings}
            mobileSettings={image.mobileSettings}
            // A foto do produto aparece inteira: cortar para caber no card
            // esconde justamente a peça que o cliente quer ver.
            uncropped
            fallbackClassName="h-full w-full object-contain"
            className="transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage label="Em breve" />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.tags?.map((tag) => <Badge key={tag} tag={tag} />)}
        </div>

        {hasStock && !isPicking && (
          <button
            type="button"
            onClick={openPicker}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-brand-ink py-3 font-display text-xs tracking-[0.2em] text-white transition-transform duration-300 ease-out hover:bg-black group-hover:translate-y-0"
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

        {isPicking && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-white/98 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="font-display text-[10px] tracking-[0.2em] text-neutral-400">
                ESCOLHA O TAMANHO
              </span>
              <button
                type="button"
                onClick={closePicker}
                aria-label="Fechar"
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink"
              >
                <X size={14} />
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
                      setColor(c.name);
                    }}
                    title={c.name}
                    aria-pressed={color === c.name}
                    className={`h-6 w-6 shrink-0 rounded-full ring-2 ring-offset-1 transition-all ${
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
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors ${
                      stock <= 0
                        ? "border-black/10 text-neutral-300 line-through"
                        : "border-black/15 text-neutral-700 hover:border-brand-ink hover:bg-brand-ink hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-brand-ink/10 p-4">
        <span className="text-[11px] uppercase tracking-wide text-neutral-400">
          {product.category}
        </span>
        <Link to={`/produto/${product.slug}`} className="font-medium leading-snug text-brand-ink hover:underline">
          {product.name}
        </Link>
        {product.comingSoon ? (
          <span className="text-sm font-medium text-neutral-500">Em breve</span>
        ) : (
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
        )}
      </div>
    </motion.article>
  );
}
