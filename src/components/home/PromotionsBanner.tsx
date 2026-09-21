import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Zap } from "lucide-react";
import { usePromotions, type Promotion } from "../../hooks/usePromotions";
import { useCountdown } from "../../hooks/useCountdown";
import { PositionedImage } from "../ui/PositionedImage";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";

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
  // Quando a arte já traz a chamada desenhada, o lojista deixa os textos em
  // branco e o banner é só a imagem. Aí não existe botão na tela — então a
  // camada de clique deixa de ser um atalho e passa a ser O link: precisa
  // aparecer para o teclado e para o leitor de tela.
  const temTexto = Boolean(promotion.title || promotion.highlight || promotion.description);
  const soArte = Boolean(promotion.imageUrl) && !temTexto;

  // Quando a arte manda sozinha e o lojista não recortou nada, é ela quem
  // decide a altura — assim a peça entra inteira e na proporção original,
  // tanto no celular quanto no computador. Com texto por cima, a foto continua
  // sendo fundo e precisa preencher o palco.
  const isMobile = useIsMobileViewport();
  const enquadrado = Boolean(isMobile ? promotion.mobileSettings : promotion.desktopSettings);
  const arteMandaNaAltura = soArte && !enquadrado;
  const cta = (
    <>
      <Zap size={16} className="fill-brand-ink" aria-hidden />
      {promotion.ctaLabel}
      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
    </>
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        arteMandaNaAltura
          ? "block w-full bg-brand-ink"
          : "flex min-h-[420px] items-center sm:min-h-[480px]"
      }`}
    >
      {promotion.imageUrl ? (
        <PositionedImage
          src={promotion.imageUrl}
          alt=""
          desktopSettings={promotion.desktopSettings}
          mobileSettings={promotion.mobileSettings}
          uncropped={arteMandaNaAltura}
          wrapperClassName={arteMandaNaAltura ? "block w-full" : "absolute inset-0 h-full w-full"}
          fallbackClassName={
            arteMandaNaAltura ? "h-auto max-h-[70vh] w-full object-contain" : "object-cover"
          }
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

      {/* Quando existe uma arte, o banner inteiro leva ao mesmo destino do
          botão — é o que a pessoa espera ao clicar numa peça publicitária,
          ainda mais quando a chamada está desenhada dentro da própria imagem
          e não existe botão em HTML para acertar. Fica por baixo do bloco de
          texto (z-10 contra z-20) para não engolir o botão, que continua
          sendo um link próprio. */}
      {/* `aria-hidden` + `tabIndex={-1}`: esta camada é um atalho de mouse e de
          toque, não um segundo destino. Sem isso, um leitor de tela anunciaria
          dois links para o mesmo lugar e o teclado pararia duas vezes no mesmo
          banner. Quem navega por teclado ou leitor de tela usa o botão, que
          continua sendo o link de verdade. */}
      {promotion.imageUrl &&
        (isExternal ? (
          <a
            href={promotion.ctaUrl}
            target="_blank"
            rel="noreferrer"
            {...(soArte
              ? { "aria-label": promotion.ctaLabel || "Ver a oferta" }
              : { "aria-hidden": "true" as const, tabIndex: -1 })}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        ) : (
          <Link
            to={promotion.ctaUrl}
            {...(soArte
              ? { "aria-label": promotion.ctaLabel || "Ver a oferta" }
              : { "aria-hidden": "true" as const, tabIndex: -1 })}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        ))}

      {/* `pointer-events-none` deixa o clique atravessar o texto e chegar no
          link de cima; o botão devolve `pointer-events-auto` para si. Sem
          isso, clicar no título não faria nada. */}
      <motion.div
        variants={group}
        initial="hidden"
        animate="show"
        className={`container-page relative z-20 flex flex-col gap-4 py-14 ${
          promotion.imageUrl ? "pointer-events-none" : ""
        } ${soArte ? "hidden" : ""}`}
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

        {/* O título é o que chama a atenção primeiro, então ganha corpo, letras
            espaçadas e um traço amarelo embaixo, como numa arte de banner.
            `w-fit max-w-full` deixa o traço com a largura exata do texto sem
            deixar um título longo vazar da tela no celular. */}
        {promotion.title && (
        <motion.div variants={rise} className="w-fit max-w-full">
          <p className="font-display text-4xl leading-[0.95] tracking-[0.06em] text-white break-words [text-shadow:0_2px_0_rgba(0,0,0,0.35),0_6px_24px_rgba(0,0,0,0.75)] sm:text-5xl md:text-[3.25rem]">
            {promotion.title}
          </p>
          <span
            className="mt-2.5 block h-[3px] rounded-full bg-gradient-to-r from-brand-yellow via-brand-yellow to-transparent shadow-[0_0_14px_-2px_rgba(245,196,0,0.9)]"
            aria-hidden
          />
        </motion.div>
        )}

        {/* Sem `w-fit` aqui: `fit-content` deixa o parágrafo com a largura do
            texto inteiro e um destaque longo ("20% DESCONTO") vaza da borda no
            celular. O brilho é `drop-shadow`, que segue as letras e não a
            caixa, então a largura total não atrapalha. */}
        {promotion.highlight && (
          <motion.p variants={punch} className="animate-glow-pulse motion-reduce:animate-none">
            <span className="promo-highlight block font-display text-5xl leading-none break-words motion-reduce:animate-none sm:text-7xl md:text-8xl">
              {promotion.highlight}
            </span>
          </motion.p>
        )}

        {promotion.description && (
          <motion.p
            variants={rise}
            className="max-w-md border-l-2 border-brand-yellow pl-3 text-sm text-white/90 sm:text-base"
          >
            {promotion.description}
          </motion.p>
        )}

        <motion.div variants={rise} className="pointer-events-auto mt-2 w-fit">
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
