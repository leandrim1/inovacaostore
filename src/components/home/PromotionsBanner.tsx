import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { usePromotions, type Promotion } from "../../hooks/usePromotions";
import { useCountdown } from "../../hooks/useCountdown";

function CountdownBadge({ endsAt }: { endsAt: string | null }) {
  const parts = useCountdown(endsAt);
  if (!parts || parts.expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const label = parts.days > 0 ? `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}` : `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;

  return (
    <div className="flex w-fit items-center gap-2 border border-white/20 bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
      <Clock size={16} className="text-brand-yellow" />
      <span className="tabular-nums">{label}</span>
    </div>
  );
}

function PromotionSlide({ promotion }: { promotion: Promotion }) {
  const isExternal = /^https?:\/\//.test(promotion.ctaUrl);

  return (
    <div className="relative flex min-h-[420px] items-center overflow-hidden sm:min-h-[480px]">
      {promotion.imageUrl ? (
        <img
          src={promotion.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-ink">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,rgba(245,196,0,0.35),transparent_65%)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />

      <div className="container-page relative z-10 flex flex-col gap-4 py-14">
        {promotion.endsAt && (
          <div className="flex justify-end sm:absolute sm:right-6 sm:top-6">
            <CountdownBadge endsAt={promotion.endsAt} />
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <span className="h-px w-8 bg-brand-yellow" aria-hidden />
          <span className="font-display text-xs tracking-[0.4em] text-brand-yellow">Oferta</span>
        </div>
        <p className="font-display text-2xl tracking-wide text-white sm:text-3xl">
          {promotion.title}
        </p>
        <p className="font-display text-6xl leading-none text-brand-yellow sm:text-8xl">
          {promotion.highlight}
        </p>
        {promotion.description && (
          <p className="max-w-md text-sm text-white/80 sm:text-base">{promotion.description}</p>
        )}

        {isExternal ? (
          <a
            href={promotion.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-accent mt-2 w-fit"
          >
            {promotion.ctaLabel}
            <ArrowRight size={16} />
          </a>
        ) : (
          <Link to={promotion.ctaUrl} className="btn-accent mt-2 w-fit">
            {promotion.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function PromotionsBanner() {
  const { data: promotions = [] } = usePromotions();
  const [index, setIndex] = useState(0);

  const count = promotions.length;
  const safeIndex = index < count ? index : 0;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const current = promotions[safeIndex];

  return (
    <section className="bg-brand-ink py-10 sm:py-14">
      <div className="container-page">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PromotionSlide promotion={current} />
            </motion.div>
          </AnimatePresence>

          {count > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
                aria-label="Promoção anterior"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md transition-transform hover:scale-105"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex w-28 items-center gap-1.5">
                {promotions.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ver promoção ${i + 1}`}
                    className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
                  >
                    {i === safeIndex ? (
                      <span
                        key={safeIndex}
                        className="block h-full w-full origin-left animate-[fill-bar_7s_linear] bg-brand-yellow motion-reduce:animate-none"
                      />
                    ) : i < safeIndex ? (
                      <span className="block h-full w-full bg-brand-yellow/70" />
                    ) : null}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % count)}
                aria-label="Próxima promoção"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-md transition-transform hover:scale-105"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
