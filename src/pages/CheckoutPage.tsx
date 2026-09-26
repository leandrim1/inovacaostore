import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, Copy, CreditCard, Loader2, MapPin, MessageCircle, QrCode, Receipt } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { useCart } from "../context/CartContext";
import { formatBRL, maskPhoneBR } from "../lib/format";
import { formatCep, isValidCep, quoteShipping, type ShippingQuote } from "../lib/shipping";
import { api } from "../lib/api";
import { buildWhatsAppLink, STORE } from "../data/store";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { useAuth } from "../context/AuthContext";
import { useAddresses, useCreateAddress, type CustomerAddress } from "../hooks/useAddresses";
import { useCepAutofill } from "../hooks/useCepAutofill";

type PaymentMethod = "pix" | "cartao" | "boleto";

interface Address {
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
  const { items, subtotal, grossSubtotal, promotionDiscount, discount, coupon, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const { user } = useAuth();

  const { data: savedAddresses = [] } = useAddresses();
  const createAddress = useCreateAddress();

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  /** `null` = "usar outro endereço" (formulário em branco). */
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [pixCode] = useState(generatePixCode);
  const [boletoNumber] = useState(generateBoletoNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shippingPrice = shippingQuote?.price ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingPrice;

  const whatsappSummary = useMemo(() => {
    const lines = items.map(
      (i) => `• ${i.quantity}x ${i.name} (${i.color}, ${i.size}) - ${formatBRL(i.price * i.quantity)}`,
    );
    return [
      `Olá! Gostaria de finalizar meu pedido na ${STORE.name}:`,
      ...lines,
      `Frete: ${shippingQuote ? formatBRL(shippingPrice) : "a calcular"}`,
      `Total: ${formatBRL(total)}`,
      user ? `Nome: ${user.name}` : "",
      address.cep ? `Endereço: ${address.street}, ${address.number} - ${address.city}/${address.state} - CEP ${address.cep}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [items, shippingQuote, shippingPrice, total, address, user]);

  /**
   * Preenche o formulário a partir de um endereço salvo.
   *
   * Não é um `useEffect` que observa a lista: o cliente que escolheu "usar
   * outro endereço" e começou a digitar não pode ver o que digitou sumir
   * porque a consulta revalidou.
   */
  function applySavedAddress(saved: CustomerAddress) {
    setSelectedAddressId(saved.id);
    setSaveAddress(false);
    setAddress({
      phone: saved.phone ? maskPhoneBR(saved.phone) : address.phone,
      cep: formatCep(saved.cep),
      street: saved.street,
      number: saved.number,
      complement: saved.complement,
      neighborhood: saved.neighborhood,
      city: saved.city,
      state: saved.state,
    });
    setShippingQuote(null);
    setCepError(null);
    // Cota na hora: escolher o endereço e ainda ter que tocar no campo de CEP
    // para o frete aparecer desmontaria metade do ganho do atalho.
    void cotarFrete(formatCep(saved.cep));
  }

  // Endereço padrão entra sozinho na primeira carga — é o atalho que faz os
  // endereços salvos valerem a pena. O ref garante UMA vez: sem ele, cada
  // revalidação da consulta reescreveria por cima do que o cliente digitou.
  const preencheuPadrao = useRef(false);
  useEffect(() => {
    if (preencheuPadrao.current || savedAddresses.length === 0) return;
    preencheuPadrao.current = true;
    applySavedAddress(savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  const numeroRef = useRef<HTMLInputElement>(null);
  const ruaRef = useRef<HTMLInputElement>(null);

  const cepLookup = useCepAutofill((endereco) => {
    setAddress((atual) => ({
      ...atual,
      street: endereco.street || atual.street,
      neighborhood: endereco.neighborhood || atual.neighborhood,
      city: endereco.city,
      state: endereco.state,
    }));
    (endereco.street ? numeroRef : ruaRef).current?.focus();
  });

  /**
   * Um CEP completo faz duas coisas de uma vez: preenche o endereço e cota o
   * frete. Separar em dois gestos (digitar e depois sair do campo) é o tipo
   * de atrito que faz alguém desistir na última tela da compra.
   */
  function handleCepChange(valor: string) {
    const formatado = formatCep(valor);
    setAddress((atual) => ({ ...atual, cep: formatado }));
    // Endereço escolhido da lista deixa de valer assim que o CEP muda.
    setSelectedAddressId(null);
    void cepLookup.buscar(formatado);
    if (formatado.replace(/\D/g, "").length === 8) void cotarFrete(formatado);
    else setShippingQuote(null);
  }

  async function cotarFrete(cep: string) {
    if (!isValidCep(cep)) {
      setCepError("CEP inválido");
      setShippingQuote(null);
      return;
    }
    setIsCalculatingShipping(true);
    try {
      const quote = await quoteShipping(
        cep,
        items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      );
      setShippingQuote(quote);
      setCepError(null);
    } catch (err) {
      setCepError(err instanceof Error ? err.message : "Não foi possível calcular o frete para esse CEP.");
      setShippingQuote(null);
    } finally {
      setIsCalculatingShipping(false);
    }
  }

  /**
   * Rede de segurança do campo de CEP. Digitar já cota o frete; este blur
   * só age quando ainda não há cotação — o caso de uma falha momentânea na
   * primeira tentativa. Sem a guarda, o fluxo normal pediria a cotação duas
   * vezes para o mesmo CEP.
   */
  function handleCepBlur() {
    if (shippingQuote) return Promise.resolve();
    return cotarFrete(address.cep);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!shippingQuote) {
      await handleCepBlur();
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await api.post<{ orderNumber: string }>("/api/orders", {
        customer: { phone: address.phone },
        address: {
          cep: address.cep,
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        },
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        paymentMethod: payment,
        couponCode: coupon?.code,
      });
      setOrderNumber(result.orderNumber);
      setOrderConfirmed(true);
      clearCart();

      // Depois do pedido criado, nunca antes: se falhar em salvar o endereço,
      // a compra já está feita e o cliente não perde nada — o contrário
      // (salvar primeiro e o pedido falhar) deixaria lixo no caderninho.
      if (saveAddress && selectedAddressId === null) {
        createAddress
          .mutateAsync({
            label: "",
            recipient: user?.name ?? "",
            phone: address.phone,
            cep: address.cep,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          })
          .catch(() => {
            // Silencioso de propósito: o pedido foi confirmado, e um erro
            // aqui não pode virar uma mensagem que assusta quem acabou de
            // comprar. O endereço continua salvável em /minha-conta/enderecos.
          });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Não foi possível finalizar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
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
            {payment === "cartao" && " Nossa equipe vai te chamar no WhatsApp para combinar o pagamento no cartão."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={buildWhatsAppLink(
                settings.whatsappNumber,
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
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-px w-8 bg-brand-ink/20" aria-hidden />
          <span className="font-display text-xs tracking-[0.35em] text-brand-yellow-dark">Última etapa</span>
        </div>
        <h1 className="section-title mb-8">Finalizar compra</h1>

        <form onSubmit={handleConfirm} className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section>
              <h2 className="mb-4 font-display text-lg tracking-wide">1. Dados de entrega</h2>
              <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-100 px-4 py-3 text-sm">
                <div>
                  <span className="text-neutral-500">Comprando como </span>
                  <span className="font-medium text-brand-ink">{user?.name}</span>
                  <span className="text-neutral-500"> · {user?.email}</span>
                </div>
                <Link to="/minha-conta" className="text-xs font-medium text-brand-ink hover:underline">
                  Não é você?
                </Link>
              </div>
              {savedAddresses.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-neutral-500">
                    <MapPin size={14} aria-hidden /> Endereços salvos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((saved) => (
                      <button
                        key={saved.id}
                        type="button"
                        onClick={() => applySavedAddress(saved)}
                        className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                          selectedAddressId === saved.id
                            ? "border-brand-ink bg-brand-cream"
                            : "border-brand-ink/15 bg-white hover:border-brand-ink/40"
                        }`}
                      >
                        <span className="block font-medium text-brand-ink">
                          {saved.label || "Endereço"}
                          {saved.isDefault && (
                            <span className="ml-1.5 text-[10px] tracking-wide text-brand-yellow-dark">PADRÃO</span>
                          )}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {saved.street}, {saved.number} · {saved.city}/{saved.state}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setAddress({ ...EMPTY_ADDRESS, phone: address.phone });
                        setShippingQuote(null);
                        setCepError(null);
                      }}
                      className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                        selectedAddressId === null
                          ? "border-brand-ink bg-brand-cream"
                          : "border-dashed border-brand-ink/25 bg-white hover:border-brand-ink/50"
                      }`}
                    >
                      Usar outro endereço
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  placeholder="Telefone / WhatsApp"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="input-field"
                />
                <div className="flex flex-col gap-1">
                  <input
                    required
                    placeholder="CEP"
                    value={address.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={handleCepBlur}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className="input-field"
                  />
                  {cepLookup.buscando && (
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <Loader2 size={12} className="animate-spin motion-reduce:animate-none" aria-hidden />
                      buscando endereço…
                    </span>
                  )}
                  {cepLookup.erro && (
                    <span className="text-xs text-amber-600">{cepLookup.erro} Preencha abaixo.</span>
                  )}
                </div>
                <input
                  ref={ruaRef}
                  required
                  placeholder="Endereço"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="input-field sm:col-span-1"
                />
                <input
                  ref={numeroRef}
                  required
                  placeholder="Número"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className="input-field"
                />
                <input
                  placeholder="Complemento (opcional)"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className="input-field"
                />
                <input
                  required
                  placeholder="Bairro"
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  className="input-field"
                />
                <input
                  required
                  placeholder="Cidade"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="input-field"
                />
                <input
                  required
                  placeholder="UF"
                  maxLength={2}
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                  className="input-field uppercase"
                />
              </div>

              {/* Só faz sentido oferecer quando o endereço é novo: marcar isto
                  com um endereço salvo selecionado criaria uma cópia igual. */}
              {selectedAddressId === null && (
                <label className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 accent-brand-ink"
                  />
                  Salvar este endereço para as próximas compras
                </label>
              )}
            </section>

            <section>
              <h2 className="mb-4 font-display text-lg tracking-wide">2. Frete</h2>
              {cepError && <p className="mb-2 text-sm text-red-600">{cepError}</p>}
              {isCalculatingShipping ? (
                <p className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
                  Calculando frete…
                </p>
              ) : !shippingQuote ? (
                <p className="rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
                  Informe o CEP acima para calcular o frete.
                </p>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-brand-ink bg-brand-cream px-4 py-3 text-sm">
                  <span>
                    <span className="block font-medium">
                      {shippingQuote.isFree ? "Frete grátis" : "Frete"}
                    </span>
                    {shippingQuote.etaLabel && (
                      <span className="block text-xs text-neutral-500">{shippingQuote.etaLabel}</span>
                    )}
                  </span>
                  <span className="font-display">
                    {shippingQuote.isFree ? "Grátis" : formatBRL(shippingQuote.price)}
                  </span>
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
                <div className="rounded-xl bg-brand-cream p-5 text-sm text-neutral-600">
                  <p>
                    Após confirmar o pedido, nossa equipe vai te chamar no WhatsApp para combinar o
                    pagamento no cartão com segurança.
                  </p>
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

          <div className="h-fit rounded-2xl border border-brand-ink/10 bg-brand-cream p-6 lg:sticky lg:top-24">
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
                <span>{formatBRL(grossSubtotal)}</span>
              </div>
              {promotionDiscount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Desconto (promoção)</span>
                  <span>-{formatBRL(promotionDiscount)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Cupom {coupon ? `(${coupon.code})` : ""}</span>
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
            </div>

            {submitError && (
              <p className="alert-error mb-3">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Enviando pedido…" : "Confirmar pedido"}
            </button>

            <a
              href={buildWhatsAppLink(settings.whatsappNumber, whatsappSummary)}
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
