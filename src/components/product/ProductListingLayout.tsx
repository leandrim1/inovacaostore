import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "../../data/types";
import { useProductFilters, type SortOption } from "../../hooks/useProductFilters";
import { FiltersPanel } from "./FiltersPanel";
import { ProductCard } from "./ProductCard";

const SORT_LABELS: Record<SortOption, string> = {
  relevancia: "Relevância",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
  avaliacao: "Melhor avaliação",
};

interface ProductListingLayoutProps {
  title: string;
  subtitle?: string;
  baseProducts: Product[];
  showCategoryFilter?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function ProductListingLayout({
  title,
  subtitle,
  baseProducts,
  showCategoryFilter = false,
  emptyMessage = "Nenhum produto encontrado com esses filtros.",
  isLoading = false,
}: ProductListingLayoutProps) {
  const filters = useProductFilters(baseProducts);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8">
        <p className="rotulo mb-2 text-neutral-500">Catálogo</p>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xl text-neutral-500">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FiltersPanel showCategoryFilter={showCategoryFilter} {...filters} />
        </aside>

        <div className="flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-full border border-brand-ink/15 px-4 py-2 text-sm font-medium lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Filtrar
              {filters.activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-bold text-brand-ink">
                  {filters.activeFilterCount}
                </span>
              )}
            </button>

            <p className="hidden text-sm text-neutral-500 lg:block">
              {filters.filtered.length} produto(s)
            </p>

            {/* A seta nativa do <select> é desenhada colada na borda e ignora o
                padding, o que fica torto dentro de uma pílula arredondada.
                `appearance-none` desliga a seta do navegador e desenhamos a
                nossa, com `pr-10` reservando o espaço dela para o texto nunca
                passar por baixo. `pointer-events-none` mantém o clique na seta
                abrindo a lista. */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => filters.setSort(e.target.value as SortOption)}
                className="w-full appearance-none rounded-full border border-brand-ink/15 bg-white py-2 pl-4 pr-10 text-sm text-brand-ink outline-none transition-colors focus:border-brand-ink focus:ring-4 focus:ring-brand-ink/5"
                aria-label="Ordenar por"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    Ordenar: {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
          </div>

          <p className="mb-4 text-sm text-neutral-500 lg:hidden">
            {filters.filtered.length} produto(s)
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 border border-brand-ink/10 bg-neutral-50 py-20 text-center text-neutral-500">
              <p>Carregando produtos…</p>
            </div>
          ) : filters.filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 border border-brand-ink/10 bg-neutral-50 py-20 text-center text-neutral-500">
              <p>{emptyMessage}</p>
              {filters.activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={filters.clearFilters}
                  className="btn-outline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3">
              {filters.filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg">Filtrar</span>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  aria-label="Fechar filtros"
                  className="rounded-full p-2 hover:bg-neutral-100"
                >
                  <X size={20} />
                </button>
              </div>
              <FiltersPanel showCategoryFilter={showCategoryFilter} {...filters} />
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="btn-primary mt-6 w-full"
              >
                Ver {filters.filtered.length} produto(s)
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
