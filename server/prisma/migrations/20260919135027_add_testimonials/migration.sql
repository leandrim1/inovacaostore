-- Depoimentos enviados pelos clientes, exibidos no site apenas após aprovação
-- do admin. `customerId` é nulo nos depoimentos vindos do conteúdo fixo antigo.
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL,
    "quote" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Testimonial_status_createdAt_idx" ON "Testimonial"("status", "createdAt");

CREATE INDEX "Testimonial_customerId_idx" ON "Testimonial"("customerId");

ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
