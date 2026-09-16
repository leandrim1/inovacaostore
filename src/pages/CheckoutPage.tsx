import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, Copy, CreditCard, MessageCircle, QrCode, Receipt } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { useCart } from "../context/CartContext";
import { formatBRL } from "../lib/format";
import { formatCep, isValidCep, quoteShipping, type ShippingQuote } from "../lib/shipping";
import { buildWhatsAppLink, STORE } from "../data/store";

type PaymentMethod = "pix" | "cartao" | "boleto";

interface Address {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const EMPTY_ADDRESS: Address = {
  name: "",
  email: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function generatePixCode() {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `00020126360014BR.GOV.BCB.PIX0114${random}5204000053039865802BR5920INOVACAO STORE6009PATOS DE MINAS62070503***6304${random.slice(0, 4)}`;
}

function generateBoletoNumber() {
  return Array.from({ length: 5 })
    .map(() => Math.floor(10000 + Math.random() * 89999))
    .join(".");
}

export default function CheckoutPage() {
  const { items, subtotal, discount, coupon, clearCart } = useCart();

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [installments, setInstallments] = useState(1);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [pixCode] = useState(generatePixCode);
  const [boletoNumber] = useState(generateBoletoNumber);

  const shippingPrice = shippingQuote?.options.find((o) => o.id === selectedShipping)?.price ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingPrice;

  const installmentValue = total / installments;

  const whatsappSummary = useMemo(() => {
    const lines = items.map(
      (i) => `• ${i.quantity}x ${i.name} (${i.color}, ${i.size}) - ${formatBRL(i.price * i.quantity)}`,
    );
    return [
      `Olá! Gostaria de finalizar meu pedido na ${STORE.name}:`,
      ...lines,
      `Frete: ${shippingQuote ? formatBRL(shippingPrice) : "a calcular"}`,
      `Total: ${formatBRL(total)}`,
      address.name ? `Nome: ${address.name}` : "",
      address.cep ? `Endereço: ${address.street}, ${address.number} - ${address.city}/${address.state} - CEP ${address.cep}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [items, shippingQuote, shippingPrice, total, address]);

  function handleCepBlur() {
    if (!isValidCep(address.cep)) {
      setCepError("CEP inválido");
      setShippingQuote(null);
      return;
    }
    setCepError(null);
    const quote = quoteShipping(address.cep);
    setShippingQuote(quote);
    setSelectedShipping(quote?.options[0]?.id ?? null);
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!shippingQuote) {
      handleCepBlur();
      return;
    }
    const number = `IS${Date.now().toString().slice(-8)}`;
    setOrderNumber(number);
    setOrderConfirmed(true);
    clearCart();
  }

  if (items.length === 0 && !orderConfirmed) {
    return <Navigate to="/carrinho" replace />;
  }

  if (orderConfirmed) {
    return (
      <>
        <Seo title="Pedido confirmado" />
        <div className="container-page flex flex-col items-center py-24 text-center">
          <CheckCircle2 size={56} className="mb-4 text-green-600" />
          <h1 className="section-title mb-2">Pedido recebido!</h1>
          <p className="max-w-md text-neutral-500">
            Seu pedido <strong>#{orderNumber}</strong> foi registrado com sucesso.
            {payment === "pix" && " Assim que o pagamento Pix for identificado, iniciaremos a separação."}
            {payment === "boleto" && " Assim que o boleto for compensado, iniciaremos a separação."}
            {payment === "cartao" && " Seu pagamento está sendo processado."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={buildWhatsAppLink(
                `Olá! Acabei de finalizar o pedido #${orderNumber} no site e gostaria de confirmar o pagamento.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <MessageCircle size={16} /> Confirmar pelo WhatsApp
            </a>
            <Link to="/" className="btn-outline">
              Voltar para a loja
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Finalizar compra" />
      <div className="container-page py-10 sm:py-14">
        <h1 className="section-title mb-8">Finalizar compra</h1>

        <form onSubmit={handleConfirm} className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section>
              <h2 className="mb-4 font-display text-lg tracking-wide">1. Dados de entrega</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  placeholder="Nome completo"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="col-span-full rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  required
                  type="email"
                  placeholder="E-mail"
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  required
                  placeholder="Telefone / WhatsApp"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  required
                  placeholder="CEP"
                  value={address.cep}
                  onChange={(e) => setAddress({ ...address, cep: formatCep(e.target.value) })}
                  onBlur={handleCepBlur}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                {cepError && <p className="col-span-full -mt-2 text-xs text-red-600">{cepError}</p>}
                <input
                  required
                  placeholder="Endereço"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink sm:col-span-1"
                />
                <input
                  required
                  placeholder="Número"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  placeholder="Complemento (opcional)"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  required
                  placeholder="Bairro"
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  required
                  placeholder="Cidade"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  required
                  placeholder="UF"
                  maxLength={2}
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                  className="rounded-lg border border-black/15 px-4 py-2.5 text-sm uppercase outline-none focus:border-brand-ink"
                />
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-display text-lg tracking-wide">2. Frete</h2>
              {!shippingQuote ? (
                <p className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
                  Informe o CEP acima para ver as opções de frete.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {shippingQuote.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                        selectedShipping === opt.id ? "border-brand-ink bg-brand-cream" : "border-black/10"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping-checkout"
                          checked={selectedShipping === opt.id}
                          onChange={() => setSelectedShipping(opt.id)}
                          className="accent-brand-ink"
                        />
                        <span>
                          <span className="block font-medium">{opt.label}</span>
                          <span className="text-xs text-neutral-500">{opt.days}</span>
                        </span>
                      </span>
                      <span className="font-display">{formatBRL(opt.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 font-display text-lg tracking-wide">3. Pagamento</h2>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "pix", label: "Pix", icon: QrCode },
                    { id: "cartao", label: "Cartão", icon: CreditCard },
                    { id: "boleto", label: "Boleto", icon: Receipt },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayment(m.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-4 text-sm font-medium transition-colors ${
                      payment === m.id
                        ? "border-brand-ink bg-brand-ink text-white"
                        : "border-black/15 text-neutral-600 hover:border-brand-ink"
                    }`}
                  >
                    <m.icon size={20} />
                    {m.label}
                  </button>
                ))}
              </div>

              {payment === "pix" && (
                <div className="rounded-xl bg-brand-cream p-5 text-sm">
                  <p className="mb-3 text-neutral-600">
                    Copie o código abaixo e pague no app do seu banco. A confirmação é automática.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
                    <span className="flex-1 truncate text-xs text-neutral-500">{pixCode}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(pixCode)}
                      className="flex items-center gap-1 rounded-full bg-brand-ink px-3 py-1.5 text-xs text-white"
                    >
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                </div>
              )}

              {payment === "cartao" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    required
                    placeholder="Número do cartão"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    className="col-span-full rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                  />
                  <input
                    required
                    placeholder="Nome impresso no cartão"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                    className="col-span-full rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                  />
                  <input
                    required
                    placeholder="Validade (MM/AA)"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                  />
                  <input
                    required
                    placeholder="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    className="rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                  />
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="col-span-full rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-brand-ink"
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const n = i + 1;
                      return (
                        <option key={n} value={n}>
                          {n}x de {formatBRL(total / n)} {n <= 3 ? "sem juros" : "com juros"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {payment === "boleto" && (
                <div className="rounded-xl bg-brand-cream p-5 text-sm text-neutral-600">
                  <p>
                    O boleto será gerado com vencimento em 3 dias úteis. Código:
                  </p>
                  <p className="mt-2 font-mono text-xs text-brand-ink">{boletoNumber}</p>
                </div>
              )}
            </section>
          </div>

          <div className="h-fit rounded-2xl bg-brand-cream p-6 lg:sticky lg:top-24">
            <h2 className="mb-5 font-display text-lg tracking-wide">Resumo do pedido</h2>
            <ul className="mb-4 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.key} className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatBRL(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-black/10 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Desconto {coupon ? `(${coupon.code})` : ""}</span>
                  <span>-{formatBRL(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Frete</span>
                <span>{shippingQuote ? formatBRL(shippingPrice) : "Informe o CEP"}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-black/10 pt-3 font-display text-lg">
                <span>Total</span>
                <span>{formatBRL(total)}</span>
              </div>
              {payment === "cartao" && installments > 1 && (
                <p className="text-right text-xs text-neutral-500">
                  {installments}x de {formatBRL(installmentValue)}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary mt-6 w-full">
              Confirmar pedido
            </button>

            <a
              href={buildWhatsAppLink(whatsappSummary)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-medium text-green-700 hover:underline"
            >
              <MessageCircle size={16} /> Prefere finalizar pelo WhatsApp?
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
