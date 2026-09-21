import { Router } from "express";
import { prisma } from "../db.js";
import { cacheLeituraPublica } from "../security.js";

export const categoriesRouter = Router();

/**
 * Categorias da vitrine, cada uma já com a foto de capa.
 *
 * A capa vem daqui de propósito: antes a home baixava o CATÁLOGO INTEIRO
 * (`/api/products` sem filtro, com imagens, variações e categoria de cada
 * produto) só para escolher uma foto por categoria. Com 8 produtos isso já
 * custava 12,9 KB; com o catálogo crescendo, viraria centenas de KB em toda
 * visita. O `distinct` resolve em uma consulta enxuta: o produto mais recente
 * de cada categoria, trazendo apenas a primeira imagem dele.
 */
categoriesRouter.get("/", cacheLeituraPublica(120), async (_req, res) => {
  const [categories, capas] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.product.findMany({
      where: { active: true, images: { some: {} } },
      distinct: ["categoryId"],
      orderBy: { createdAt: "desc" },
      select: {
        categoryId: true,
        images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      },
    }),
  ]);

  const capaPorCategoria = new Map(capas.map((p) => [p.categoryId, p.images[0]?.url]));

  res.json(
    categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      coverImage: capaPorCategoria.get(c.id) ?? null,
    })),
  );
});
