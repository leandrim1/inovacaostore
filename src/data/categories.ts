import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    slug: "camisetas",
    name: "Camisetas",
    description: "Estampadas, básicas e regatas para o dia a dia.",
  },
  {
    slug: "camisas",
    name: "Camisas",
    description: "Social e casual, para compor looks de qualquer ocasião.",
  },
  {
    slug: "calcas",
    name: "Calças",
    description: "Jeans e sarja com caimento moderno.",
  },
  {
    slug: "bermudas",
    name: "Bermudas",
    description: "Jeans e moletom para dias quentes.",
  },
  {
    slug: "jaquetas",
    name: "Jaquetas",
    description: "Corta-vento, jeans e bomber para fechar o visual.",
  },
  {
    slug: "acessorios",
    name: "Acessórios",
    description: "Bonés, correntes e itens para finalizar o estilo.",
  },
];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
