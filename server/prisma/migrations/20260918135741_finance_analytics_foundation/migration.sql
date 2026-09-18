-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ShippingTier" ADD COLUMN     "costPrice" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateTable
CREATE TABLE "FinanceSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "paymentFeePixPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentFeeCardPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentFeeBoletoPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentFeeOtherPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFeePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includeCancelledOrders" BOOLEAN NOT NULL DEFAULT false,
    "includeRefundedOrders" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_occurredAt_idx" ON "Expense"("occurredAt");

-- Seed: linha singleton com todas as taxas em 0 — números de lucro só
-- refletem taxas reais depois que o admin configurar em /admin/financeiro.
INSERT INTO "FinanceSettings" ("id", "updatedAt")
VALUES ('singleton', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
