import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { saveUpload } from "../src/storage.js";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_IMAGES_DIR = path.join(__dirname, "seed-images");

const SEED_IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

// Envia a imagem de catálogo inicial para o storage configurado — Vercel
// Blob se BLOB_READ_WRITE_TOKEN estiver definido, senão `server/uploads/`
// local (ver server/src/storage.ts). Só é chamada ao criar o registro da
// imagem pela primeira vez, então rodar o seed de novo não reenvia à toa.
async function seedImageUrl(filename: string): Promise<string> {
  const buffer = fs.readFileSync(path.join(SEED_IMAGES_DIR, filename));
  const contentType = SEED_IMAGE_MIME[path.extname(filename).toLowerCase()] ?? "image/jpeg";
  return saveUpload(buffer, filename, contentType);
}

const CATEGORIES = [
  { slug: "camisetas", name: "Camisetas", description: "Estampadas, básicas e regatas para o dia a dia.", order: 1 },
  { slug: "camisas", name: "Camisas", description: "Social e casual, para compor looks de qualquer ocasião.", order: 2 },
  { slug: "calcas", name: "Calças", description: "Jeans e sarja com caimento moderno.", order: 3 },
  { slug: "bermudas", name: "Bermudas", description: "Jeans e moletom para dias quentes.", order: 4 },
  { slug: "jaquetas", name: "Jaquetas", description: "Corta-vento, jeans e bomber para fechar o visual.", order: 5 },
  { slug: "acessorios", name: "Acessórios", description: "Bonés, correntes e itens para finalizar o estilo.", order: 6 },
];

const PRETO = { name: "Preto", hex: "#141414" };
const BRANCO = { name: "Branco", hex: "#f5f5f0" };
const CINZA = { name: "Cinza", hex: "#8c8c88" };
const MARINHO = { name: "Marinho", hex: "#22242c" };
const AZUL = { name: "Azul", hex: "#3b5b7a" };

interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  image?: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  description: string;
  features: string[];
  tags?: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  active: boolean;
  stockPerVariant: number;
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "camiseta-estampada-club-marrom",
    name: "Camiseta Estampada Club",
    category: "camisetas",
    price: 129.9,
    compareAtPrice: 162.9,
    sku: "IS-CM-001",
    image: "product-camiseta-01.jpg",
    colors: [MARINHO, PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camiseta 100% algodão com estampa exclusiva nas costas. Corte reto, caimento confortável e acabamento premium — feita para quem não abre mão de estilo no dia a dia.",
    features: ["100% algodão penteado", "Estampa serigrafia de alta durabilidade", "Corte reto unissex", "Gola reforçada"],
    tags: ["mais-vendido"],
    rating: 4.8,
    reviewCount: 32,
    featured: true,
    active: true,
    stockPerVariant: 6,
  },
  {
    slug: "camiseta-oversized-grafica-vermelha",
    name: "Camiseta Oversized Gráfica",
    category: "camisetas",
    price: 119.9,
    sku: "IS-CM-002",
    image: "product-camiseta-02.jpg",
    colors: [{ name: "Vermelho", hex: "#7c1f1f" }, PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Modelagem oversized com estampa gráfica exclusiva. Tecido encorpado que mantém a forma lavagem após lavagem, ideal para um visual street premium.",
    features: ["Modelagem oversized", "Tecido encorpado 220g", "Estampa localizada nas costas", "Gola careca reforçada"],
    tags: ["novo"],
    rating: 4.6,
    reviewCount: 18,
    featured: true,
    active: true,
    stockPerVariant: 4,
  },
  {
    slug: "camiseta-estampada-bike-preta",
    name: "Camiseta Estampada Preta",
    category: "camisetas",
    price: 99.9,
    compareAtPrice: 129.9,
    sku: "IS-CM-003",
    image: "product-camiseta-03.jpg",
    colors: [PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camiseta preta com estampa gráfica minimalista. Peça coringa para compor do casual ao streetwear, com toque macio e respirável.",
    features: ["100% algodão", "Estampa em silk de alta definição", "Modelagem reta"],
    rating: 4.7,
    reviewCount: 27,
    featured: true,
    active: true,
    stockPerVariant: 8,
  },
  {
    slug: "camiseta-color-block",
    name: "Camiseta Color Block Premium",
    category: "camisetas",
    price: 139.9,
    sku: "IS-CM-004",
    image: "product-camiseta-04.jpg",
    colors: [{ name: "Preto/Branco", hex: "#1a1a1a" }, AZUL],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camiseta em recorte color block com tecido piquet premium. Um clássico atemporal com um toque esportivo sofisticado.",
    features: ["Tecido piquet premium", "Recorte color block", "Acabamento reforçado nas costuras"],
    tags: ["importado"],
    rating: 4.9,
    reviewCount: 14,
    featured: true,
    active: true,
    stockPerVariant: 5,
  },
  {
    slug: "regata-estampada-preta",
    name: "Regata Estampada Preta",
    category: "camisetas",
    price: 79.9,
    sku: "IS-RG-001",
    image: "product-regata-01.jpg",
    colors: [PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Regata leve e respirável com estampa circular nas costas. Perfeita para treino ou para compor um look casual de verão.",
    features: ["Tecido leve 100% algodão", "Estampa circular nas costas", "Caimento reto"],
    rating: 4.5,
    reviewCount: 9,
    featured: true,
    active: true,
    stockPerVariant: 6,
  },
  {
    slug: "calca-jeans-skinny-destroyed",
    name: "Calça Jeans Skinny Destroyed",
    category: "calcas",
    price: 189.9,
    compareAtPrice: 229.9,
    sku: "IS-CL-001",
    image: "product-calca-01.jpg",
    colors: [CINZA, PRETO],
    sizes: ["36", "38", "40", "42", "44"],
    description:
      "Calça jeans skinny com lavagem destroyed e rasgos estratégicos. Elastano para maior conforto e mobilidade sem perder o ajuste.",
    features: ["98% algodão / 2% elastano", "Lavagem destroyed", "5 bolsos", "Ajuste skinny"],
    tags: ["mais-vendido"],
    rating: 4.7,
    reviewCount: 22,
    featured: true,
    active: true,
    stockPerVariant: 3,
  },
  {
    slug: "bermuda-jeans-destroyed-clara",
    name: "Bermuda Jeans Destroyed Clara",
    category: "bermudas",
    price: 139.9,
    sku: "IS-BM-001",
    image: "product-bermuda-01.jpg",
    colors: [{ name: "Jeans Claro", hex: "#a9a9a4" }],
    sizes: ["38", "40", "42", "44"],
    description:
      "Bermuda jeans com lavagem clara e detalhes destroyed. Corte reto na altura do joelho, ideal para o dia a dia com estilo.",
    features: ["100% algodão", "Lavagem clara destroyed", "5 bolsos"],
    rating: 4.6,
    reviewCount: 11,
    featured: true,
    active: true,
    stockPerVariant: 5,
  },
  {
    slug: "bermuda-jeans-destroyed-azul",
    name: "Bermuda Jeans Destroyed Azul",
    category: "bermudas",
    price: 149.9,
    compareAtPrice: 179.9,
    sku: "IS-BM-002",
    image: "product-bermuda-02.jpg",
    colors: [{ name: "Jeans Azul", hex: "#5878a0" }],
    sizes: ["38", "40", "42", "44"],
    description:
      "Bermuda jeans azul com rasgos e barra desfiada. Elastano leve para mais liberdade de movimento em qualquer ocasião casual.",
    features: ["98% algodão / 2% elastano", "Barra desfiada", "5 bolsos"],
    tags: ["ultimas-unidades"],
    rating: 4.4,
    reviewCount: 7,
    featured: true,
    active: true,
    stockPerVariant: 1,
  },
  {
    slug: "camisa-social-slim-branca",
    name: "Camisa Social Slim Branca",
    category: "camisas",
    price: 169.9,
    sku: "IS-CS-001",
    colors: [BRANCO, { name: "Azul Claro", hex: "#c3d3e0" }],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camisa social de corte slim em tricoline, ideal para ocasiões formais ou para compor um visual smart casual.",
    features: ["Tecido tricoline", "Corte slim", "Fácil de passar"],
    rating: 4.6,
    reviewCount: 5,
    featured: false,
    active: false,
    stockPerVariant: 0,
  },
  {
    slug: "camisa-flanela-xadrez",
    name: "Camisa Flanela Xadrez",
    category: "camisas",
    price: 159.9,
    sku: "IS-CS-002",
    colors: [{ name: "Xadrez Vermelho", hex: "#6b2b2b" }],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Camisa em flanela xadrez, manga longa, com toque macio e aconchegante para dias mais frios sem perder o estilo.",
    features: ["Flanela 100% algodão", "Manga longa", "Bolso frontal"],
    rating: 4.5,
    reviewCount: 4,
    featured: false,
    active: false,
    stockPerVariant: 0,
  },
  {
    slug: "jaqueta-corta-vento-preta",
    name: "Jaqueta Corta-Vento Preta",
    category: "jaquetas",
    price: 219.9,
    sku: "IS-JQ-001",
    colors: [PRETO],
    sizes: ["P", "M", "G", "GG"],
    description:
      "Jaqueta corta-vento leve e resistente, com capuz destacável. Proteção contra vento e chuva fina sem abrir mão do estilo urbano.",
    features: ["Tecido impermeável", "Capuz destacável", "Bolsos com zíper"],
    rating: 4.7,
    reviewCount: 6,
    featured: false,
    active: false,
    stockPerVariant: 0,
  },
  {
    slug: "jaqueta-bomber-jeans",
    name: "Jaqueta Bomber Jeans",
    category: "jaquetas",
    price: 249.9,
    sku: "IS-JQ-002",
    colors: [CINZA],
    sizes: ["P", "M", "G", "GG"],
    description: "Jaqueta bomber em jeans com forro quentinho. Peça statement para elevar qualquer produção do inverno.",
    features: ["Jeans premium", "Forro interno", "Punhos e barra em ribana"],
    tags: ["novo"],
    rating: 4.8,
    reviewCount: 3,
    featured: false,
    active: false,
    stockPerVariant: 0,
  },
  {
    slug: "bone-aba-reta-preto",
    name: "Boné Aba Reta Preto",
    category: "acessorios",
    price: 69.9,
    sku: "IS-AC-001",
    colors: [PRETO],
    sizes: ["Único"],
    description: "Boné aba reta com ajuste no snapback. Item essencial para completar qualquer look streetwear.",
    features: ["Aba reta", "Ajuste snapback", "Bordado frontal"],
    rating: 4.6,
    reviewCount: 15,
    featured: false,
    active: false,
    stockPerVariant: 0,
  },
  {
    slug: "corrente-prateada-aco-inox",
    name: "Corrente Prateada Aço Inox",
    category: "acessorios",
    price: 89.9,
    sku: "IS-AC-002",
    colors: [{ name: "Prata", hex: "#c7c9cc" }],
    sizes: ["Único"],
    description:
      "Corrente em aço inoxidável, antialérgica e resistente ao tempo. O acessório final para fechar sua produção com estilo.",
    features: ["Aço inoxidável", "Antialérgica", "60cm de comprimento"],
    rating: 4.5,
    reviewCount: 10,
    featured: false,
    active: false,
    stockPerVariant: 0,
  },
];

function slugifyCode(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 4);
}

async function main() {
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    // update vazio de propósito: o seed só cria a categoria na primeira vez.
    // Rodar de novo (ex.: a cada deploy) nunca deve sobrescrever uma edição
    // feita depois pelo painel administrativo.
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) throw new Error(`Categoria não encontrada: ${p.category}`);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        features: JSON.stringify(p.features),
        tags: JSON.stringify(p.tags ?? []),
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        sku: p.sku,
        featured: p.featured,
        active: p.active,
        rating: p.rating,
        reviewCount: p.reviewCount,
        categoryId,
      },
    });

    if (p.image) {
      const existingImages = await prisma.productImage.findMany({ where: { productId: product.id } });
      if (existingImages.length === 0) {
        const url = await seedImageUrl(p.image);
        await prisma.productImage.create({
          data: { productId: product.id, url, order: 0 },
        });
      }
    }

    const existingVariants = await prisma.productVariant.findMany({ where: { productId: product.id } });
    if (existingVariants.length === 0) {
      for (const color of p.colors) {
        for (const size of p.sizes) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              color: color.name,
              colorHex: color.hex,
              size,
              stock: p.stockPerVariant,
              sku: `${p.sku}-${slugifyCode(color.name)}-${slugifyCode(size)}`,
            },
          });
        }
      }
    }
  }

  console.log("Seeding site settings...");
  // update vazio de propósito: assim como as categorias, os valores default só
  // são criados na primeira vez. Rodar o seed de novo (a cada deploy) nunca
  // deve sobrescrever uma edição feita depois pelo painel administrativo.
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      heroEyebrow: "NACIONAIS & IMPORTADOS",
      heroTitle: "Estilo que\nfala por você",
      heroDescription:
        "Peças selecionadas para o homem moderno. Até 30% OFF em itens selecionados por tempo limitado.",
      heroCtaLabel: "Comprar agora",
      heroCtaUrl: "/categoria/camisetas",
      whatsappNumber: "5534996576357",
      whatsappMessage: "Olá! Vim pelo site da Inovação Store e gostaria de mais informações.",
      contactEmail: "inovacaostoretiktok@gmail.com",
      announcementItem1: "Frete grátis acima de R$ 299",
      announcementItem2: "Troca fácil em até 30 dias",
      announcementItem3: "Pagamento 100% seguro",
      announcementItem4: "Atendimento rápido pelo WhatsApp",
    },
  });

  console.log("Seeding admin user...");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Administrador";

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env — usuário admin não foi criado.");
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {},
      create: { name: adminName, email: adminEmail, passwordHash },
    });
    console.log(`Admin pronto: ${adminEmail}`);
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
