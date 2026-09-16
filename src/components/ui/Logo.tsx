import { Link } from "react-router-dom";
import logoImage from "../../assets/images/logo.jpg";

interface LogoProps {
  size?: number;
}

export function Logo({ size = 44 }: LogoProps) {
  return (
    <Link to="/" className="flex items-center" aria-label="Inovação Store - Início">
      <img
        src={logoImage}
        alt="Inovação Store"
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    </Link>
  );
}
