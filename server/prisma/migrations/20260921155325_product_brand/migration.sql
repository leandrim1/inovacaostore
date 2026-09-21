-- Marca do produto, para o filtro por marca nas categorias.
-- Default vazio: produtos já cadastrados continuam válidos e simplesmente não
-- aparecem em nenhum filtro de marca até o lojista preencher.
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
