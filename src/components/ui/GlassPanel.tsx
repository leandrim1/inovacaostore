import type { HTMLAttributes, ReactNode } from "react";

/** Painel de vidro fosco (barras flutuantes, folhas, avisos). */
export function GlassPanel({
  tom = "escuro",
  className = "",
  children,
  ...resto
}: { tom?: "escuro" | "claro"; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${tom === "escuro" ? "vidro-escuro text-white" : "vidro-claro text-brand-ink"} ${className}`} {...resto}>
      {children}
    </div>
  );
}
