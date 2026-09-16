import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// SQLite só permite um gravador por vez. Em WAL, leituras não bloqueiam a
// escrita (e vice-versa), e o `busy_timeout` faz o próprio SQLite aguardar
// a liberação do lock em vez de falhar imediatamente quando duas requisições
// tentam escrever ao mesmo tempo (ex.: duas compras simultâneas) — reduz bem
// os erros de concorrência sem mudar a lógica de negócio.
// Ambos os PRAGMAs retornam o valor aplicado (não são DML), por isso usamos
// $queryRawUnsafe em vez de $executeRawUnsafe.
await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 10000;");
