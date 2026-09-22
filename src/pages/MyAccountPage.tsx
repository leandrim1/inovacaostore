import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  KeyRound,
  LogOut,
  MapPin,
  MessageCircle,
  PackageSearch,
  PenLine,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { PasswordInput } from "../components/ui/PasswordInput";
import { TestimonialFormModal } from "../components/home/TestimonialFormModal";
import { useAuth } from "../context/AuthContext";
import { useMyOrders, type MyOrder } from "../hooks/useMyOrders";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { useTestimonialEligibility } from "../hooks/useTestimonials";
import { buildWhatsAppLink } from "../data/store";
import { formatBRL, formatItemCount, formatPhoneBR, maskPhoneBR } from "../lib/format";
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

/** Painel que abre abaixo da grade; `null` = nenhum. */
type Panel = "dados" | "senha" | "endereco" | null;

/** Etapas que um pedido percorre. Cancelado/reembolsado saem da trilha. */
const TRACK = ["pendente", "pago", "separacao", "enviado", "entregue"] as const;

const TRACK_LABELS: Record<(typeof TRACK)[number], string> = {
  pendente: "Recebido",
  pago: "Pago",
  separacao: "Separação",
  enviado: "Enviado",
  entregue: "Entregue",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

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

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(maskPhoneBR(user?.phone ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsSaving(true);
    const result = await updateProfile({ name: name.trim(), phone });
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Nome completo</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Telefone / WhatsApp</span>
        <input
          value={phone}
          onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
          placeholder="(34) 99999-9999"
          inputMode="tel"
          autoComplete="tel"
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="text-xs uppercase tracking-wide text-neutral-500">E-mail</span>
        <input value={user?.email ?? ""} readOnly disabled className="input-field bg-neutral-50 text-neutral-500" />
        <span className="text-xs text-neutral-400">
          O e-mail é o login da conta e não pode ser trocado por aqui. Precisa mudar? Fale com a gente pelo WhatsApp.
        </span>
      </label>

      {error && <p className="alert-error sm:col-span-2">{error}</p>}
      {saved && <p className="alert-success sm:col-span-2">Dados atualizados.</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-60">
          {isSaving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("As novas senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:max-w-sm">
      <PasswordInput
        placeholder="Senha atual"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <PasswordInput
        placeholder="Nova senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      <PasswordInput
        placeholder="Confirmar nova senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="alert-error">{error}</p>}
      {success && <p className="alert-success">Senha alterada com sucesso.</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary mt-1 w-full disabled:opacity-60">
        {isSubmitting ? "Salvando…" : "Alterar senha"}
      </button>
    </form>
  );
}

function LastOrderCard({ order }: { order: MyOrder }) {
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const preview = order.items.slice(0, 3);
  const rest = order.items.length - preview.length;

  return (
    <section className="rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-widest text-neutral-500">SEU ÚLTIMO PEDIDO</h2>
        <Link to="/meus-pedidos" className="text-xs font-medium text-brand-ink underline-offset-4 hover:underline">
          Ver todos os pedidos
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

      <div className="py-5">
        <OrderTrack status={order.status} />
      </div>

      <ul className="flex flex-col divide-y divide-black/5 border-t border-black/5">
        {preview.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-brand-ink">{item.productName}</p>
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

  const [panel, setPanel] = useState<Panel>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Abrir um painel no celular colocaria o formulário fora da tela: a grade
  // de atalhos ocupa a dobra inteira. Rolar até ele é o que faz o clique no
  // atalho parecer que fez alguma coisa.
  useEffect(() => {
    if (panel) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [panel]);

  if (!user) return null;

  const lastOrder = orders[0];

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  function toggle(next: Exclude<Panel, null>) {
    setPanel((current) => (current === next ? null : next));
  }

  const ordersDescription = isLoadingOrders
    ? "Carregando…"
    : orders.length === 0
      ? "Você ainda não comprou"
      : `${orders.length} pedido${orders.length === 1 ? "" : "s"} · acompanhe a entrega`;

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
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-yellow font-display text-xl tracking-wide text-brand-ink sm:h-16 sm:w-16 sm:text-2xl"
                aria-hidden
              >
                {initials(user.name)}
              </span>
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
              <button
                type="button"
                onClick={() => toggle("dados")}
                className="rounded-full bg-brand-yellow px-5 py-2.5 font-display text-xs tracking-[0.15em] text-brand-ink transition-colors hover:bg-brand-yellow-light"
              >
                EDITAR DADOS
              </button>
            </div>
          </div>
        </section>

        <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">ATALHOS</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Link to="/meus-pedidos" className={shortcutClass()}>
            <ShortcutBody icon={PackageSearch} label="Meus pedidos" description={ordersDescription} />
          </Link>

          <button type="button" onClick={() => toggle("dados")} className={shortcutClass(panel === "dados")}>
            <ShortcutBody
              icon={UserRound}
              label="Meus dados"
              description="Nome, telefone e e-mail"
              active={panel === "dados"}
            />
          </button>

          <button type="button" onClick={() => toggle("endereco")} className={shortcutClass(panel === "endereco")}>
            <ShortcutBody
              icon={MapPin}
              label="Endereço"
              description={lastOrder ? "Último usado na entrega" : "Ainda sem entrega"}
              active={panel === "endereco"}
            />
          </button>

          <button type="button" onClick={() => toggle("senha")} className={shortcutClass(panel === "senha")}>
            <ShortcutBody
              icon={KeyRound}
              label="Alterar senha"
              description="Troque sua senha de acesso"
              active={panel === "senha"}
            />
          </button>

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

        <div ref={panelRef} className="scroll-mt-24">
          {panel && (
            <section className="mt-6 rounded-2xl border border-brand-ink/10 bg-white p-5 sm:p-6">
              {panel === "dados" && (
                <>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
                    <UserRound size={16} /> MEUS DADOS
                  </h2>
                  <ProfileForm />
                </>
              )}

              {panel === "senha" && (
                <>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
                    <KeyRound size={16} /> ALTERAR SENHA
                  </h2>
                  <PasswordForm />
                </>
              )}

              {panel === "endereco" && (
                <>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
                    <MapPin size={16} /> ENDEREÇO DE ENTREGA
                  </h2>
                  {lastOrder ? (
                    <>
                      <address className="text-sm not-italic leading-relaxed text-brand-ink">
                        {lastOrder.street}, {lastOrder.number}
                        {lastOrder.complement && ` — ${lastOrder.complement}`}
                        <br />
                        {lastOrder.neighborhood} · {lastOrder.city}/{lastOrder.state}
                        <br />
                        CEP {lastOrder.cep}
                      </address>
                      <p className="mt-3 text-xs text-neutral-500">
                        Este é o endereço do seu último pedido. Você informa o endereço a cada compra, na
                        finalização — assim dá para enviar para casa hoje e para o trabalho amanhã.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      Você ainda não fez nenhum pedido. O endereço é informado na finalização da compra e aparece
                      aqui depois.
                    </p>
                  )}
                </>
              )}
            </section>
          )}
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

      <TestimonialFormModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        suggestedName={eligibility?.suggestedName ?? null}
      />
    </>
  );
}
