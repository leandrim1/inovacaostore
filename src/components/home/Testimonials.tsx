import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import {
  useTestimonials,
  useTestimonialEligibility,
  type Testimonial,
} from "../../hooks/useTestimonials";
import { useDragToScroll } from "../../hooks/useDragToScroll";
import { StarRating } from "../ui/StarRating";
import { Reveal } from "../ui/Reveal";
import { TestimonialFormModal } from "./TestimonialFormModal";
import { AnimatedSection } from "../ui/AnimatedSection";
import { SectionHeading } from "../ui/SectionHeading";

/** Explica ao cliente o que falta para ele poder avaliar a loja. */
function SubmitArea({ onOpen }: { onOpen: () => void }) {
  const { data: eligibility } = useTestimonialEligibility();

  if (!eligibility) return null;

  if (eligibility.canSubmit) {
    return (
      <button type="button" onClick={onOpen} className="btn-primary">
        <PenLine size={15} />
        Deixe seu depoimento
      </button>
    );
  }

  const messages: Record<string, React.ReactNode> = {
    nao_logado: (
      <>
        <Link to="/login" className="font-medium text-brand-ink underline">
          Entre na sua conta
        </Link>{" "}
        para avaliar a loja.
      </>
    ),
    email_nao_verificado: "Confirme seu e-mail para poder avaliar a loja.",
    sem_pedido_entregue: "Assim que um pedido seu for entregue, você poderá deixar seu depoimento.",
    ja_enviado: "Seu depoimento foi enviado e está aguardando aprovação.",
    ja_publicado: "Seu depoimento já está publicado aqui. Obrigado!",
  };

  return (
    <p className="text-sm text-neutral-500">{eligibility.reason ? messages[eligibility.reason] : null}</p>
  );
}

const MES_ANO = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

/** "setembro de 2026" → "Setembro de 2026". */
function mesAno(iso: string) {
  const texto = MES_ANO.format(new Date(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Onde cada cartão fica na grade. A lista rola de lado, então a grade cresce
 * em colunas — mas a leitura tem que continuar sendo por linha: no
 * computador, 1-2-3 em cima e 4-5-6 embaixo (como no layout de referência),
 * e o 7º abre a próxima "página" à direita. No tablet a página é 2×2 e no
 * celular é uma fileira só.
 *
 * Exatamente 4 no computador viram uma fileira só de 4: em 3 + 1, o quarto
 * cartão ficava sozinho num canto.
 */
function posicao(i: number, total: number): CSSProperties {
  const colunasLg = total === 4 ? 4 : 3;
  const sm = { pagina: Math.floor(i / 4), k: i % 4 };
  const lg = { pagina: Math.floor(i / (colunasLg * 2)), k: i % (colunasLg * 2) };
  return {
    "--c": String(i + 1),
    "--r": "1",
    "--c-sm": String(sm.pagina * 2 + (sm.k % 2) + 1),
    "--r-sm": String(Math.floor(sm.k / 2) + 1),
    "--c-lg": String(lg.pagina * colunasLg + (lg.k % colunasLg) + 1),
    "--r-lg": String(Math.floor(lg.k / colunasLg) + 1),
  } as CSSProperties;
}

/** Texto do depoimento: até 5 linhas, com "Ler mais" só quando corta algo. */
function Citacao({ texto }: { texto: string }) {
  const ref = useRef<HTMLQuoteElement>(null);
  const [aberto, setAberto] = useState(false);
  const [cortado, setCortado] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || aberto) return;
    const medir = new ResizeObserver(() => setCortado(el.scrollHeight > el.clientHeight + 1));
    medir.observe(el);
    return () => medir.disconnect();
  }, [aberto, texto]);

  return (
    <div className="mb-5 mt-4">
      <blockquote
        ref={ref}
        className={`break-words text-[17px] leading-snug text-brand-ink sm:text-lg ${aberto ? "" : "line-clamp-5"}`}
      >
        “{texto}”
      </blockquote>
      {cortado && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="mt-2 text-xs font-medium text-brand-ink underline underline-offset-4 hover:text-neutral-600"
        >
          {aberto ? "Ler menos" : "Ler mais"}
        </button>
      )}
    </div>
  );
}

