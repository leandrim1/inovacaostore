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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-white opacity-0 shadow-lg transition-all duration-300 hover:bg-brand-yellow hover:text-brand-ink group-hover:opacity-100"
          >
            <ShoppingBag size={16} />
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
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
