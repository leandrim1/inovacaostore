-- Faixa de benefícios da home editável pelo painel.
--
-- Os DEFAULTs são exatamente os textos e ícones que estavam fixos no
-- componente, então a linha singleton já existente passa a ter os mesmos
-- valores de antes: a loja não muda nada até o lojista editar.
ALTER TABLE "SiteSettings"
  ADD COLUMN "benefit1Icon"  TEXT NOT NULL DEFAULT 'truck',
  ADD COLUMN "benefit1Title" TEXT NOT NULL DEFAULT 'Frete grátis',
  ADD COLUMN "benefit1Text"  TEXT NOT NULL DEFAULT 'Em compras acima de R$ 299 para todo o Brasil.',
  ADD COLUMN "benefit2Icon"  TEXT NOT NULL DEFAULT 'refresh',
  ADD COLUMN "benefit2Title" TEXT NOT NULL DEFAULT 'Troca fácil',
  ADD COLUMN "benefit2Text"  TEXT NOT NULL DEFAULT 'Até 30 dias para trocar ou devolver sem complicação.',
  ADD COLUMN "benefit3Icon"  TEXT NOT NULL DEFAULT 'shield',
  ADD COLUMN "benefit3Title" TEXT NOT NULL DEFAULT 'Pagamento seguro',
  ADD COLUMN "benefit3Text"  TEXT NOT NULL DEFAULT 'Ambiente 100% protegido com múltiplas formas de pagamento.',
  ADD COLUMN "benefit4Icon"  TEXT NOT NULL DEFAULT 'headset',
  ADD COLUMN "benefit4Title" TEXT NOT NULL DEFAULT 'Atendimento rápido',
  ADD COLUMN "benefit4Text"  TEXT NOT NULL DEFAULT 'Suporte pelo WhatsApp para tirar suas dúvidas na hora.';
