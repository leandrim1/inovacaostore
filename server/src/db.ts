import { PrismaClient } from "@prisma/client";

// Em serverless (Vercel), o módulo pode ser reavaliado a cada invocação fria,
// e em dev o `tsx watch` recarrega o módulo a cada mudança — guardar a
// instância em `globalThis` evita abrir uma conexão nova (e esgotar o limite
// do Postgres) a cada uma dessas reavaliações.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
