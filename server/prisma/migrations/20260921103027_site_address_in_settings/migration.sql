-- Endereço da loja passa a ser editável pelo painel (Configurações).
-- Os defaults são exatamente o endereço que já estava fixo no código, para
-- que o site continue mostrando a mesma coisa logo após a migração.
ALTER TABLE "SiteSettings" ADD COLUMN     "addressStreet" TEXT NOT NULL DEFAULT 'Rua Ouro Preto, 784',
ADD COLUMN     "addressCity" TEXT NOT NULL DEFAULT 'Patos de Minas',
ADD COLUMN     "addressState" TEXT NOT NULL DEFAULT 'MG',
ADD COLUMN     "addressZip" TEXT NOT NULL DEFAULT '38700-000';
