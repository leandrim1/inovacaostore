import { Link } from "react-router-dom";
import { Seo } from "../components/seo/Seo";

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Página não encontrada" />
      <div className="container-page flex flex-col items-center justify-center gap-4 py-32 text-center">
        <span className="font-display text-7xl text-brand-yellow">404</span>
        <h1 className="section-title">Página não encontrada</h1>
        <p className="max-w-sm text-neutral-500">
          O link que você acessou não existe ou foi movido. Que tal voltar para
          a loja?
        </p>
        <Link to="/" className="btn-primary mt-2">
          Voltar para o início
        </Link>
      </div>
    </>
  );
}
