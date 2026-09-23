-- Foto de perfil do cliente. Nula para todas as contas existentes: quem não
-- enviou foto continua vendo as iniciais, exatamente como antes.
ALTER TABLE "Customer" ADD COLUMN "avatarUrl" TEXT;
