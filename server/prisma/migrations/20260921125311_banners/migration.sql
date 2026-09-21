-- Faixa de imagens acima das Categorias, gerenciada pelo painel.
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "linkUrl" TEXT,
    "desktopSettings" JSONB,
    "mobileSettings" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
