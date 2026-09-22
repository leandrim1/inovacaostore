-- Cache do endereço de um CEP, para o formulário se preencher sozinho.
--
-- Tabela própria, e não colunas novas em "CepGeocodeCache": aquela exige
-- lat/lng (o frete depende delas) e um CEP pode ter endereço conhecido sem
-- coordenada. Juntar os dois obrigaria a inventar uma coordenada ou a
-- guardar linha pela metade.
CREATE TABLE "CepAddressCache" (
    "cep" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CepAddressCache_pkey" PRIMARY KEY ("cep")
);
