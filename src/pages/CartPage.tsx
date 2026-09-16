import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Tag, Truck } from "lucide-react";
import { Seo } from "../components/seo/Seo";
import { useCart } from "../context/CartContext";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { formatBRL } from "../lib/format";
import { formatCep, isValidCep, type ShippingQuote } from "../lib/shipping";
import { api } from "../lib/api";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, discount, coupon, applyCoupon, removeCoupon } =
    useCart();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [cep, setCep] = useState("");
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  const shippingPrice =
    shippingQuote?.options.find((o) => o.id === selectedShipping)?.price ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingPrice;

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const result = await applyCoupon(couponInput);
    setCouponError(result.ok ? null : (result.error ?? "Cupom inválido ou expirado."));
    if (result.ok) setCouponInput("");
  }

  async function handleCalculateShipping(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidCep(cep)) {
      setCepError("Informe um CEP válido (ex: 38700-000).");
      setShippingQuote(null);
      return;
    }
    try {
      const quote = await api.get<ShippingQuote>(`/api/shipping/quote?cep=${encodeURIComponent(cep)}`);
      setShippingQuote(quote);
      setSelectedShipping(quote?.options[0]?.id ?? null);
      setCepError(null);
    } catch {
      setCepError("Não foi possível calcular o frete para esse CEP.");
      setShippingQuote(null);
    }
  }

  function handleCheckout() {
    navigate("/checkout", {
      state: { shippingPrice, shippingLabel: selectedShipping },
    });
  }

  return (
    <>
      <Seo title="Carrinho" description="Revise os itens do seu carrinho na Inovação Store." />
      <div className="container-page py-10 sm:py-14">
        <h1 className="section-title mb-8">Meu carrinho</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-neutral-50 py-24 text-center text-neutral-500">
            <ShoppingBag size={44} strokeWidth={1.25} />
            <p>Seu carrinho está vazio.</p>
            <Link to="/categoria/camisetas" className="btn-primary">
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ul className="flex flex-col divide-y divide-black/5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4 py-5">
                    <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/produto/${item.slug}`} className="font-medium hover:underline">
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-sm text-neutral-500">
                            {item.color} · {item.size}
                          </p>
                          {item.stock <= 0 ? (
                            <p className="mt-0.5 text-xs font-medium text-red-600">Sem estoque disponível</p>
                          ) : item.quantity >= item.stock ? (
                            <p className="mt-0.5 text-xs text-neutral-400">
                              Apenas {item.stock} unidade(s) em estoque
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          aria-label={`Remover ${item.name}`}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <QuantityStepper
                          quantity={item.quantity}
                          onChange={(q) => updateQuantity(item.key, q)}
                          max={Math.max(1, item.stock)}
                        />
                        <span className="font-display text-base">
                          {formatBRL(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-black/10 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-sm tracking-widest text-neutral-500">
                  <Truck size={16} /> Calcular frete
                </h2>
                <form onSubmit={handleCalculateShipping} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Seu CEP"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    className="w-full max-w-[180px] rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                  />
                  <button type="submit" className="btn-outline">
                    Calcular
                  </button>
                </form>
                {cepError && <p className="mt-2 text-sm text-red-600">{cepError}</p>}
                {shippingQuote && (
                  <div className="mt-4 flex flex-col gap-2">
                    {shippingQuote.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                          selectedShipping === opt.id
                            ? "border-brand-ink bg-brand-cream"
                            : "border-black/10"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="shipping"
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
              </div>
            </div>

            <div className="h-fit rounded-2xl bg-brand-cream p-6">
              <h2 className="mb-5 font-display text-lg tracking-wide">Resumo do pedido</h2>

              <form onSubmit={handleApplyCoupon} className="mb-5 flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cupom de desconto"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full rounded-lg border border-black/15 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-ink"
                  />
                </div>
                <button type="submit" className="btn-outline px-4 text-xs">
                  Aplicar
                </button>
              </form>
              {couponError && <p className="-mt-3 mb-4 text-xs text-red-600">{couponError}</p>}
              {coupon && (
                <div className="-mt-3 mb-4 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                  <span>Cupom {coupon.code} aplicado</span>
                  <button type="button" onClick={removeCoupon} className="underline">
                    remover
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Desconto</span>
                    <span>-{formatBRL(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Frete</span>
                  <span>{shippingQuote ? formatBRL(shippingPrice) : "A calcular"}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-black/10 pt-3 font-display text-lg">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>

              <button type="button" onClick={handleCheckout} className="btn-primary mt-6 w-full">
                Finalizar compra
              </button>
              <Link
                to="/categoria/camisetas"
                className="mt-3 block text-center text-sm text-neutral-500 hover:text-brand-ink"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
