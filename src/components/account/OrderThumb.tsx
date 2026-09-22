import { Link } from "react-router-dom";
import { PlaceholderImage } from "../ui/PlaceholderImage";
import type { MyOrderItem } from "../../hooks/useMyOrders";

/** Miniatura do item. Sem foto cadastrada entra o mesmo marcador do catálogo. */
export function OrderThumb({ item }: { item: MyOrderItem }) {
  const conteudo = item.imageUrl ? (
    <img
      src={item.imageUrl}
      // A imagem é decorativa: o nome do produto está escrito ao lado, e
      // repeti-lo aqui faria o leitor de tela ler a mesma coisa duas vezes.
      alt=""
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  ) : (
    <PlaceholderImage />
  );

  const classe = "h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-cream sm:h-16 sm:w-16";
  return item.productSlug ? (
    <Link to={`/produto/${item.productSlug}`} className={classe} aria-hidden tabIndex={-1}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
