import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Camera,
  LogOut,
  MapPin,
  MessageCircle,
  PackageSearch,
  PenLine,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { TestimonialFormModal } from "../components/home/TestimonialFormModal";
import { OrderThumb } from "../components/account/OrderThumb";
import { UserAvatar } from "../components/account/UserAvatar";
import { useProfilePhoto } from "../hooks/useProfilePhoto";
import { useAuth } from "../context/AuthContext";
import { useMyOrders, type MyOrder } from "../hooks/useMyOrders";
import { useAddresses } from "../hooks/useAddresses";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { useTestimonialEligibility } from "../hooks/useTestimonials";
import { buildWhatsAppLink } from "../data/store";
import { formatBRL, formatItemCount, formatPhoneBR } from "../lib/format";
import { STATUS_LABELS, STATUS_STYLES } from "../lib/orderStatus";
import { paymentMethodLabel } from "../lib/paymentMethods";

/**
 * Área do cliente no formato de portal: um cabeçalho que diz quem está
 * logado, uma grade de atalhos e o último pedido em destaque — em vez da
 * pilha de formulários que era antes.
 *
 * Todo atalho aqui leva a algo que a loja realmente faz. Não há "meus
 * cartões", "lista de desejos" nem "cashback": inventar um atalho que abre
 * uma tela vazia é pior do que não ter o atalho. E cada bloco é alimentado
 * pelo painel — o status do pedido é o que o lojista marcou em
 * /admin/pedidos, o endereço vem do pedido, e o atendimento usa o WhatsApp
 * cadastrado em Configurações.
 */

/** Etapas que um pedido percorre. Cancelado/reembolsado saem da trilha. */
const TRACK = ["pendente", "pago", "separacao", "enviado", "entregue"] as const;

const TRACK_LABELS: Record<(typeof TRACK)[number], string> = {
  pendente: "Recebido",
  pago: "Pago",
  separacao: "Separação",
  enviado: "Enviado",
  entregue: "Entregue",
};

