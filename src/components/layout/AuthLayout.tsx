import type { ReactNode } from "react";
import heroImage from "../../assets/images/otimizadas/hero-friends.webp";
import { Logo } from "../ui/Logo";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * Layout compartilhado por login/cadastro/verificação/recuperação de senha —
 * um cartão flutuante genérico em fundo vazio virou um split-screen editorial,
 * com o painel escuro reforçando a marca em vez de deixar metade da tela em branco.
 */
export function AuthLayout({ eyebrow, title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid lg:min-h-[640px] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-ink lg:block">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_65%] opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo tone="dark" />
          <div className="max-w-sm border-l-2 border-brand-yellow pl-6">
            <p className="font-display text-4xl leading-[0.9] text-white xl:text-5xl">
              Estilo que fala por você.
            </p>
            <p className="mt-4 text-sm text-white/60">
              Peças nacionais e importadas, com curadoria para o homem moderno.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-brand-cream px-4 py-14 sm:px-8">
        <div className="w-full max-w-sm">
          <p className="rotulo mb-3 text-neutral-500">{eyebrow}</p>
          <h1 className="section-title text-3xl">{title}</h1>
          {subtitle && <p className="mt-3 text-sm text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
