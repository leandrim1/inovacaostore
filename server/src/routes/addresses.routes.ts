import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireCustomerAuth } from "../middleware/requireCustomer.js";

/**
 * Caderninho de endereços do cliente.
 *
 * Regra que vale para TODAS as rotas daqui: o dono vem da sessão
 * (`req.customer!.sub`) e entra no `where` junto com o id. Nunca
 * `findUnique({ where: { id } })` seguido de uma conferência depois — com o
 * dono no próprio filtro, o endereço de outra pessoa simplesmente não é
 * encontrado, e não existe caminho em que um `if` esquecido vire vazamento.
 */
export const customerAddressesRouter = Router();

customerAddressesRouter.use(requireCustomerAuth);

/** Teto por conta: o caderninho é do cliente, não um depósito aberto de escrita. */
const MAX_ADDRESSES = 10;

const addressSchema = z.object({
  label: z.string().trim().max(40).default(""),
  recipient: z.string().trim().max(80).default(""),
  phone: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 13), "Telefone inválido.")
    .default(""),
  cep: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, "CEP inválido."),
  street: z.string().trim().min(1, "Informe o endereço.").max(120),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: z.string().trim().max(60).default(""),
  neighborhood: z.string().trim().min(1, "Informe o bairro.").max(80),
  city: z.string().trim().min(1, "Informe a cidade.").max(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => /^[A-Z]{2}$/.test(v), "UF inválida."),
  isDefault: z.boolean().default(false),
});

/**
 * Deixa `addressId` como o único padrão do cliente.
 *
 * Em transação porque são duas escritas: sem ela, uma falha no meio deixaria
 * o cliente com zero padrões (ou com dois, se a ordem invertesse).
 */
function promoteToDefault(customerId: string, addressId: string) {
  return prisma.$transaction([
    prisma.customerAddress.updateMany({
      where: { customerId, isDefault: true, NOT: { id: addressId } },
      data: { isDefault: false },
    }),
    prisma.customerAddress.updateMany({
      where: { id: addressId, customerId },
      data: { isDefault: true },
    }),
  ]);
}

customerAddressesRouter.get("/", async (req, res) => {
  const items = await prisma.customerAddress.findMany({
    where: { customerId: req.customer!.sub },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  res.json({ items });
});

customerAddressesRouter.post("/", async (req, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const customerId = req.customer!.sub;
  const total = await prisma.customerAddress.count({ where: { customerId } });
  if (total >= MAX_ADDRESSES) {
    res.status(400).json({ error: `Você pode salvar no máximo ${MAX_ADDRESSES} endereços.` });
    return;
  }

  // O primeiro endereço sempre vira o padrão: senão o cliente salva um
  // endereço, volta ao checkout e não encontra nenhum pré-selecionado.
  const { isDefault, ...data } = parsed.data;
  const deveSerPadrao = isDefault || total === 0;

  const address = await prisma.customerAddress.create({
    data: { ...data, customerId, isDefault: false },
  });
  if (deveSerPadrao) await promoteToDefault(customerId, address.id);

  res.status(201).json({ address: { ...address, isDefault: deveSerPadrao } });
});

customerAddressesRouter.patch("/:id", async (req, res) => {
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." });
    return;
  }

  const customerId = req.customer!.sub;
  const { isDefault, ...data } = parsed.data;

  // `updateMany` com o dono no filtro: o de outra pessoa dá count 0, e a
  // resposta é 404 -- nunca "não autorizado", que confirmaria que o id existe.
  const { count } = await prisma.customerAddress.updateMany({
    where: { id: req.params.id, customerId },
    data,
  });
  if (count === 0) {
    res.status(404).json({ error: "Endereço não encontrado." });
    return;
  }

  // `isDefault: false` explícito é ignorado: tirar o padrão sem escolher
  // outro deixaria a conta sem nenhum. Para trocar, promove-se o novo.
  if (isDefault === true) await promoteToDefault(customerId, req.params.id);

  const address = await prisma.customerAddress.findFirst({ where: { id: req.params.id, customerId } });
  res.json({ address });
});

customerAddressesRouter.post("/:id/padrao", async (req, res) => {
  const customerId = req.customer!.sub;
  const existe = await prisma.customerAddress.findFirst({
    where: { id: req.params.id, customerId },
    select: { id: true },
  });
  if (!existe) {
    res.status(404).json({ error: "Endereço não encontrado." });
    return;
  }

  await promoteToDefault(customerId, req.params.id);
  res.json({ ok: true });
});

customerAddressesRouter.delete("/:id", async (req, res) => {
  const customerId = req.customer!.sub;
  const alvo = await prisma.customerAddress.findFirst({
    where: { id: req.params.id, customerId },
    select: { id: true, isDefault: true },
  });
  if (!alvo) {
    res.status(404).json({ error: "Endereço não encontrado." });
    return;
  }

  await prisma.customerAddress.delete({ where: { id: alvo.id } });

  // Apagou o padrão? O mais antigo que sobrou assume, para a conta nunca
  // ficar com endereços salvos e nenhum pré-selecionado no checkout.
  if (alvo.isDefault) {
    const proximo = await prisma.customerAddress.findFirst({
      where: { customerId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (proximo) await promoteToDefault(customerId, proximo.id);
  }

  res.status(204).end();
});
