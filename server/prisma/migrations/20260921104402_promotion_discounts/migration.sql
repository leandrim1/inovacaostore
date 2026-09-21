-- Promoções deixam de ser apenas banner e passam a descontar de verdade.
-- Tudo aditivo e com default: discountValue = 0 significa "só banner", que é
-- exatamente como as promoções já existentes se comportam hoje.

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "startsAt" TIMESTAMP(3),
ADD COLUMN     "discountType" TEXT NOT NULL DEFAULT 'percent',
ADD COLUMN     "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discountScope" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "promotionDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "originalPrice" DOUBLE PRECISION,
ADD COLUMN     "promotionId" TEXT,
ADD COLUMN     "promotionTitle" TEXT;

-- CreateTable
CREATE TABLE "PromotionProduct" (
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("promotionId","productId")
);

-- CreateIndex
CREATE INDEX "PromotionProduct_productId_idx" ON "PromotionProduct"("productId");

-- CreateIndex
CREATE INDEX "Promotion_active_startsAt_endsAt_idx" ON "Promotion"("active", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
