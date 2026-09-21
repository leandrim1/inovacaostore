import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Product } from "../data/types";

export type SortOption = "relevancia" | "menor-preco" | "maior-preco" | "avaliacao";

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function useProductFilters(baseProducts: Product[]) {
  const [params, setParams] = useSearchParams();

  const sizes = useMemo(() => params.getAll("tamanho"), [params]);
  const colors = useMemo(() => params.getAll("cor"), [params]);
  const brands = useMemo(() => params.getAll("marca"), [params]);
  const categories = useMemo(() => params.getAll("categoria"), [params]);
  const minPrice = params.get("min") ? Number(params.get("min")) : undefined;
  const maxPrice = params.get("max") ? Number(params.get("max")) : undefined;
  const sort = (params.get("ordenar") as SortOption) || "relevancia";

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    baseProducts.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [baseProducts]);

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    baseProducts.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [baseProducts]);

  // Só as marcas que existem entre os produtos da tela. Numa categoria sem
  // nenhuma marca preenchida a lista vem vazia e o filtro nem aparece.
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    baseProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [baseProducts]);

  const priceBounds = useMemo(() => {
    const prices = baseProducts.map((p) => p.price);
    return {
      min: prices.length ? Math.floor(Math.min(...prices)) : 0,
      max: prices.length ? Math.ceil(Math.max(...prices)) : 0,
    };
  }, [baseProducts]);

  const filtered = useMemo(() => {
    let result = baseProducts.filter((p) => {
      if (categories.length && !categories.includes(p.category)) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (brands.length && !brands.includes(p.brand)) return false;
      if (minPrice !== undefined && p.price < minPrice) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "menor-preco":
          return a.price - b.price;
        case "maior-preco":
          return b.price - a.price;
        case "avaliacao":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return result;
  }, [baseProducts, categories, sizes, colors, brands, minPrice, maxPrice, sort]);

  function updateList(key: "tamanho" | "cor" | "categoria" | "marca", value: string) {
    const current = params.getAll(key);
    const next = toggleInList(current, value);
    const newParams = new URLSearchParams(params);
    newParams.delete(key);
    next.forEach((v) => newParams.append(key, v));
    setParams(newParams, { replace: true });
  }

  function setPriceRange(min?: number, max?: number) {
    const newParams = new URLSearchParams(params);
    if (min === undefined) newParams.delete("min");
    else newParams.set("min", String(min));
    if (max === undefined) newParams.delete("max");
    else newParams.set("max", String(max));
    setParams(newParams, { replace: true });
  }

  function setSort(value: SortOption) {
    const newParams = new URLSearchParams(params);
    newParams.set("ordenar", value);
    setParams(newParams, { replace: true });
  }

  function clearFilters() {
    const newParams = new URLSearchParams();
    const q = params.get("q");
    if (q) newParams.set("q", q);
    setParams(newParams, { replace: true });
  }

  const activeFilterCount = sizes.length + colors.length + categories.length + brands.length +
    (minPrice !== undefined ? 1 : 0) + (maxPrice !== undefined ? 1 : 0);

  return {
    filtered,
    sizes,
    colors,
    categories,
    brands,
    minPrice,
    maxPrice,
    sort,
    availableSizes,
    availableColors,
    availableBrands,
    priceBounds,
    toggleSize: (v: string) => updateList("tamanho", v),
    toggleColor: (v: string) => updateList("cor", v),
    toggleCategory: (v: string) => updateList("categoria", v),
    toggleBrand: (v: string) => updateList("marca", v),
    setPriceRange,
    setSort,
    clearFilters,
    activeFilterCount,
  };
}
