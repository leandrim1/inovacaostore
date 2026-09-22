-- Marca de conta excluída pelo próprio cliente.
--
-- A exclusão anonimiza em vez de apagar a linha: apagar levaria junto os
-- pedidos, e com eles o faturamento, o lucro e o histórico que o lojista
-- precisa para fechar o mês. Com esta coluna o painel consegue dizer "conta
-- excluída em tal data" em vez de mostrar um cliente chamado
-- "Cliente removido" sem explicação.
ALTER TABLE "Customer" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