function OrderTrack({ status }: { status: string }) {
  const current = TRACK.indexOf(status as (typeof TRACK)[number]);

  // Pedido cancelado ou reembolsado não tem "próxima etapa": mostrar a
  // trilha parada num ponto qualquer daria a entender que ele ainda anda.
  if (current === -1) return null;

  return (
    <ol className="flex items-center gap-1" aria-label={`Etapa atual: ${STATUS_LABELS[status] ?? status}`}>
      {TRACK.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : done ? "bg-brand-ink" : "bg-brand-ink/15"}`} />
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${done ? "bg-brand-ink" : "bg-brand-ink/15"}`}
                aria-hidden
              />
              <span
                className={`h-0.5 flex-1 ${
                  i === TRACK.length - 1 ? "bg-transparent" : i < current ? "bg-brand-ink" : "bg-brand-ink/15"
                }`}
              />
            </div>
            <span
              className={`text-center text-[10px] leading-tight sm:text-xs ${
                done ? "font-medium text-brand-ink" : "text-neutral-400"
              }`}
            >
              {TRACK_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface ShortcutProps {
  icon: typeof UserRound;
  label: string;
  description: string;
  tone?: "default" | "danger";
  active?: boolean;
}

function ShortcutBody({ icon: Icon, label, description, tone = "default", active }: ShortcutProps) {
  return (
    <>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
          tone === "danger"
            ? "bg-red-50 text-red-600 group-hover:bg-red-100"
            : active
              ? "bg-brand-yellow text-brand-ink"
              : "bg-brand-cream text-brand-ink group-hover:bg-brand-yellow"
        }`}
      >
        <Icon size={20} strokeWidth={1.6} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span
          className={`font-display text-sm tracking-[0.1em] ${tone === "danger" ? "text-red-600" : "text-brand-ink"}`}
        >
          {label}
        </span>
        <span className="text-xs leading-snug text-neutral-500">{description}</span>
      </span>
    </>
  );
}

function shortcutClass(active?: boolean, tone: "default" | "danger" = "default") {
  return [
    "group flex h-full flex-col items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-all duration-300 sm:p-5",
    "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(10,10,10,0.7)]",
    tone === "danger" ? "border-brand-ink/10 hover:border-red-300" : "",
    tone === "default" && active ? "border-brand-ink bg-brand-cream/40" : "",
    tone === "default" && !active ? "border-brand-ink/10 hover:border-brand-ink/30" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Cartão que só informa (sem clique) — usado quando o cliente ainda não pode avaliar a loja. */
function ShortcutStatic(props: ShortcutProps) {
  return (
    <div className="flex h-full cursor-default flex-col items-start gap-3 rounded-2xl border border-brand-ink/10 bg-white/60 p-4 text-left sm:p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        <props.icon size={20} strokeWidth={1.6} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-sm tracking-[0.1em] text-neutral-400">{props.label}</span>
        <span className="text-xs leading-snug text-neutral-500">{props.description}</span>
      </span>
    </div>
  );
}

function LastOrderCard({ order }: { order: MyOrder }) {
  const temTrilha = TRACK.includes(order.status as (typeof TRACK)[number]);
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const preview = order.items.slice(0, 3);
  const rest = order.items.length - preview.length;

  return (
    <section className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-widest text-neutral-500">RESUMO DO SEU ÚLTIMO PEDIDO</h2>
        <Link to="/meus-pedidos" className="text-xs font-medium text-brand-ink underline-offset-4 hover:underline">
          Ir para meus pedidos
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div>
          <p className="font-display text-lg tracking-wide text-brand-ink">Pedido #{order.orderNumber}</p>
          <p className="text-xs text-neutral-500">
            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            · {formatItemCount(units)} · {paymentMethodLabel(order.paymentMethod)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            STATUS_STYLES[order.status] ?? "bg-brand-cream text-brand-ink"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* O espaçamento vive junto com a trilha: pedido cancelado/reembolsado
          não tem trilha, e deixar o `py-5` renderizado sozinho criava uma
          faixa vazia entre duas linhas divisórias no meio do cartão. */}
      {temTrilha && (
        <div className="py-5">
          <OrderTrack status={order.status} />
        </div>
      )}

      {/* Sem trilha, a linha de cima da lista encostaria na de baixo do
          cabeçalho e viraria uma linha dupla; aí o cabeçalho basta. */}
      <ul className={`flex flex-col divide-y divide-black/5 ${temTrilha ? "border-t border-black/5" : ""}`}>
        {preview.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
            <OrderThumb item={item} />
            <div className="min-w-0 flex-1">
              {/* Antes era `truncate` num link. Link é elemento de linha: nele o
                  corte não se aplica, mas o "não quebrar" sim — o nome virava
                  uma linha única que atravessava o preço e saía da tela no
                  celular. `line-clamp-2` transforma o link em bloco
                  (-webkit-box) e limita a duas linhas com reticências; não
                  somar `block`, que sobrescreve esse display e desliga o
                  limite. O nome completo fica na página do produto. */}
              {item.productSlug ? (
                <Link
                  to={`/produto/${item.productSlug}`}
                  title={item.productName}
                  className="line-clamp-2 break-words font-medium text-brand-ink underline-offset-4 hover:underline"
                >
                  {item.productName}
                </Link>
              ) : (
                <p title={item.productName} className="line-clamp-2 break-words font-medium text-brand-ink">
                  {item.productName}
                </p>
              )}
              <p className="text-xs text-neutral-500">
                {item.color} · {item.size} · {item.quantity}x
              </p>
            </div>
            <span className="shrink-0 font-medium">{formatBRL(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
        <span className="text-xs text-neutral-400">
          {rest > 0 ? `mais ${formatItemCount(rest)} neste pedido` : ""}
        </span>
        <span className="font-display text-lg tracking-wide text-brand-ink">{formatBRL(order.total)}</span>
      </div>
    </section>
  );
}

export default function MyAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: orders = [], isLoading: isLoadingOrders } = useMyOrders();
  const { data: settings } = useSiteSettings();
  const { data: eligibility } = useTestimonialEligibility();

  const { data: addresses = [] } = useAddresses();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const foto = useProfilePhoto(user);

  if (!user) return null;

  const lastOrder = orders[0];

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const ordersDescription = isLoadingOrders
    ? "Carregando…"
    : orders.length === 0
      ? "Você ainda não comprou"
      : `${orders.length} pedido${orders.length === 1 ? "" : "s"} · acompanhe a entrega`;

  const addressDescription =
    addresses.length === 0
      ? "Salve um para agilizar a compra"
      : `${addresses.length} salvo${addresses.length === 1 ? "" : "s"} · gerencie a entrega`;

  const reviewMessages: Record<string, string> = {
    nao_logado: "Entre na sua conta para avaliar a loja.",
    email_nao_verificado: "Confirme seu e-mail para poder avaliar.",
    sem_pedido_entregue: "Disponível quando um pedido seu for entregue.",
    ja_enviado: "Seu depoimento está aguardando aprovação.",
    ja_publicado: "Seu depoimento já está publicado. Obrigado!",
  };

  return (
    <>
      <Seo title="Minha conta" description="Gerencie os dados da sua conta na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-px w-8 bg-brand-ink/20" aria-hidden />
          <span className="font-display text-xs tracking-[0.35em] text-brand-yellow-dark">Área do cliente</span>
        </div>
        <h1 className="section-title mb-8">Minha conta</h1>

        {/* Cabeçalho: quem está logado, em qual e-mail e desde quando. */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-brand-ink p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* O próprio avatar é o botão: clicar abre o seletor de foto. */}
              <button
                type="button"
                onClick={foto.abrirSeletor}
                aria-label={user.avatarUrl ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
                className="group relative shrink-0 rounded-full focus-visible:outline-offset-4"
              >
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatarUrl}
                  className="h-14 w-14 bg-brand-yellow font-display text-xl tracking-wide text-brand-ink sm:h-16 sm:w-16 sm:text-2xl"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera size={20} />
                </span>
                {/* Selo sempre visível: no celular não existe "passar o mouse". */}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-ink ring-2 ring-brand-ink"
                >
                  <Camera size={12} />
                </span>
              </button>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-tight tracking-wide sm:text-3xl">
                  Olá, {user.name.trim().split(/\s+/)[0]}
                </p>
                <p className="truncate text-sm text-white/60">{user.email}</p>
                {user.phone && <p className="text-sm text-white/60">{formatPhoneBR(user.phone)}</p>}
                <p className="mt-1 text-xs text-white/40">
                  Cliente desde{" "}
                  {new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <button
                    type="button"
                    onClick={foto.abrirSeletor}
                    className="font-medium text-brand-yellow underline-offset-4 hover:underline"
                  >
                    {user.avatarUrl ? "Alterar foto" : "Adicionar foto"}
                  </button>
                  {user.avatarUrl && (
                    <button
                      type="button"
                      onClick={foto.pedirRemocao}
                      className="text-white/60 underline-offset-4 hover:text-white hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                  <span role="status" className="text-green-300">
                    {foto.aviso}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user.emailVerified ? (
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-green-300">
                  <BadgeCheck size={15} /> E-mail verificado
                </span>
              ) : (
                <Link
                  to="/verificar-email"
                  className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-400/25"
                >
                  <ShieldAlert size={15} /> Confirmar e-mail
                </Link>
              )}
              <Link
                to="/minha-conta/meus-dados"
                className="rounded-full bg-brand-yellow px-5 py-2.5 font-display text-xs tracking-[0.15em] text-brand-ink transition-colors hover:bg-brand-yellow-light"
              >
                EDITAR DADOS
              </Link>
            </div>
          </div>
        </section>

        <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">ATALHOS</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link to="/meus-pedidos" className={shortcutClass()}>
            <ShortcutBody icon={PackageSearch} label="Meus pedidos" description={ordersDescription} />
          </Link>

          <Link to="/minha-conta/meus-dados" className={shortcutClass()}>
            <ShortcutBody icon={UserRound} label="Meus dados" description="Nome, telefone e senha" />
          </Link>

          <Link to="/minha-conta/enderecos" className={shortcutClass()}>
            <ShortcutBody icon={MapPin} label="Endereços" description={addressDescription} />
          </Link>

          {eligibility?.canSubmit ? (
            <button type="button" onClick={() => setIsReviewOpen(true)} className={shortcutClass()}>
              <ShortcutBody icon={PenLine} label="Avaliar a loja" description="Deixe seu depoimento" />
            </button>
          ) : eligibility?.reason === "email_nao_verificado" ? (
            <Link to="/verificar-email" className={shortcutClass()}>
              <ShortcutBody
                icon={PenLine}
                label="Avaliar a loja"
                description={reviewMessages.email_nao_verificado}
              />
            </Link>
          ) : (
            <ShortcutStatic
              icon={PenLine}
              label="Avaliar a loja"
              description={
                eligibility?.reason ? (reviewMessages[eligibility.reason] ?? "Indisponível agora") : "Carregando…"
              }
            />
          )}

          <a
            href={buildWhatsAppLink(settings.whatsappNumber, settings.whatsappMessage)}
            target="_blank"
            rel="noreferrer"
            className={shortcutClass()}
          >
            <ShortcutBody icon={MessageCircle} label="Atendimento" description="Fale com a loja no WhatsApp" />
          </a>

          <button type="button" onClick={handleLogout} className={shortcutClass(false, "danger")}>
            <ShortcutBody icon={LogOut} label="Sair da conta" description="Encerrar esta sessão" tone="danger" />
          </button>
        </div>

        {isLoadingOrders ? (
          <p className="mt-8 text-sm text-neutral-400">Carregando seus pedidos…</p>
        ) : lastOrder ? (
          <div className="mt-8">
            <LastOrderCard order={lastOrder} />
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-brand-ink/10 bg-neutral-50 py-16 text-center text-neutral-500">
            <PackageSearch size={40} strokeWidth={1.25} />
            <p className="text-sm">Você ainda não fez nenhum pedido.</p>
            <Link to="/busca" className="btn-primary">
              Ver produtos
            </Link>
          </div>
        )}
      </div>

      {foto.elementos}
      <TestimonialFormModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        suggestedName={eligibility?.suggestedName ?? null}
      />
    </>
  );
}
