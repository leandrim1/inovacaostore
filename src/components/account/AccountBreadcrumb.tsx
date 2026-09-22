import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Trilha das sub-páginas da conta ("Minha conta / Meus dados").
 *
 * Existe para o cliente saber onde está e ter um caminho de volta de um
 * clique — sem ela, a única saída de uma sub-página é o botão do navegador.
 */
export function AccountBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Você está em" className="mb-4 flex items-center gap-1.5 text-xs text-neutral-500">
      <Link to="/minha-conta" className="font-medium text-brand-ink underline-offset-4 hover:underline">
        Minha conta
      </Link>
      <ChevronRight size={13} aria-hidden />
      <span aria-current="page">{current}</span>
    </nav>
  );
}
