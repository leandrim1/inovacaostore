interface BadgeProps {
  tag: "novo" | "mais-vendido" | "importado" | "ultimas-unidades";
}

const LABELS: Record<BadgeProps["tag"], string> = {
  novo: "Novo",
  "mais-vendido": "Mais vendido",
  importado: "Importado",
  "ultimas-unidades": "Últimas unidades",
};

const STYLES: Record<BadgeProps["tag"], string> = {
  novo: "bg-brand-ink text-white",
  "mais-vendido": "bg-brand-yellow text-brand-ink",
  importado: "bg-white text-brand-ink border border-brand-ink/20",
  "ultimas-unidades": "bg-red-600 text-white",
};

export function Badge({ tag }: BadgeProps) {
  return (
    <span
      className={`rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] ${STYLES[tag]}`}
    >
      {LABELS[tag]}
    </span>
  );
}
