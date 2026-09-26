import { useCategories } from "../../hooks/useCategories";
import { formatBRL } from "../../lib/format";
import type { useProductFilters } from "../../hooks/useProductFilters";

type Filters = ReturnType<typeof useProductFilters>;

interface FiltersPanelProps extends Filters {
  showCategoryFilter?: boolean;
}

export function FiltersPanel({
  showCategoryFilter,
  categories,
  toggleCategory,
  availableSizes,
  sizes,
  toggleSize,
  availableColors,
  colors,
  toggleColor,
  availableBrands,
  brands,
  toggleBrand,
  priceBounds,
  minPrice,
  maxPrice,
  setPriceRange,
  clearFilters,
  activeFilterCount,
}: FiltersPanelProps) {
  const { data: allCategories = [] } = useCategories();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-wide">Filtros</h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-neutral-400 underline transition-colors hover:text-brand-ink"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {showCategoryFilter && (
        <fieldset>
          <legend className="mb-3 font-display text-sm tracking-widest text-neutral-500">
            Categoria
          </legend>
          <div className="flex flex-col gap-2">
            {allCategories.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={categories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                  className="h-4 w-4 accent-brand-ink focus-visible:outline-offset-4"
                />
                {cat.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Só aparece quando existe marca preenchida nos produtos da tela — numa
          categoria sem marcas, um filtro vazio seria só ruído. */}
      {availableBrands.length > 0 && (
        <fieldset>
          <legend className="mb-3 font-display text-sm tracking-widest text-neutral-500">
            Marca
          </legend>
          <div className="flex flex-col gap-2">
            {availableBrands.map((marca) => (
              <label key={marca} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={brands.includes(marca)}
                  onChange={() => toggleBrand(marca)}
                  className="h-4 w-4 accent-brand-ink focus-visible:outline-offset-4"
                />
                {marca}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 font-display text-sm tracking-widest text-neutral-500">
          Tamanho
        </legend>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const active = sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                aria-pressed={active}
                className={`flex h-10 min-w-10 items-center justify-center rounded-[3px] border px-2 text-xs font-semibold transition-colors duration-150 ${
                  active
                    ? "border-brand-ink bg-brand-ink text-white"
                    : "border-brand-ink/20 bg-white text-neutral-700 hover:border-brand-ink"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-sm tracking-widest text-neutral-500">
          Cor
        </legend>
        <div className="flex flex-wrap gap-3">
          {availableColors.map((color) => {
            const active = colors.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleColor(color.name)}
                title={color.name}
                aria-pressed={active}
                aria-label={color.name}
                className={`h-9 w-9 rounded-full border border-black/10 ring-1 ring-offset-[3px] transition-shadow ${
                  active ? "ring-brand-ink" : "ring-transparent hover:ring-brand-ink/25"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-sm tracking-widest text-neutral-500">
          Preço
        </legend>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="number"
            placeholder={String(priceBounds.min)}
            value={minPrice ?? ""}
            onChange={(e) =>
              setPriceRange(
                e.target.value ? Number(e.target.value) : undefined,
                maxPrice,
              )
            }
            className="w-full rounded-lg border border-brand-ink/15 bg-white px-2 py-1.5 text-sm text-brand-ink outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-ink focus:ring-4 focus:ring-brand-ink/5"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            placeholder={String(priceBounds.max)}
            value={maxPrice ?? ""}
            onChange={(e) =>
              setPriceRange(
                minPrice,
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-lg border border-brand-ink/15 bg-white px-2 py-1.5 text-sm text-brand-ink outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-ink focus:ring-4 focus:ring-brand-ink/5"
          />
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          Faixa disponível: {formatBRL(priceBounds.min)} — {formatBRL(priceBounds.max)}
        </p>
      </fieldset>
    </div>
  );
}
