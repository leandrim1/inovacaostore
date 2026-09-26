import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { usePromotions, type Promotion } from "../../hooks/usePromotions";
import { useCountdown } from "../../hooks/useCountdown";
import { PositionedImage } from "../ui/PositionedImage";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { isDefaultImageSettings } from "../../lib/imageSettings";

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-11 flex-col items-center gap-1 px-2 py-1.5 sm:min-w-12">
      <span className="font-display text-2xl leading-none tabular-nums text-white sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-[0.08em] text-white/50">{label}</span>
    </div>
  );
}

function CountdownBadge({ endsAt }: { endsAt: string | null }) {
  const parts = useCountdown(endsAt);
  if (!parts || parts.expired) return null;

  return (
    <div className="flex w-fit flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">Termina em</span>
      <div className="flex items-stretch divide-x divide-white/15 border border-white/15 bg-black/60">
        {parts.days > 0 && <TimeBlock value={parts.days} label="dias" />}
        <TimeBlock value={parts.hours} label="horas" />
        <TimeBlock value={parts.minutes} label="min" />
        <TimeBlock value={parts.seconds} label="seg" />
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
  const enquadrado = !isDefaultImageSettings(
    isMobile ? promotion.mobileSettings : promotion.desktopSettings,
  );
  const arteMandaNaAltura = soArte && !enquadrado;
  // Mesmo COM recorte salvo, quem é só arte manda na proporção da caixa: o
  // quadro fixo é retrato no celular e deitado no computador, então ele
  // decapita qualquer peça larga antes de o zoom do lojista sequer entrar. Com
  // a caixa na proporção do arquivo, zoom 1 mostra a peça inteira e um zoom de
  // verdade amplia dentro dela — igual nas duas telas.
  const arteMandaNaCaixa = soArte;
  const cta = (
    <>
      {promotion.ctaLabel}
      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
    </>
  );

  return (
    <div
      className={`relative overflow-hidden rounded-[3px] ${
        arteMandaNaCaixa
          ? "block w-full bg-brand-ink"
          : "flex min-h-[420px] items-center sm:min-h-[480px]"
      }`}
    >
      {promotion.imageUrl ? (
        <>
          {/* Sobras preenchidas com a própria arte desfocada, para a peça
              aparecer inteira sem tarjas pretas quando a proporção dela não
              bate com a da tela. */}
          {arteMandaNaAltura && (
            <img
              src={promotion.imageUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            />
          )}
          {/* Com recorte salvo a imagem vira camada absoluta e não empurra mais
              a caixa. Esta cópia invisível fica no fluxo só para dar à caixa a
              proporção do arquivo — é o que mantém celular e computador com o
              mesmo formato. */}
          {arteMandaNaCaixa && !arteMandaNaAltura && (
            <img
              src={promotion.imageUrl}
              alt=""
              aria-hidden
              className="invisible block h-auto max-h-[70vh] w-full"
            />
          )}
          <PositionedImage
            src={promotion.imageUrl}
            alt=""
            desktopSettings={promotion.desktopSettings}
            mobileSettings={promotion.mobileSettings}
            wrapperClassName={
              arteMandaNaAltura ? "relative block w-full" : "absolute inset-0 h-full w-full"
            }
            fallbackClassName={
              arteMandaNaAltura ? "h-auto max-h-[70vh] object-contain" : "object-cover"
            }
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-brand-ink" />
      )}
      {/* Escurece o lado do texto para o destaque ganhar contraste sem depender
          da foto que o admin subir. */}
      {!soArte && <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/5" />}

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
          <span className="block bg-brand-yellow px-2 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-brand-ink">
            Oferta
          </span>
        </motion.div>

        {promotion.title && (
          <motion.div variants={rise} className="w-fit max-w-full">
            <p className="break-words font-display text-4xl leading-[0.92] text-white sm:text-5xl md:text-[3.5rem]">
              {promotion.title}
            </p>
          </motion.div>
        )}

        {/* Sem `w-fit` aqui: `fit-content` deixa o parágrafo com a largura do
            texto inteiro e um destaque longo ("20% DESCONTO") vaza da borda no
            celular. */}
        {promotion.highlight && (
          <motion.p variants={rise}>
            <span className="promo-highlight block break-words font-display text-6xl leading-[0.85] sm:text-8xl md:text-9xl">
              {promotion.highlight}
            </span>
          </motion.p>
        )}

        {promotion.description && (
          <motion.p
            variants={rise}
            className="max-w-md text-sm text-white/80 sm:text-base"
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
              className="btn-accent group"
            >
              {cta}
            </a>
          ) : (
            <Link to={promotion.ctaUrl} className="btn-accent group">
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
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
                aria-label="Promoção anterior"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-brand-ink transition-colors hover:bg-neutral-200"
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
                    className="h-0.5 flex-1 overflow-hidden bg-white/25"
                  >
                    {i === safeIndex ? (
                      <span
                        key={safeIndex}
                        className="block h-full w-full origin-left animate-[fill-bar_7s_linear] bg-white motion-reduce:animate-none"
                      />
                    ) : i < safeIndex ? (
                      <span className="block h-full w-full bg-white/70" />
                    ) : null}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % count)}
                aria-label="Próxima promoção"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-brand-ink transition-colors hover:bg-neutral-200"
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
