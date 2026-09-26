import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Botão com aparência física: volume, luz no topo e uma "espessura" embaixo;
 * afunda no toque e volta com um quique ao soltar (ver `.btn-3d-*` em
 * index.css). É o mesmo visual que os `.btn-*` ganham dentro da loja — este
 * componente só junta as classes e resolve botão × link.
 */
type Variante = "accent" | "primary" | "outline";

interface Comum {
  variante?: Variante;
  /** "lg" é o CTA principal: alvo de toque mais alto e texto maior. */
  tamanho?: "md" | "lg";
  className?: string;
  children: ReactNode;
}

type ComoLink = Comum & { to: string; onClick?: () => void };
type ComoBotao = Comum & { to?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const BASE: Record<Variante, string> = {
  accent: "btn-accent btn-3d-accent",
  primary: "btn-primary btn-3d-primary",
  outline: "btn-outline btn-3d-outline",
};

export function Button3D(props: ComoLink | ComoBotao) {
  const { variante = "accent", tamanho = "md", className = "", children } = props;
  const classes = `${BASE[variante]} ${tamanho === "lg" ? "min-h-[52px] px-8 text-[15px]" : ""} disabled:cursor-not-allowed disabled:opacity-40 ${className}`;

  if (props.to !== undefined) {
    return (
      <Link to={props.to} onClick={props.onClick} className={classes}>
        {children}
      </Link>
    );
  }

  const { variante: _v, tamanho: _t, className: _c, children: _ch, to: _to, type = "button", ...resto } = props;
  return (
    <button type={type} className={classes} {...resto}>
      {children}
    </button>
  );
}