function CartaoDepoimento({ t }: { t: Testimonial }) {
  return (
    <figure className="flex w-full flex-col rounded-[3px] border border-brand-ink/10 bg-white p-5 sm:p-6">
      <StarRating rating={t.rating} size={12} />

      <Citacao texto={t.quote} />

      <figcaption className="mt-auto flex items-end justify-between gap-3 border-t border-brand-ink/10 pt-4 text-xs">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-brand-ink">{t.name}</span>
          <span className="block truncate text-neutral-500">
            {[t.city, mesAno(t.createdAt)].filter(Boolean).join(" · ")}
          </span>
        </span>
        {t.verified && (
          <span className="flex shrink-0 items-center gap-1 font-medium text-brand-ink/80">
            <BadgeCheck size={14} className="text-brand-yellow-dark" aria-hidden />
            Compra verificada
          </span>
        )}
      </figcaption>
    </figure>
  );
}

interface EstadoRolagem {
  sobra: boolean;
  noInicio: boolean;
  noFim: boolean;
  /** 0 → 1: quanto já rolou. */
  progresso: number;
  /** 0 → 1: quanto da lista cabe na tela (largura da barrinha). */
  visivel: number;
}

function useEstadoRolagem(ref: RefObject<HTMLElement | null>, quantidade: number): EstadoRolagem {
  const [estado, setEstado] = useState<EstadoRolagem>({
    sobra: false,
    noInicio: true,
    noFim: true,
    progresso: 0,
    visivel: 1,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const max = el.scrollWidth - el.clientWidth;
      const sobra = max > 2;
      const novo: EstadoRolagem = {
        sobra,
        noInicio: !sobra || el.scrollLeft <= 2,
        noFim: !sobra || el.scrollLeft >= max - 2,
        progresso: sobra ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0,
        visivel: sobra ? el.clientWidth / el.scrollWidth : 1,
      };
      setEstado((atual) =>
        atual.sobra === novo.sobra &&
        atual.noInicio === novo.noInicio &&
        atual.noFim === novo.noFim &&
        Math.abs(atual.progresso - novo.progresso) < 0.005 &&
        Math.abs(atual.visivel - novo.visivel) < 0.005
          ? atual
          : novo,
      );
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    // O ResizeObserver mede na primeira observação e a cada mudança de
    // largura (girar o celular, redimensionar a janela).
    const observador = new ResizeObserver(agendar);
    observador.observe(el);
    el.addEventListener("scroll", agendar, { passive: true });
    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", agendar);
      cancelAnimationFrame(quadro);
    };
  }, [ref, quantidade]);

  return estado;
}

/**
 * Cartões em grade (3×2 no computador, 2×2 no tablet, um por vez no
 * celular). Quando há mais depoimentos do que cabem, a mesma grade vira um
 * carrossel: arrasta com o dedo ou com o mouse, ou usa as setas.
 */
