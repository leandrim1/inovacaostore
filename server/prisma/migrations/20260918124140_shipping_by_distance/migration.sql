-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "volumeM3" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingDistanceKm" DOUBLE PRECISION,
ADD COLUMN     "shippingMethod" TEXT;

-- CreateTable
CREATE TABLE "ShippingTier" (
    "id" TEXT NOT NULL,
    "minKm" DOUBLE PRECISION NOT NULL,
    "maxKm" DOUBLE PRECISION,
    "price" DOUBLE PRECISION NOT NULL,
    "etaLabel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "freeShippingMinOrderValue" DOUBLE PRECISION,
    "freeShippingRegions" TEXT NOT NULL DEFAULT '[]',
    "minShippingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerExtraKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeVolumeM3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerExtraM3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fallbackFlatPrice" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CepGeocodeCache" (
    "cep" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CepGeocodeCache_pkey" PRIMARY KEY ("cep")
);

-- Seed: origem da loja (Patos de Minas - MG, coordenada aproximada do
-- centro da cidade; ajuste fino disponivel na pagina admin de frete)
-- e as faixas de distancia padrao pedidas.
INSERT INTO "ShippingSettings" ("id", "originLat", "originLng", "updatedAt")
VALUES ('singleton', -18.578, -46.518, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ShippingTier" ("id", "minKm", "maxKm", "price", "etaLabel", "order", "updatedAt") VALUES
('shptier_01', 0, 20, 10.00, '1 a 2 dias úteis', 0, CURRENT_TIMESTAMP),
('shptier_02', 20, 50, 15.00, '2 a 4 dias úteis', 1, CURRENT_TIMESTAMP),
('shptier_03', 50, 100, 20.00, '3 a 5 dias úteis', 2, CURRENT_TIMESTAMP),
('shptier_04', 100, 200, 30.00, '4 a 6 dias úteis', 3, CURRENT_TIMESTAMP),
('shptier_05', 200, 300, 40.00, '5 a 7 dias úteis', 4, CURRENT_TIMESTAMP),
('shptier_06', 300, 500, 55.00, '5 a 8 dias úteis', 5, CURRENT_TIMESTAMP),
('shptier_07', 500, 750, 70.00, '6 a 9 dias úteis', 6, CURRENT_TIMESTAMP),
('shptier_08', 750, 1000, 90.00, '7 a 10 dias úteis', 7, CURRENT_TIMESTAMP),
('shptier_09', 1000, 1500, 120.00, '8 a 12 dias úteis', 8, CURRENT_TIMESTAMP),
('shptier_10', 1500, 2000, 150.00, '10 a 15 dias úteis', 9, CURRENT_TIMESTAMP),
('shptier_11', 2000, NULL, 180.00, '12 a 20 dias úteis', 10, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
