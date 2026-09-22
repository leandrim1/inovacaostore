import {
  Award,
  BadgePercent,
  Clock,
  CreditCard,
  Gift,
  Headset,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícones da faixa de benefícios da home, na ordem em que aparecem no painel.
 *
 * O banco guarda só a chave (`truck`, `shield`…). MANTENHA EM SINCRONIA com
 * BENEFIT_ICON_KEYS em server/src/benefitIcons.ts: o servidor recusa chaves
 * que não estejam lá, e uma chave que só exista lá cai no ícone padrão aqui.
 */
export const BENEFIT_ICONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "truck", label: "Caminhão (frete)", icon: Truck },
  { key: "refresh", label: "Setas (troca)", icon: RefreshCw },
  { key: "shield", label: "Escudo (segurança)", icon: ShieldCheck },
  { key: "headset", label: "Fone (atendimento)", icon: Headset },
  { key: "card", label: "Cartão (pagamento)", icon: CreditCard },
  { key: "percent", label: "Porcentagem (desconto)", icon: BadgePercent },
  { key: "gift", label: "Presente", icon: Gift },
  { key: "package", label: "Caixa (entrega)", icon: Package },
  { key: "clock", label: "Relógio (rapidez)", icon: Clock },
  { key: "store", label: "Loja (retirada)", icon: Store },
  { key: "star", label: "Estrela (qualidade)", icon: Star },
  { key: "chat", label: "Balão (conversa)", icon: MessageCircle },
  { key: "pin", label: "Marcador (localização)", icon: MapPin },
  { key: "sparkles", label: "Brilho (novidade)", icon: Sparkles },
  { key: "tag", label: "Etiqueta (preço)", icon: Tag },
  { key: "award", label: "Medalha (garantia)", icon: Award },
];

const POR_CHAVE = new Map(BENEFIT_ICONS.map((i) => [i.key, i.icon]));

/** Chave desconhecida (cache antigo, edição manual no banco) nunca quebra a home. */
export function benefitIcon(key: string): LucideIcon {
  return POR_CHAVE.get(key) ?? Truck;
}
