-- CreateTable
CREATE TABLE "HeroImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeroImage_pkey" PRIMARY KEY ("id")
);

-- Preserva uma eventual imagem de hero já enviada antes desta migration,
-- movendo-a para a nova tabela de carrossel em vez de perdê-la.
INSERT INTO "HeroImage" ("id", "url", "order", "createdAt")
SELECT gen_random_uuid()::text, "heroImageUrl", 0, CURRENT_TIMESTAMP
FROM "SiteSettings"
WHERE "heroImageUrl" IS NOT NULL;

-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "heroImageUrl";
