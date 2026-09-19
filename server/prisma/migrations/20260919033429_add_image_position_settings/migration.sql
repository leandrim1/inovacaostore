-- Enquadramento de imagem (posição/zoom/rotação) por breakpoint, definido pelo
-- admin. Colunas nullable e aditivas: nenhuma linha existente muda de
-- comportamento até que o admin ajuste explicitamente uma imagem.
ALTER TABLE "HeroImage" ADD COLUMN "desktopSettings" JSONB;
ALTER TABLE "HeroImage" ADD COLUMN "mobileSettings" JSONB;

ALTER TABLE "ProductImage" ADD COLUMN "desktopSettings" JSONB;
ALTER TABLE "ProductImage" ADD COLUMN "mobileSettings" JSONB;

ALTER TABLE "Promotion" ADD COLUMN "desktopSettings" JSONB;
ALTER TABLE "Promotion" ADD COLUMN "mobileSettings" JSONB;
