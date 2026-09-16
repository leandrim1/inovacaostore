import { Link } from "react-router-dom";

function BeeMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="100" height="100" rx="24" fill="#F5C400" />
      <g fill="#141414">
        <ellipse cx="50" cy="63" rx="11" ry="15" />
        <rect x="39" y="55" width="22" height="5" fill="#F5C400" />
        <rect x="39" y="65" width="22" height="5" fill="#F5C400" />
        <path d="M50 50 L50 33" stroke="#141414" strokeWidth="5" strokeLinecap="round" />
        <path d="M50 36c0-8 7-14 15-11 3 6-2 13-9 14-3 .5-6-1-6-3z" />
        <path d="M50 36c0-13-9-20-19-16-4 8 3 17 12 18 4 .6 7-.5 7-2z" />
        <circle cx="41" cy="42" r="6" />
        <path d="M58 40c4-1 8 1 9 5-2 3-6 3-9 1-2-1-2-4 0-6z" />
      </g>
    </svg>
  );
}

interface LogoProps {
  variant?: "dark" | "light";
  showText?: boolean;
}

export function Logo({ variant = "dark", showText = true }: LogoProps) {
  const textColor = variant === "dark" ? "text-brand-ink" : "text-white";
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Inovação Store - Início">
      <BeeMark />
      {showText && (
        <span className={`font-display leading-none tracking-wide ${textColor}`}>
          <span className="block text-lg sm:text-xl">Inovação</span>
          <span className="-mt-1 block text-[10px] tracking-[0.35em] text-brand-yellow-dark">
            STORE
          </span>
        </span>
      )}
    </Link>
  );
}
