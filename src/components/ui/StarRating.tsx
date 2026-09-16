import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export function StarRating({ rating, reviewCount, size = 14 }: StarRatingProps) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < rounded ? "fill-brand-yellow text-brand-yellow" : "fill-neutral-200 text-neutral-200"}
          />
        ))}
      </div>
      <span className="sr-only">{rating} de 5 estrelas</span>
      {reviewCount !== undefined && (
        <span className="text-xs text-neutral-500">({reviewCount})</span>
      )}
    </div>
  );
}
