import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Zap } from "lucide-react";
import { usePromotions, type Promotion } from "../../hooks/usePromotions";
import { useCountdown } from "../../hooks/useCountdown";
import { PositionedImage } from "../ui/PositionedImage";

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
};

const punch: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.88 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18 } },
};

function TimeBlock({ value, label, pulse = false }: { value: number; label: string; pulse?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`flex min-w-11 justify-center rounded-lg border border-brand-yellow/30 bg-black/70 px-2 py-1.5 font-display text-xl tabular-nums text-brand-yellow shadow-[0_0_20px_-6px_rgba(245,196,0,0.7)] sm:min-w-12 sm:text-2xl ${
          pulse ? "animate-tick motion-reduce:animate-none" : ""
        }`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">{label}</span>
    </div>
  );
}

function CountdownBadge({ endsAt }: { endsAt: string | null }) {
  const parts = useCountdown(endsAt);
  if (!parts || parts.expired) return null;

  return (
    <div className="flex w-fit flex-col items-center gap-2 rounded-xl border border-white/10 bg-black/50 p-3 backdrop-blur-md">
      <span className="flex items-center gap-1.5 font-display text-[10px] tracking-[0.3em] text-white/70">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        Termina em
      </span>
      <div className="flex items-end gap-1.5">
        {parts.days > 0 && <TimeBlock value={parts.days} label="dias" />}
        <TimeBlock value={parts.hours} label="horas" />
        <TimeBlock value={parts.minutes} label="min" />
        <TimeBlock value={parts.seconds} label="seg" pulse />
      </div>
    </div>
  );
}

function PromotionSlide({ promotion }: { promotion: Promotion }) {
  const isExternal = /^https?:\/\//.test(promotion.ctaUrl);
  const cta = (
    <>
      <Zap size={16} className="fill-brand-ink" aria-hidden />
      {promotion.ctaLabel}
      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
    </>
  );

  return (
    <div className="relative flex min-h-[420px] items-center overflow-hidden rounded-2xl sm:min-h-[480px]">
      {promotion.imageUrl ? (
        <PositionedImage
          src={promotion.imageUrl}
          alt=""
          desktopSettings={promotion.desktopSettings}
          mobileSettings={promotion.mobileSettings}
          wrapperClassName="absolute inset-0 h-full w-full"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-ink">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,rgba(245,196,0,0.35),transparent_65%)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
      {/* Escurece o lado do texto para o destaque ganhar contraste sem depender
          da foto que o admin subir. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
      {/* Halo amarelo atrás do bloco de texto, dando profundidade ao brilho. */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-[420px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,196,0,0.22),transparent_70%)] blur-2xl" />

      <motion.div
        variants={group}
        initial="hidden"
        animate="show"
        className="container-page relative z-10 flex flex-col gap-4 py-14"
      >
        {promotion.endsAt && (
          <motion.div variants={rise} className="flex justify-end sm:absolute sm:right-6 sm:top-6">
            <CountdownBadge endsAt={promotion.endsAt} />
          </motion.div>
        )}

        <motion.div variants={rise} className="w-fit">
          <span className="flex items-center gap-2 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-3.5 py-1.5 font-display text-xs tracking-[0.3em] text-brand-yellow backdrop-blur-sm">
            {/* pulse em opacidade, não em translate: um ícone de 13px dentro de
                uma pílula sai do lugar com qualquer deslocamento perceptível. */}
            <Flame size={13} className="animate-pulse motion-reduce:animate-none" aria-hidden />
            Oferta
          </span>
        </motion.div>

        <motion.p
          variants={rise}
          className="font-display text-3xl tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-4xl"
        >
          {promotion.title}
        </motion.p>

        {/* Sem `w-fit` aqui: `fit-content` deixa o parágrafo com a largura do
            texto inteiro e um destaque longo ("20% DESCONTO") vaza da borda no
            celular. O brilho é `drop-shadow`, que segue as letras e não a
            caixa, então a largura total não atrapalha. */}
        <motion.p variants={punch} className="animate-glow-pulse motion-reduce:animate-none">
          <span className="promo-highlight block font-display text-5xl leading-none break-words motion-reduce:animate-none sm:text-7xl md:text-8xl">
            {promotion.highlight}
          </span>
        </motion.p>

        {promotion.description && (
          <motion.p
            variants={rise}
            className="max-w-md border-l-2 border-brand-yellow pl-3 text-sm text-white/90 sm:text-base"
          >
            {promotion.description}
          </motion.p>
        )}

        <motion.div variants={rise} className="mt-2 w-fit">
          {isExternal ? (
            <a
              href={promotion.ctaUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-accent group animate-cta-pulse motion-reduce:animate-none"
            >
              {cta}
            </a>
          ) : (
            <Link to={promotion.ctaUrl} className="btn-accent group animate-cta-pulse motion-reduce:animate-none">
              {cta}
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function PromotionsBanner() {
  const { data: todas = [] } = usePromotions();
  const [index, setIndex] = useState(0);
  // A API já filtra pela janela, mas a resposta fica em cache. Um relógio de
  // um segundo garante que, quando a contagem regressiva chega a zero, o
  // banner sai da tela no mesmo instante em que o desconto deixa de valer.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const promotions = todas.filter((p) => {
    if (p.startsAt && new Date(p.startsAt).getTime() > agora) return false;
    if (p.endsAt && new Date(p.endsAt).getTime() <= agora) return false;
    return true;
  });

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
    <section className="py-10 sm:py-14">
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