function CarrosselDepoimentos({ items }: { items: Testimonial[] }) {
  const trilhaRef = useRef<HTMLUListElement>(null);
  const trilhaId = useId();
  const { sobra, noInicio, noFim, progresso, visivel } = useEstadoRolagem(trilhaRef, items.length);
  useDragToScroll(trilhaRef, sobra);

  function andar(direcao: 1 | -1) {
    const el = trilhaRef.current;
    const cartao = el?.querySelector("li");
    if (!el || !cartao) return;
    const estilo = getComputedStyle(el);
    const passo = cartao.getBoundingClientRect().width + (parseFloat(estilo.columnGap) || 0);
    const util = el.clientWidth - (parseFloat(estilo.paddingLeft) || 0) - (parseFloat(estilo.paddingRight) || 0);
    const colunas = Math.max(1, Math.round((util + (parseFloat(estilo.columnGap) || 0)) / passo));
    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direcao * colunas * passo, behavior: semAnimacao ? "auto" : "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={trilhaRef}
        id={trilhaId}
        aria-label="Depoimentos de clientes"
        tabIndex={sobra ? 0 : undefined}
        className={`relative -mx-4 -my-6 grid auto-cols-[85%] grid-flow-col justify-center-safe gap-4 overflow-x-auto overscroll-x-contain px-4 py-6 [scrollbar-width:none] snap-x snap-mandatory scroll-px-4 focus-visible:outline-offset-[-4px] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:-mx-3 sm:auto-cols-[calc((100%_-_1rem)/2)] sm:px-3 sm:scroll-px-3 [&::-webkit-scrollbar]:hidden ${
          items.length === 4 ? "lg:auto-cols-[calc((100%_-_3rem)/4)]" : "lg:auto-cols-[calc((100%_-_2rem)/3)]"
        } ${
          sobra ? "cursor-grab select-none" : ""
        }`}
      >
        {items.map((t, i) => (
          <li
            key={t.id}
            style={posicao(i, items.length)}
            className="flex snap-start [grid-column:var(--c)] [grid-row:var(--r)] sm:[grid-column:var(--c-sm)] sm:[grid-row:var(--r-sm)] lg:[grid-column:var(--c-lg)] lg:[grid-row:var(--r-lg)]"
          >
            <CartaoDepoimento t={t} />
          </li>
        ))}
      </ul>

      {sobra && (
        <div className="mt-6 flex items-center gap-4">
          <div aria-hidden="true" className="relative h-0.5 flex-1 overflow-hidden bg-brand-ink/10">
            <div
              className="absolute inset-y-0 bg-brand-ink"
              style={{ width: `${visivel * 100}%`, left: `${progresso * (1 - visivel) * 100}%` }}
            />
          </div>
          <div className="flex">
            <button
              type="button"
              onClick={() => andar(-1)}
              disabled={noInicio}
              aria-controls={trilhaId}
              aria-label="Depoimentos anteriores"
              className="flex h-11 w-11 items-center justify-center border border-brand-ink/20 text-brand-ink transition-colors hover:bg-brand-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => andar(1)}
              disabled={noFim}
              aria-controls={trilhaId}
              aria-label="Próximos depoimentos"
              className="-ml-px flex h-11 w-11 items-center justify-center border border-brand-ink/20 text-brand-ink transition-colors hover:bg-brand-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Testimonials() {
  const { data } = useTestimonials();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: eligibility } = useTestimonialEligibility();

  const testimonials = data?.items ?? [];
  const averageRating = data?.averageRating ?? null;

  if (testimonials.length === 0) return null;

  return (
    <AnimatedSection tom="creme" className="py-14 sm:py-20">
      <div className="container-page">
        <SectionHeading
          title="O que dizem nossos clientes"
          description="Histórias reais de quem já veste Inovação Store."
          action={
            averageRating !== null && (
              <div className="text-right">
                <p className="font-display text-5xl leading-[0.8] text-brand-ink sm:text-6xl">
                  {averageRating.toFixed(1).replace(".", ",")}
                </p>
                <div className="mt-2 flex flex-col items-end gap-1 text-xs text-neutral-500">
                  <StarRating rating={averageRating} size={12} />
                  <span>
                    de média · {testimonials.length} {testimonials.length === 1 ? "avaliação" : "avaliações"}
                  </span>
                </div>
              </div>
            )
          }
        />

        <Reveal>
          <CarrosselDepoimentos items={testimonials} />
        </Reveal>

        <div className="mt-8">
          <SubmitArea onOpen={() => setIsFormOpen(true)} />
        </div>
      </div>

      <TestimonialFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        suggestedName={eligibility?.suggestedName ?? null}
      />
    </AnimatedSection>
  );
}
