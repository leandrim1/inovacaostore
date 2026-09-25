-- Histórico de importações em massa de produtos.
--
-- Tabela nova e isolada: nada muda nas tabelas de produtos, categorias,
-- variações ou imagens, então o cadastro manual continua exatamente igual.
CREATE TABLE "ProductImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'processando',
    "total" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "createdProductIds" TEXT[],
    "errors" JSONB NOT NULL DEFAULT '[]',
    "undoneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductImport_createdAt_idx" ON "ProductImport"("createdAt");
