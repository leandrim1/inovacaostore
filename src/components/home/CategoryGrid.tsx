import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { SectionHeading } from "../ui/SectionHeading";
import { AnimatedSection } from "../ui/AnimatedSection";

/**
 * Categorias como um índice de revista: o nome de cada linha em letra grande,
 * uma régua entre elas e a foto de capa pequena ao lado. Tipografia no lugar
 * de mais uma grade de cartões — e nenhuma categoria sem foto vira um bloco
 * vazio.
 *
 * No computador a foto sai da linha e vai para um quadro grande à direita,
 * que troca conforme o mouse passa pelos nomes (e pelo foco do teclado).
 */
export function CategoryGrid() {
  // A capa de cada categoria vem pronta de /api/categories. Antes daqui saía
  // um `useProducts()` SEM filtro: a home baixava o catálogo inteiro — com
  // imagens, variações e categoria de cada produto — só para achar uma foto
  // por categoria.
  const { data: categories = [] } = useCategories();
  const primeiraComFoto = categories.find((c) => c.coverImage)?.slug ?? null;
  const [apontada, setApontada] = useState<string | null>(null);
  const emFoco = categories.find((c) => c.slug === (apontada ?? primeiraComFoto));

  return (
    <AnimatedSection id="categorias" tom="creme" className="py-14 sm:py-20">
      <div className="container-page">
        <SectionHeading
          title="Categorias"
          description="Nossa seleção completa de peças masculinas nacionais e importadas, organizada por estilo."
        />

        <div className="grid gap-10 lg:grid-cols-12">
          <ul className="border-t border-brand-ink/15 lg:col-span-7" onMouseLeave={() => setApontada(null)}>
            {categories.map((cat) => (
              <li key={cat.slug} className="border-b border-brand-ink/15">
                <Link
                  to={`/categoria/${cat.slug}`}
                  onMouseEnter={() => setApontada(cat.slug)}
                  onFocus={() => setApontada(cat.slug)}
                  className="group flex min-h-[84px] items-center gap-4 py-2.5 [-webkit-tap-highlight-color:transparent] active:bg-brand-ink/[0.03] sm:min-h-[104px]"
                >
                  <span className="min-w-0 flex-1 font-display text-[clamp(2.4rem,11vw,4.75rem)] leading-none text-brand-ink transition-transform duration-300 ease-out lg:group-hover:translate-x-3">
                    {cat.name}
                  </span>
                  {cat.coverImage && (
                    <img
                      src={cat.coverImage}
                      alt=""
                      loading="lazy"
                      className="h-16 w-12 shrink-0 rounded-[2px] object-cover sm:h-20 sm:w-16 lg:hidden"
                    />
                  )}
                  <ArrowUpRight
                    size={22}
                    strokeWidth={1.6}
                    aria-hidden
                    className="shrink-0 text-brand-ink/40 transition-colors group-hover:text-brand-ink"
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Quadro do computador: a capa da categoria apontada, com a mesma
              altura da lista ao lado. */}
          <div className="relative hidden min-h-[360px] lg:col-span-5 lg:block">
            <div className="absolute inset-0 overflow-hidden rounded-[3px] bg-neutral-200">
              <AnimatePresence initial={false}>
                {emFoco?.coverImage && (
                  <motion.img
                    key={emFoco.slug}
                    src={emFoco.coverImage}
                    alt={emFoco.name}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </AnimatePresence>
              {emFoco && (
                <span className="absolute bottom-0 left-0 bg-brand-ink px-3 py-2 font-display text-lg tracking-[0.04em] text-white">
                  {emFoco.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
