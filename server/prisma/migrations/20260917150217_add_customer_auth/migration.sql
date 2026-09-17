-- Normaliza o e-mail para minúsculas (o app já grava assim, mas garante consistência)
UPDATE "Customer" SET "email" = LOWER("email");

-- Deduplicação defensiva: antes de exigir e-mail único, funde qualquer
-- Customer duplicado (mesmo e-mail) que possa existir de pedidos antigos como
-- convidado, transferindo os pedidos para o registro mais antigo e removendo
-- os demais. Necessário para a migration não falhar em produção.
WITH ranked AS (
  SELECT "id", "email", ROW_NUMBER() OVER (PARTITION BY "email" ORDER BY "createdAt" ASC) AS rn
  FROM "Customer"
),
canonical AS (
  SELECT dup."id" AS dup_id, keep."id" AS keep_id
  FROM ranked dup
  JOIN ranked keep ON dup."email" = keep."email" AND keep.rn = 1
  WHERE dup.rn > 1
)
UPDATE "Order" o
SET "customerId" = canonical.keep_id
FROM canonical
WHERE o."customerId" = canonical.dup_id;

DELETE FROM "Customer" c
USING (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "email" ORDER BY "createdAt" ASC) AS rn
  FROM "Customer"
) ranked
WHERE c."id" = ranked."id" AND ranked.rn > 1;

-- AlterTable
ALTER TABLE "Customer"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailVerification_customerId_idx" ON "EmailVerification"("customerId");

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordReset_customerId_idx" ON "PasswordReset"("customerId");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
