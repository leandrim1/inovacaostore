import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db.js";

export const adminFinanceRouter = Router();

const settingsSchema = z.object({
  paymentFeePixPct: z.number().min(0),
  paymentFeeCardPct: z.number().min(0),
  paymentFeeBoletoPct: z.number().min(0),
  paymentFeeOtherPct: z.number().min(0),
  platformFeePct: z.number().min(0),
  includeCancelledOrders: z.boolean(),
  includeRefundedOrders: z.boolean(),
});

adminFinanceRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.financeSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    res.status(404).json({ error: "Configurações financeiras ainda não inicializadas." });
    return;
  }
  res.json(settings);
});

adminFinanceRouter.put("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }

  const settings = await prisma.financeSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  res.json(settings);
});

const EXPENSE_CATEGORIES = ["embalagem", "marketing", "comissao", "operacional", "outro"] as const;

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().default(""),
  amount: z.number().positive(),
  occurredAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida.")
    .transform((v) => new Date(v)),
});

/**
 * Monta o payload do Prisma campo a campo, em vez de repassar `parsed.data`
 * inteiro.
 *
 * O schema acima já garante os valores em tempo de execução, mas o TIPO que o
 * zod infere para um `.transform()` dentro de objeto varia entre versões —
 * numa delas `occurredAt` sai como opcional e o Prisma (que o exige) recusa o
 * objeto na compilação. Sendo explícito aqui, o código compila igual nos dois
 * casos e o contrato com o banco fica visível.
 */
function toExpenseData(data: z.infer<typeof expenseSchema>) {
  return {
    category: data.category,
    description: data.description ?? "",
    amount: data.amount,
    occurredAt: data.occurredAt ?? new Date(),
  };
}

adminFinanceRouter.get("/expenses", async (_req, res) => {
  const expenses = await prisma.expense.findMany({ orderBy: { occurredAt: "desc" } });
  res.json({ items: expenses });
});

adminFinanceRouter.post("/expenses", async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const expense = await prisma.expense.create({ data: toExpenseData(parsed.data) });
  res.status(201).json(expense);
});

adminFinanceRouter.put("/expenses/:id", async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Despesa não encontrada." });
    return;
  }
  const expense = await prisma.expense.update({ where: { id: req.params.id }, data: toExpenseData(parsed.data) });
  res.json(expense);
});

adminFinanceRouter.delete("/expenses/:id", async (req, res) => {
  const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Despesa não encontrada." });
    return;
  }
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
