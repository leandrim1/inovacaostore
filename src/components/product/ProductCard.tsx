import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "../../data/types";
import { PriceTag } from "../ui/PriceTag";
import { Badge } from "../ui/Badge";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const image = product.images[0];
  const availableVariant = product.variants.find((v) => v.stock > 0);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!availableVariant) return;
    addItem(product, {
      variantId: availableVariant.id,
      color: availableVariant.color,
      size: availableVariant.size,
    });
  }

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden border border-brand-ink/10 bg-white transition-colors duration-300 hover:border-brand-ink/25 hover:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.35)]"
    >
      <Link
        to={`/produto/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-neutral-100"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage label="Em breve" />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.tags?.map((tag) => <Badge key={tag} tag={tag} />)}
        </div>

        {availableVariant && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-brand-ink py-3 font-display text-xs tracking-[0.2em] text-white transition-transform duration-300 ease-out hover:bg-black group-hover:translate-y-0"
          >
            <ShoppingBag size={14} />
            Adicionar ao carrinho
          </button>
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
