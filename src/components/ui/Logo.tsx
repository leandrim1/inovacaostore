import { Link } from "react-router-dom";
import logoImage from "../../assets/images/otimizadas/logo.webp";

interface LogoProps {
  size?: number;
  wordmark?: boolean;
  tone?: "light" | "dark";
}

export function Logo({ size = 44, wordmark = true, tone = "light" }: LogoProps) {
  const titleColor = tone === "dark" ? "text-white" : "text-brand-ink";

  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Inovação Store - Início">
      <img
        src={logoImage}
        alt=""
        width={size}
        height={size}
        className="rounded-xl object-cover ring-1 ring-black/10 transition-transform duration-300 group-hover:-rotate-3"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-lg tracking-[0.06em] ${titleColor}`}>Inovação</span>
          <span className="font-display text-[10px] tracking-[0.5em] text-brand-yellow-dark">Store</span>
        </span>
      )}
    </Link>
  );
}
