import { formatBRL, discountPercent } from "../../lib/format";

interface PriceTagProps {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "lg";
}

export function PriceTag({ price, compareAtPrice, size = "sm" }: PriceTagProps) {
  const percent = discountPercent(price, compareAtPrice);
  const priceClass = size === "lg" ? "text-3xl" : "text-lg";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`font-display tracking-wide text-brand-ink ${priceClass}`}>
        {formatBRL(price)}
      </span>
      {percent > 0 && compareAtPrice && (
        <>
          <span className="text-sm text-neutral-400 line-through">
            {formatBRL(compareAtPrice)}
          </span>
          <span className="rounded-[2px] bg-brand-yellow px-1.5 py-0.5 text-xs font-bold text-brand-ink">
            -{percent}%
          </span>
        </>
      )}
    </div>
  );
}
