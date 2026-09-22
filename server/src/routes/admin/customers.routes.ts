import { Router } from "express";
import { prisma } from "../../db.js";
import { effectiveSalesWhere, getSalesRules } from "../../analytics/rules.js";

export const adminCustomersRouter = Router();

/**
 * Recorte do cadastro que pode sair para o painel. Lista explícita em vez de
 * espalhar a linha inteira: `passwordHash` e `sessionsValidFrom` NUNCA saem
 * daqui, nem por acidente quando o schema ganhar um campo novo.
 */
const CUSTOMER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  emailVerified: true,
  createdAt: true,
  /// Preenchido = o cliente pediu a exclusão e o cadastro foi anonimizado.
  anonymizedAt: true,
} as const;

interface CustomerStats {
  /** Todos os pedidos, inclusive cancelados/reembolsados. */
  ordersCount: number;
  /** Só o que conta como venda efetiva (mesma regra do dashboard). */
  paidOrdersCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

const EMPTY_STATS: CustomerStats = {
  ordersCount: 0,
  paidOrdersCount: 0,
  totalSpent: 0,
  lastOrderAt: null,
};

/**
 * Totais por cliente em duas consultas agregadas — nunca carregando os
 * pedidos para somar em memória, que viraria lento assim que a loja crescer.
 *
 * "Total gasto" usa `effectiveSalesWhere`, a MESMA função que o dashboard
 * financeiro usa para decidir o que é venda. Se aqui o filtro fosse
 * reescrito à mão, a soma de um cliente e o faturamento do dashboard
 * passariam a discordar no dia em que a regra mudasse.
 */
async function loadCustomerStats(customerIds: string[]): Promise<Map<string, CustomerStats>> {
  const stats = new Map<string, CustomerStats>();
  if (customerIds.length === 0) return stats;

  const rules = await getSalesRules();
  const [all, effective] = await Promise.all([
    prisma.order.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customerIds } },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customerIds }, ...effectiveSalesWhere(rules) },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  for (const row of all) {
    stats.set(row.customerId, {
      ...EMPTY_STATS,
      ordersCount: row._count._all,
      lastOrderAt: row._max.createdAt,
    });
  }
  for (const row of effective) {
    const current = stats.get(row.customerId) ?? { ...EMPTY_STATS };
    stats.set(row.customerId, {
      ...current,
      paidOrdersCount: row._count._all,
      totalSpent: row._sum.total ?? 0,
    });
  }

  return stats;
}

adminCustomersRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  // O telefone é gravado de dois jeitos (o checkout guarda como a pessoa
  // digitou, a edição na área do cliente guarda só dígitos), então a busca
  // tenta os dois — senão procurar "34996576357" não acharia quem comprou
  // digitando "(34) 99657-6357".
  const digits = q.replace(/\D/g, "");

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
          ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
        ],
      }
    : {};

  const rows = await prisma.customer.findMany({
    where,
    select: { ...CUSTOMER_SELECT, passwordHash: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const stats = await loadCustomerStats(rows.map((c) => c.id));

  const items = rows.map(({ passwordHash, ...customer }) => ({
    ...customer,
    // Quem comprou como convidado existe como cadastro sem senha. O painel
    // mostra isso em vez de fingir que é uma conta com login.
    hasAccount: passwordHash !== null,
    ...(stats.get(customer.id) ?? EMPTY_STATS),
  }));

  res.json({ items });
});

adminCustomersRouter.get("/:id", async (req, res) => {
  const row = await prisma.customer.findUnique({
    where: { id: req.params.id },
    select: { ...CUSTOMER_SELECT, passwordHash: true },
  });
  if (!row) {
    res.status(404).json({ error: "Cliente não encontrado." });
    return;
  }

  const { passwordHash, ...customer } = row;
  const [orders, addresses, stats] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    loadCustomerStats([customer.id]),
  ]);

  res.json({
    customer: { ...customer, hasAccount: passwordHash !== null, ...(stats.get(customer.id) ?? EMPTY_STATS) },
    orders,
    addresses,
  });
});
