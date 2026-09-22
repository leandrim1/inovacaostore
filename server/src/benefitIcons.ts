/**
 * Ícones que o lojista pode escolher para a faixa de benefícios da home.
 *
 * O banco guarda só a chave; quem transforma a chave em desenho é o
 * frontend (src/lib/benefitIcons.ts). A lista é fechada de propósito: o
 * servidor recusa qualquer outra chave, então o painel não consegue gravar
 * nada que a loja não saiba mostrar.
 *
 * MANTENHA EM SINCRONIA com BENEFIT_ICONS em src/lib/benefitIcons.ts —
 * uma chave nova precisa existir nos dois lados.
 */
export const BENEFIT_ICON_KEYS = [
  "truck",
  "refresh",
  "shield",
  "headset",
  "card",
  "percent",
  "gift",
  "package",
  "clock",
  "store",
  "star",
  "chat",
  "pin",
  "sparkles",
  "tag",
  "award",
] as const;

export type BenefitIconKey = (typeof BENEFIT_ICON_KEYS)[number];
