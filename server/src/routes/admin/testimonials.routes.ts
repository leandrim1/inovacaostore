import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { PENDING_STATUS, TESTIMONIAL_STATUSES } from "../../testimonialStatus.js";

export const adminTestimonialsRouter = Router();

const testimonialInclude = {
  customer: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TestimonialInclude;

type TestimonialWithCustomer = Prisma.TestimonialGetPayload<{ include: typeof testimonialInclude }>;

function serialize(t: TestimonialWithCustomer) {
  return {
    id: t.id,
    name: t.name,
    city: t.city,
    rating: t.rating,
    quote: t.quote,
    status: t.status,
    featured: t.featured,
    order: t.order,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    // Quem enviou — o admin vê, o site nunca expõe.
    customer: t.customer ? { id: t.customer.id, name: t.customer.name, email: t.customer.email } : null,
  };
}

adminTestimonialsRouter.get("/", async (req, res) => {
  const { status } = req.query;
  const where: Prisma.TestimonialWhereInput = {};
  if (typeof status === "string" && (TESTIMONIAL_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }

  const [items, pendingCount] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      include: testimonialInclude,
      // Pendentes primeiro: a fila de moderação é o uso principal desta tela.
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.testimonial.count({ where: { status: PENDING_STATUS } }),
  ]);

  res.json({ items: items.map(serialize), pendingCount });
});

const updateSchema = z.object({
  status: z.enum(TESTIMONIAL_STATUSES).optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
  name: z.string().trim().min(2).max(60).optional(),
  city: z.string().trim().max(60).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  quote: z.string().trim().min(5).max(500).optional(),
});

adminTestimonialsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.quote !== undefined ? { quote: data.quote } : {}),
      },
      include: testimonialInclude,
    });
    res.json(serialize(testimonial));
  } catch (err) {
    handleError(err, res);
  }
});

adminTestimonialsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
});

function handleError(err: unknown, res: import("express").Response) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    res.status(404).json({ error: "Depoimento não encontrado." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
