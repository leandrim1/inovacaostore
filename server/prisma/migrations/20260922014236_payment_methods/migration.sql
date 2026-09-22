-- Bandeiras e formas de pagamento da faixa do rodapé, gerenciadas pelo painel.
-- Enquanto a tabela estiver vazia, o site mostra o conjunto desenhado em
-- código (src/components/ui/paymentBrands.tsx), então a faixa nunca aparece
-- quebrada.
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    -- Nome da bandeira. Vai para o leitor de tela e para o `title` da
    -- pastilha; começa vazio porque o upload é múltiplo e o servidor não tem
    -- como saber qual arquivo é qual.
    "label" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);
