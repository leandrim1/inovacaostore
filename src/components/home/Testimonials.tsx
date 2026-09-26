import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronLeft, ChevronRight, Heart, PenLine } from "lucide-react";
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

/** "Lucas Almeida" → "LA"; "Lucas" → "L". */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
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
 * Exatamente 4 no computador viram um bloco 2×2 centralizado: em 3 + 1, o
 * quarto cartão ficava sozinho num canto.
 */
function posicao(i: number, total: number): CSSProperties {
  const colunasLg = total === 4 ? 2 : 3;
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
    <div className="mt-5">
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
    <figure className="flex w-full flex-col rounded-2xl bg-white p-5 shadow-[0_12px_32px_-14px_rgba(10,10,10,0.22)] ring-1 ring-black/[0.05] sm:p-6">
      <figcaption className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-ink font-display text-sm tracking-wide text-brand-yellow"
        >
          {iniciais(t.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-brand-ink">{t.name}</span>
          {t.city && <span className="block truncate text-xs text-neutral-500">{t.city}</span>}
          <span className="mt-1 block">
            <StarRating rating={t.rating} size={12} />
          </span>
        </span>
      </figcaption>

      <Citacao texto={t.quote} />

      {t.verified && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-ink/80">
          <BadgeCheck size={14} className="shrink-0 text-brand-yellow-dark" aria-hidden />
          Compra verificada
        </p>
      )}

      <p className="mt-auto pt-5">
        <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
          {mesAno(t.createdAt)}
        </span>
      </p>
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
      {/* Brilho amarelo por trás dos cartões (o lilás da referência, na cor da loja). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[12%] inset-y-[18%] rounded-full bg-brand-yellow/20 blur-3xl"
      />

      <ul
        ref={trilhaRef}
        id={trilhaId}
        aria-label="Depoimentos de clientes"
        tabIndex={sobra ? 0 : undefined}
        className={`relative -mx-4 -my-6 grid auto-cols-[85%] grid-flow-col justify-center-safe gap-4 overflow-x-auto overscroll-x-contain px-4 py-6 [scrollbar-width:none] snap-x snap-mandatory scroll-px-4 focus-visible:outline-offset-[-4px] data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none sm:-mx-3 sm:auto-cols-[calc((100%_-_1rem)/2)] sm:px-3 sm:scroll-px-3 lg:auto-cols-[calc((100%_-_2rem)/3)] [&::-webkit-scrollbar]:hidden ${
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
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => andar(-1)}
            disabled={noInicio}
            aria-controls={trilhaId}
            aria-label="Depoimentos anteriores"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-ink shadow-sm ring-1 ring-brand-ink/10 transition-colors hover:bg-brand-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <div aria-hidden="true" className="relative h-1 w-24 overflow-hidden rounded-full bg-brand-ink/10 sm:w-32">
            <div
              className="absolute inset-y-0 rounded-full bg-brand-ink"
              style={{ width: `${visivel * 100}%`, left: `${progresso * (1 - visivel) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => andar(1)}
            disabled={noFim}
            aria-controls={trilhaId}
            aria-label="Próximos depoimentos"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-ink shadow-sm ring-1 ring-brand-ink/10 transition-colors hover:bg-brand-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
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
    <AnimatedSection tom="claro" className="py-16 sm:py-24">
      <div className="container-page">
        <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand-ink shadow-sm ring-1 ring-black/5">
            <Heart size={13} className="fill-brand-yellow text-brand-yellow" aria-hidden />
            <span className="font-mono text-[11px] tabular-nums text-neutral-400">03</span>
            Depoimentos
          </span>
          <h2 className="section-title mt-4">O que dizem nossos clientes</h2>
          <p className="mt-4 text-sm text-neutral-500 sm:text-base">
            Histórias reais de quem já veste Inovação Store.
          </p>
          {averageRating !== null && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-500">
              <StarRating rating={averageRating} size={14} />
              <span>
                <strong className="font-display text-base text-brand-ink">
                  {averageRating.toFixed(1).replace(".", ",")}
                </strong>{" "}
                de média · {testimonials.length} {testimonials.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          )}
        </Reveal>

        <Reveal>
          <CarrosselDepoimentos items={testimonials} />
        </Reveal>

        <div className="mt-10 flex justify-center text-center">
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
