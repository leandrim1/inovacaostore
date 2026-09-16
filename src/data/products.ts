import camiseta01 from "../assets/images/product-camiseta-01.jpg";
import camiseta02 from "../assets/images/product-camiseta-02.jpg";
import camiseta03 from "../assets/images/product-camiseta-03.jpg";
import camiseta04 from "../assets/images/product-camiseta-04.jpg";
import regata01 from "../assets/images/product-regata-01.jpg";
import calca01 from "../assets/images/product-calca-01.jpg";
import bermuda01 from "../assets/images/product-bermuda-01.jpg";
import bermuda02 from "../assets/images/product-bermuda-02.jpg";
import type { Product } from "./types";

const PRETO = { name: "Preto", hex: "#141414" };
const BRANCO = { name: "Branco", hex: "#f5f5f0" };
const CINZA = { name: "Cinza", hex: "#8c8c88" };
const MARROM = { name: "Marinho", hex: "#22242c" };
const AZUL = { name: "Azul", hex: "#3b5b7a" };

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "camiseta-estampada-club-marrom",
    name: "Camiseta Estampada Club",
    category: "camisetas",
    price: 129.9,
    compareAtPrice: 162.9,
    images: [camiseta01],
    colors: [MARROM, PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camiseta 100% algodão com estampa exclusiva nas costas. Corte reto, caimento confortável e acabamento premium — feita para quem não abre mão de estilo no dia a dia.",
    features: [
      "100% algodão penteado",
      "Estampa serigrafia de alta durabilidade",
      "Corte reto unissex",
      "Gola reforçada",
    ],
    stock: 14,
    rating: 4.8,
    reviewCount: 32,
    tags: ["mais-vendido"],
    installmentsMax: 3,
    sku: "IS-CM-001",
  },
  {
    id: "p2",
    slug: "camiseta-oversized-grafica-vermelha",
    name: "Camiseta Oversized Gráfica",
    category: "camisetas",
    price: 119.9,
    images: [camiseta02],
    colors: [{ name: "Vermelho", hex: "#7c1f1f" }, PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Modelagem oversized com estampa gráfica exclusiva. Tecido encorpado que mantém a forma lavagem após lavagem, ideal para um visual street premium.",
    features: [
      "Modelagem oversized",
      "Tecido encorpado 220g",
      "Estampa localizada nas costas",
      "Gola careca reforçada",
    ],
    stock: 9,
    rating: 4.6,
    reviewCount: 18,
    tags: ["novo"],
    installmentsMax: 3,
    sku: "IS-CM-002",
  },
  {
    id: "p3",
    slug: "camiseta-estampada-bike-preta",
    name: "Camiseta Estampada Preta",
    category: "camisetas",
    price: 99.9,
    compareAtPrice: 129.9,
    images: [camiseta03],
    colors: [PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camiseta preta com estampa gráfica minimalista. Peça coringa para compor do casual ao streetwear, com toque macio e respirável.",
    features: [
      "100% algodão",
      "Estampa em silk de alta definição",
      "Modelagem reta",
    ],
    stock: 21,
    rating: 4.7,
    reviewCount: 27,
    installmentsMax: 3,
    sku: "IS-CM-003",
  },
  {
    id: "p4",
    slug: "camiseta-color-block",
    name: "Camiseta Color Block Premium",
    category: "camisetas",
    price: 139.9,
    images: [camiseta04],
    colors: [{ name: "Preto/Branco", hex: "#1a1a1a" }, AZUL],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camiseta em recorte color block com tecido piquet premium. Um clássico atemporal com um toque esportivo sofisticado.",
    features: [
      "Tecido piquet premium",
      "Recorte color block",
      "Acabamento reforçado nas costuras",
    ],
    stock: 11,
    rating: 4.9,
    reviewCount: 14,
    tags: ["importado"],
    installmentsMax: 3,
    sku: "IS-CM-004",
  },
  {
    id: "p5",
    slug: "regata-estampada-preta",
    name: "Regata Estampada Preta",
    category: "camisetas",
    price: 79.9,
    images: [regata01],
    colors: [PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Regata leve e respirável com estampa circular nas costas. Perfeita para treino ou para compor um look casual de verão.",
    features: ["Tecido leve 100% algodão", "Estampa circular nas costas", "Caimento reto"],
    stock: 17,
    rating: 4.5,
    reviewCount: 9,
    installmentsMax: 2,
    sku: "IS-RG-001",
  },
  {
    id: "p6",
    slug: "calca-jeans-skinny-destroyed",
    name: "Calça Jeans Skinny Destroyed",
    category: "calcas",
    price: 189.9,
    compareAtPrice: 229.9,
    images: [calca01],
    colors: [CINZA, PRETO],
    sizes: ["36", "38", "40", "42", "44"],
    description:
      "Calça jeans skinny com lavagem destroyed e rasgos estratégicos. Elastano para maior conforto e mobilidade sem perder o ajuste.",
    features: [
      "98% algodão / 2% elastano",
      "Lavagem destroyed",
      "5 bolsos",
      "Ajuste skinny",
    ],
    stock: 8,
    rating: 4.7,
    reviewCount: 22,
    tags: ["mais-vendido"],
    installmentsMax: 4,
    sku: "IS-CL-001",
  },
  {
    id: "p7",
    slug: "bermuda-jeans-destroyed-clara",
    name: "Bermuda Jeans Destroyed Clara",
    category: "bermudas",
    price: 139.9,
    images: [bermuda01],
    colors: [{ name: "Jeans Claro", hex: "#a9a9a4" }],
    sizes: ["38", "40", "42", "44"],
    description:
      "Bermuda jeans com lavagem clara e detalhes destroyed. Corte reto na altura do joelho, ideal para o dia a dia com estilo.",
    features: ["100% algodão", "Lavagem clara destroyed", "5 bolsos"],
    stock: 13,
    rating: 4.6,
    reviewCount: 11,
    installmentsMax: 3,
    sku: "IS-BM-001",
  },
  {
    id: "p8",
    slug: "bermuda-jeans-destroyed-azul",
    name: "Bermuda Jeans Destroyed Azul",
    category: "bermudas",
    price: 149.9,
    compareAtPrice: 179.9,
    images: [bermuda02],
    colors: [{ name: "Jeans Azul", hex: "#5878a0" }],
    sizes: ["38", "40", "42", "44"],
    description:
      "Bermuda jeans azul com rasgos e barra desfiada. Elastano leve para mais liberdade de movimento em qualquer ocasião casual.",
    features: ["98% algodão / 2% elastano", "Barra desfiada", "5 bolsos"],
    stock: 6,
    rating: 4.4,
    reviewCount: 7,
    tags: ["ultimas-unidades"],
    installmentsMax: 3,
    sku: "IS-BM-002",
  },
  {
    id: "p9",
    slug: "camisa-social-slim-branca",
    name: "Camisa Social Slim Branca",
    category: "camisas",
    price: 169.9,
    images: [],
    colors: [BRANCO, { name: "Azul Claro", hex: "#c3d3e0" }],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camisa social de corte slim em tricoline, ideal para ocasiões formais ou para compor um visual smart casual.",
    features: ["Tecido tricoline", "Corte slim", "Fácil de passar"],
    stock: 10,
    rating: 4.6,
    reviewCount: 5,
    installmentsMax: 3,
    sku: "IS-CS-001",
    comingSoon: true,
  },
  {
    id: "p10",
    slug: "camisa-flanela-xadrez",
    name: "Camisa Flanela Xadrez",
    category: "camisas",
    price: 159.9,
    images: [],
    colors: [{ name: "Xadrez Vermelho", hex: "#6b2b2b" }],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camisa em flanela xadrez, manga longa, com toque macio e aconchegante para dias mais frios sem perder o estilo.",
    features: ["Flanela 100% algodão", "Manga longa", "Bolso frontal"],
    stock: 10,
    rating: 4.5,
    reviewCount: 4,
    installmentsMax: 3,
    sku: "IS-CS-002",
    comingSoon: true,
  },
  {
    id: "p11",
    slug: "jaqueta-corta-vento-preta",
    name: "Jaqueta Corta-Vento Preta",
    category: "jaquetas",
    price: 219.9,
    images: [],
    colors: [PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Jaqueta corta-vento leve e resistente, com capuz destacável. Proteção contra vento e chuva fina sem abrir mão do estilo urbano.",
    features: ["Tecido impermeável", "Capuz destacável", "Bolsos com zíper"],
    stock: 7,
    rating: 4.7,
    reviewCount: 6,
    installmentsMax: 4,
    sku: "IS-JQ-001",
    comingSoon: true,
  },
  {
    id: "p12",
    slug: "jaqueta-bomber-jeans",
    name: "Jaqueta Bomber Jeans",
    category: "jaquetas",
    price: 249.9,
    images: [],
    colors: [CINZA],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Jaqueta bomber em jeans com forro quentinho. Peça statement para elevar qualquer produção do inverno.",
    features: ["Jeans premium", "Forro interno", "Punhos e barra em ribana"],
    stock: 5,
    rating: 4.8,
    reviewCount: 3,
    tags: ["novo"],
    installmentsMax: 4,
    sku: "IS-JQ-002",
    comingSoon: true,
  },
  {
    id: "p13",
    slug: "bone-aba-reta-preto",
    name: "Boné Aba Reta Preto",
    category: "acessorios",
    price: 69.9,
    images: [],
    colors: [PRETO],
    sizes: ["Único"],
    description:
      "Boné aba reta com ajuste no snapback. Item essencial para completar qualquer look streetwear.",
    features: ["Aba reta", "Ajuste snapback", "Bordado frontal"],
    stock: 20,
    rating: 4.6,
    reviewCount: 15,
    installmentsMax: 2,
    sku: "IS-AC-001",
    comingSoon: true,
  },
  {
    id: "p14",
    slug: "corrente-prateada-aco-inox",
    name: "Corrente Prateada Aço Inox",
    category: "acessorios",
    price: 89.9,
    images: [],
    colors: [{ name: "Prata", hex: "#c7c9cc" }],
    sizes: ["Único"],
    description:
      "Corrente em aço inoxidável, antialérgica e resistente ao tempo. O acessório final para fechar sua produção com estilo.",
    features: ["Aço inoxidável", "Antialérgica", "60cm de comprimento"],
    stock: 25,
    rating: 4.5,
    reviewCount: 10,
    installmentsMax: 2,
    sku: "IS-AC-002",
    comingSoon: true,
  },
];

export function getProductBySlug(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string) {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  ).slice(0, limit);
}

export function getFeaturedProducts(limit = 8) {
  return PRODUCTS.filter((p) => !p.comingSoon).slice(0, limit);
}
