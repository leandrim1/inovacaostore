-- Endereços salvos do cliente.
--
-- Até aqui o endereço só existia dentro de cada pedido, redigitado a cada
-- compra. Esta tabela é o caderninho do cliente; `Order` continua com a
-- própria cópia de propósito -- editar um endereço salvo não pode reescrever
-- para onde um pedido antigo foi enviado.
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    -- Apelido do cliente ("Minha casa", "Trabalho").
    "label" TEXT NOT NULL DEFAULT '',
    "recipient" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "cep" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT NOT NULL DEFAULT '',
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    -- O checkout começa neste.
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- Apagar a conta leva junto o caderninho de endereços dela.
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Um só endereço padrão por cliente. A rota já cuida disso numa transação,
-- mas o índice é a rede de segurança: se um dia dois caminhos gravarem ao
-- mesmo tempo, o banco recusa em vez de deixar o cliente com dois padrões.
CREATE UNIQUE INDEX "CustomerAddress_one_default_per_customer"
    ON "CustomerAddress"("customerId") WHERE "isDefault";
