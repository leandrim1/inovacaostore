import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAdminCoupon,
  useCreateCoupon,
  useUpdateCoupon,
  type CouponInput,
} from "../../hooks/admin/useAdminCoupons";

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminCouponFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: coupon, isLoading: isLoadingCoupon } = useAdminCoupon(id);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [percentOff, setPercentOff] = useState(10);
  const [active, setActive] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [hasMaxRedemptions, setHasMaxRedemptions] = useState(false);
  const [maxRedemptions, setMaxRedemptions] = useState(50);
  const [hasMaxPerCustomer, setHasMaxPerCustomer] = useState(true);
  const [maxRedemptionsPerCustomer, setMaxRedemptionsPerCustomer] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coupon) return;
    setCode(coupon.code);
    setDescription(coupon.description);
    setPercentOff(coupon.percentOff);
    setActive(coupon.active);
    setStartsAt(toDatetimeLocal(coupon.startsAt));
    setExpiresAt(toDatetimeLocal(coupon.expiresAt));
    setHasMaxRedemptions(coupon.maxRedemptions != null);
    if (coupon.maxRedemptions != null) setMaxRedemptions(coupon.maxRedemptions);
    setHasMaxPerCustomer(coupon.maxRedemptionsPerCustomer != null);
    if (coupon.maxRedemptionsPerCustomer != null) setMaxRedemptionsPerCustomer(coupon.maxRedemptionsPerCustomer);
  }, [coupon]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: CouponInput = {
      code,
      description,
      percentOff: Number(percentOff),
      active,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      maxRedemptions: hasMaxRedemptions ? Number(maxRedemptions) : null,
      maxRedemptionsPerCustomer: hasMaxPerCustomer ? Number(maxRedemptionsPerCustomer) : null,
    };

    try {
      if (isEditing && id) {
        const { code: _code, ...updateData } = payload;
        await updateCoupon.mutateAsync({ id, data: updateData });
        navigate("/admin/cupons");
      } else {
        const created = await createCoupon.mutateAsync(payload);
        navigate(`/admin/cupons/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o cupom.");
    }
  }

  if (isEditing && isLoadingCoupon) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  const isSaving = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">{isEditing ? "Editar cupom" : "Novo cupom"}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">CUPOM</h2>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-neutral-500">
                Código
                <input
                  required
                  disabled={isEditing}
                  placeholder="Ex: BEMVINDO10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full admin-input px-3 py-2 font-mono uppercase disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                />
                {isEditing && (
                  <span className="mt-1 block text-xs font-normal normal-case text-neutral-400">
                    O código não pode ser alterado depois de criado.
                  </span>
                )}
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Descrição (uso interno, opcional)
                <input
                  placeholder="Ex: Cupom de boas-vindas para novos clientes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Desconto (%)
                <input
                  required
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={percentOff}
                  onChange={(e) => setPercentOff(Number(e.target.value))}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">VALIDADE</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-neutral-500">
                Válido a partir de (opcional)
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
              <label className="text-xs font-medium text-neutral-500">
                Válido até (opcional)
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1 w-full admin-input px-3 py-2"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Deixe os dois em branco para um cupom sem prazo de validade.
            </p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">LIMITES DE USO</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hasMaxRedemptions}
                    onChange={(e) => setHasMaxRedemptions(e.target.checked)}
                    className="h-4 w-4 accent-brand-ink"
                  />
                  Limitar quantos clientes podem usar este cupom no total
                </label>
                {hasMaxRedemptions && (
                  <input
                    type="number"
                    min={1}
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                    className="w-full max-w-[160px] admin-input px-3 py-2"
                  />
                )}
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hasMaxPerCustomer}
                    onChange={(e) => setHasMaxPerCustomer(e.target.checked)}
                    className="h-4 w-4 accent-brand-ink"
                  />
                  Limitar quantas vezes o mesmo cliente pode usar
                </label>
                {hasMaxPerCustomer && (
                  <input
                    type="number"
                    min={1}
                    value={maxRedemptionsPerCustomer}
                    onChange={(e) => setMaxRedemptionsPerCustomer(Number(e.target.value))}
                    className="w-full max-w-[160px] admin-input px-3 py-2"
                  />
                )}
                <p className="mt-1.5 text-xs text-neutral-400">
                  Sem esse limite, um único cliente pode aplicar o cupom em vários pedidos diferentes.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">STATUS</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-brand-ink"
              />
              Cupom ativo (pode ser aplicado no carrinho)
            </label>
            {isEditing && coupon && (
              <p className="mt-3 text-xs text-neutral-400">
                Já usado {coupon.usedCount} {coupon.usedCount === 1 ? "vez" : "vezes"}
                {coupon.maxRedemptions != null ? ` de um limite de ${coupon.maxRedemptions}` : ""}.
              </p>
            )}
          </section>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={isSaving} className="btn-primary w-full disabled:opacity-60">
            {isSaving ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar cupom"}
          </button>
        </div>
      </form>
    </div>
  );
}
