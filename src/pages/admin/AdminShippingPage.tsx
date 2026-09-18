import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  useAdminShippingSettings,
  useAdminShippingTiers,
  useCreateShippingTier,
  useDeleteShippingTier,
  useUpdateShippingSettings,
  useUpdateShippingTier,
  type FreeShippingRegion,
  type ShippingSettingsInput,
  type ShippingTier,
  type ShippingTierInput,
} from "../../hooks/admin/useAdminShipping";

const inputClass =
  "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink";
const labelClass = "text-xs font-medium text-neutral-500";
const sectionClass = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5";

const EMPTY_TIER_DRAFT: ShippingTierInput = { minKm: 0, maxKm: null, price: 0, costPrice: null, etaLabel: "", order: 0 };

export default function AdminShippingPage() {
  const { data: settings, isLoading: settingsLoading } = useAdminShippingSettings();
  const updateSettings = useUpdateShippingSettings();
  const { data: tiers = [], isLoading: tiersLoading } = useAdminShippingTiers();
  const createTier = useCreateShippingTier();
  const updateTier = useUpdateShippingTier();
  const deleteTier = useDeleteShippingTier();

  const [enabled, setEnabled] = useState(true);
  const [originLat, setOriginLat] = useState("0");
  const [originLng, setOriginLng] = useState("0");
  const [freeShippingMinOrderValue, setFreeShippingMinOrderValue] = useState("");
  const [freeShippingRegions, setFreeShippingRegions] = useState<FreeShippingRegion[]>([]);
  const [newRegionState, setNewRegionState] = useState("");
  const [newRegionCity, setNewRegionCity] = useState("");
  const [minShippingPrice, setMinShippingPrice] = useState("0");
  const [freeWeightKg, setFreeWeightKg] = useState("0");
  const [pricePerExtraKg, setPricePerExtraKg] = useState("0");
  const [freeVolumeM3, setFreeVolumeM3] = useState("0");
  const [pricePerExtraM3, setPricePerExtraM3] = useState("0");
  const [fallbackFlatPrice, setFallbackFlatPrice] = useState("25");

  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [newTier, setNewTier] = useState<ShippingTierInput>(EMPTY_TIER_DRAFT);
  const [tierError, setTierError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ShippingTierInput>(EMPTY_TIER_DRAFT);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setOriginLat(String(settings.originLat));
    setOriginLng(String(settings.originLng));
    setFreeShippingMinOrderValue(
      settings.freeShippingMinOrderValue != null ? String(settings.freeShippingMinOrderValue) : "",
    );
    setFreeShippingRegions(settings.freeShippingRegions);
    setMinShippingPrice(String(settings.minShippingPrice));
    setFreeWeightKg(String(settings.freeWeightKg));
    setPricePerExtraKg(String(settings.pricePerExtraKg));
    setFreeVolumeM3(String(settings.freeVolumeM3));
    setPricePerExtraM3(String(settings.pricePerExtraM3));
    setFallbackFlatPrice(String(settings.fallbackFlatPrice));
  }, [settings]);

  function addRegion() {
    if (!newRegionState.trim() || newRegionState.trim().length !== 2) return;
    setFreeShippingRegions((prev) => [
      ...prev,
      { state: newRegionState.trim().toUpperCase(), city: newRegionCity.trim() || undefined },
    ]);
    setNewRegionState("");
    setNewRegionCity("");
  }

  function removeRegion(index: number) {
    setFreeShippingRegions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSaved(false);

    const payload: ShippingSettingsInput = {
      enabled,
      originLat: Number(originLat),
      originLng: Number(originLng),
      freeShippingMinOrderValue: freeShippingMinOrderValue.trim() ? Number(freeShippingMinOrderValue) : null,
      freeShippingRegions,
      minShippingPrice: Number(minShippingPrice),
      freeWeightKg: Number(freeWeightKg),
      pricePerExtraKg: Number(pricePerExtraKg),
      freeVolumeM3: Number(freeVolumeM3),
      pricePerExtraM3: Number(pricePerExtraM3),
      fallbackFlatPrice: Number(fallbackFlatPrice),
    };

    try {
      await updateSettings.mutateAsync(payload);
      setSettingsSaved(true);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Não foi possível salvar as configurações.");
    }
  }

  async function handleCreateTier(e: React.FormEvent) {
    e.preventDefault();
    setTierError(null);
    try {
      await createTier.mutateAsync(newTier);
      setNewTier(EMPTY_TIER_DRAFT);
    } catch (err) {
      setTierError(err instanceof Error ? err.message : "Não foi possível criar a faixa.");
    }
  }

  function startEditTier(tier: ShippingTier) {
    setEditingId(tier.id);
    setEditDraft({
      minKm: tier.minKm,
      maxKm: tier.maxKm,
      price: tier.price,
      costPrice: tier.costPrice,
      etaLabel: tier.etaLabel ?? "",
      order: tier.order,
    });
  }

  async function saveEditTier(id: string) {
    setTierError(null);
    try {
      await updateTier.mutateAsync({ id, data: editDraft });
      setEditingId(null);
    } catch (err) {
      setTierError(err instanceof Error ? err.message : "Não foi possível salvar a faixa.");
    }
  }

  async function handleDeleteTier(tier: ShippingTier) {
    if (!confirm(`Excluir a faixa de ${tier.minKm}km${tier.maxKm ? ` a ${tier.maxKm}km` : " (sem limite)"}?`))
      return;
    setTierError(null);
    try {
      await deleteTier.mutateAsync(tier.id);
    } catch (err) {
      setTierError(err instanceof Error ? err.message : "Não foi possível excluir a faixa.");
    }
  }

  if (settingsLoading) {
    return <p className="text-neutral-400">Carregando…</p>;
  }

  const isSavingSettings = updateSettings.isPending;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl tracking-wide">Frete por distância</h1>
      <p className="-mt-4 text-sm text-neutral-500">
        O frete é calculado a partir da distância em linha reta entre a loja e o CEP do cliente,
        usando as faixas configuradas abaixo. Ajuste também frete grátis, piso mínimo e adicionais de
        peso/volume.
      </p>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">STATUS</h2>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-brand-ink"
              />
              Cálculo de frete por distância ativado
            </label>
            <p className="mt-1 text-xs text-neutral-400">
              Se desativado, todo pedido usa o valor fixo de "Frete de contingência" abaixo.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              ORIGEM (LOJA)
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Latitude
                <input
                  type="number"
                  step="0.000001"
                  value={originLat}
                  onChange={(e) => setOriginLat(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Longitude
                <input
                  type="number"
                  step="0.000001"
                  value={originLng}
                  onChange={(e) => setOriginLng(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Coordenadas do endereço da loja, usadas como ponto de partida da distância. Só altere se
              a loja mudar de endereço.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">FRETE GRÁTIS</h2>
            <label className={labelClass}>
              Valor mínimo do pedido para frete grátis (R$, deixe vazio para desativar)
              <input
                type="number"
                step="0.01"
                min={0}
                value={freeShippingMinOrderValue}
                onChange={(e) => setFreeShippingMinOrderValue(e.target.value)}
                placeholder="Ex: 300"
                className={inputClass}
              />
            </label>

            <div className="mt-4">
              <p className={labelClass}>Regiões com frete sempre grátis</p>
              {freeShippingRegions.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {freeShippingRegions.map((r, i) => (
                    <li
                      key={`${r.state}-${r.city ?? ""}-${i}`}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                    >
                      <span>
                        {r.city ? `${r.city} - ` : "Estado inteiro: "}
                        {r.state}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRegion(i)}
                        className="rounded-lg p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={newRegionCity}
                  onChange={(e) => setNewRegionCity(e.target.value)}
                  placeholder="Cidade (opcional)"
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
                />
                <input
                  value={newRegionState}
                  onChange={(e) => setNewRegionState(e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={2}
                  className="w-20 rounded-lg border border-black/10 px-3 py-2 text-sm uppercase outline-none focus:border-brand-ink"
                />
                <button
                  type="button"
                  onClick={addRegion}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-brand-ink transition-colors hover:border-brand-ink"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Deixe a cidade em branco para liberar o estado inteiro.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              PISO E CONTINGÊNCIA
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Valor mínimo de frete (R$)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={minShippingPrice}
                  onChange={(e) => setMinShippingPrice(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Frete de contingência (R$)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={fallbackFlatPrice}
                  onChange={(e) => setFallbackFlatPrice(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              O frete de contingência é usado quando o cálculo por distância está desativado.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              ADICIONAL POR PESO E VOLUME
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                Peso livre por pedido (kg)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={freeWeightKg}
                  onChange={(e) => setFreeWeightKg(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Adicional por kg excedente (R$)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={pricePerExtraKg}
                  onChange={(e) => setPricePerExtraKg(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Volume livre por pedido (m³)
                <input
                  type="number"
                  step="0.001"
                  min={0}
                  value={freeVolumeM3}
                  onChange={(e) => setFreeVolumeM3(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Adicional por m³ excedente (R$)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={pricePerExtraM3}
                  onChange={(e) => setPricePerExtraM3(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>
        </div>

        <div className="h-fit rounded-2xl bg-brand-cream p-5 ring-1 ring-black/5">
          {settingsError && <p className="alert-error mb-3">{settingsError}</p>}
          {settingsSaved && !isSavingSettings && (
            <p className="alert-success mb-3">Configurações salvas com sucesso.</p>
          )}
          <button type="submit" disabled={isSavingSettings} className="btn-primary w-full disabled:opacity-60">
            {isSavingSettings ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </form>

      <section className={sectionClass}>
        <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">
          FAIXAS DE DISTÂNCIA
        </h2>
        <p className="mb-4 text-xs text-neutral-400">
          Preço e prazo aplicados de acordo com a distância (em linha reta) entre a loja e o CEP do
          cliente. Deixe "até (km)" em branco na última faixa para cobrir qualquer distância acima
          dela.
        </p>

        <form
          onSubmit={handleCreateTier}
          className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 sm:grid-cols-7"
        >
          <input
            type="number"
            min={0}
            step="0.1"
            required
            placeholder="De (km)"
            value={newTier.minKm}
            onChange={(e) => setNewTier({ ...newTier, minKm: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Até (km)"
            value={newTier.maxKm ?? ""}
            onChange={(e) => setNewTier({ ...newTier, maxKm: e.target.value === "" ? null : Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="Preço (R$)"
            value={newTier.price}
            onChange={(e) => setNewTier({ ...newTier, price: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Custo (R$)"
            value={newTier.costPrice ?? ""}
            onChange={(e) => setNewTier({ ...newTier, costPrice: e.target.value === "" ? null : Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            placeholder="Prazo (ex: 3 a 5 dias úteis)"
            value={newTier.etaLabel}
            onChange={(e) => setNewTier({ ...newTier, etaLabel: e.target.value })}
            className="col-span-2 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <input
            type="number"
            placeholder="Ordem"
            value={newTier.order}
            onChange={(e) => setNewTier({ ...newTier, order: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-ink"
          />
          <button type="submit" className="btn-primary col-span-2 justify-center sm:col-span-7">
            <Plus size={16} /> Adicionar faixa
          </button>
        </form>

        {tierError && <p className="mb-3 text-sm text-red-600">{tierError}</p>}

        <div className="hidden overflow-x-auto rounded-xl ring-1 ring-black/5 sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
                <th className="py-3 pl-4 pr-3">De (km)</th>
                <th className="py-3 pr-3">Até (km)</th>
                <th className="py-3 pr-3">Preço</th>
                <th className="py-3 pr-3">Custo</th>
                <th className="py-3 pr-3">Prazo</th>
                <th className="py-3 pr-3">Ordem</th>
                <th className="py-3 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tiersLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    Carregando…
                  </td>
                </tr>
              ) : tiers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    Nenhuma faixa cadastrada.
                  </td>
                </tr>
              ) : (
                tiers.map((tier) => (
                  <tr key={tier.id} className="border-b border-black/5 last:border-0">
                    {editingId === tier.id ? (
                      <>
                        <td className="py-2 pl-4 pr-3">
                          <input
                            type="number"
                            value={editDraft.minKm}
                            onChange={(e) => setEditDraft({ ...editDraft, minKm: Number(e.target.value) })}
                            className="w-20 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            value={editDraft.maxKm ?? ""}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, maxKm: e.target.value === "" ? null : Number(e.target.value) })
                            }
                            className="w-20 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editDraft.price}
                            onChange={(e) => setEditDraft({ ...editDraft, price: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            step="0.01"
                            value={editDraft.costPrice ?? ""}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, costPrice: e.target.value === "" ? null : Number(e.target.value) })
                            }
                            className="w-24 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            value={editDraft.etaLabel}
                            onChange={(e) => setEditDraft({ ...editDraft, etaLabel: e.target.value })}
                            className="w-40 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            value={editDraft.order}
                            onChange={(e) => setEditDraft({ ...editDraft, order: Number(e.target.value) })}
                            className="w-16 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-brand-ink"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveEditTier(tier.id)}
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 pl-4 pr-3 font-medium text-brand-ink">{tier.minKm}</td>
                        <td className="py-2.5 pr-3">{tier.maxKm ?? "sem limite"}</td>
                        <td className="py-2.5 pr-3">
                          {tier.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="py-2.5 pr-3 text-neutral-500">
                          {tier.costPrice != null ? tier.costPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-neutral-600">{tier.etaLabel ?? "—"}</td>
                        <td className="py-2.5 pr-3">{tier.order}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditTier(tier)}
                              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTier(tier)}
                              className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:hidden">
          {tiersLoading ? (
            <div className="rounded-xl p-6 text-center text-sm text-neutral-400 ring-1 ring-black/5">Carregando…</div>
          ) : tiers.length === 0 ? (
            <div className="rounded-xl p-6 text-center text-sm text-neutral-400 ring-1 ring-black/5">
              Nenhuma faixa cadastrada.
            </div>
          ) : (
            tiers.map((tier) => (
              <div key={tier.id} className="rounded-xl p-4 ring-1 ring-black/5">
                {editingId === tier.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={editDraft.minKm}
                        onChange={(e) => setEditDraft({ ...editDraft, minKm: Number(e.target.value) })}
                        placeholder="De (km)"
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                      <input
                        type="number"
                        value={editDraft.maxKm ?? ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, maxKm: e.target.value === "" ? null : Number(e.target.value) })
                        }
                        placeholder="Até (km)"
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editDraft.price}
                        onChange={(e) => setEditDraft({ ...editDraft, price: Number(e.target.value) })}
                        placeholder="Preço (R$)"
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editDraft.costPrice ?? ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, costPrice: e.target.value === "" ? null : Number(e.target.value) })
                        }
                        placeholder="Custo (R$)"
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                      <input
                        value={editDraft.etaLabel}
                        onChange={(e) => setEditDraft({ ...editDraft, etaLabel: e.target.value })}
                        placeholder="Prazo (ex: 3 a 5 dias úteis)"
                        className="col-span-2 rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                      <input
                        type="number"
                        value={editDraft.order}
                        onChange={(e) => setEditDraft({ ...editDraft, order: Number(e.target.value) })}
                        placeholder="Ordem"
                        className="rounded-lg border border-black/10 px-2.5 py-2 text-sm outline-none focus:border-brand-ink"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => saveEditTier(tier.id)}
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-brand-ink">
                        {tier.minKm} – {tier.maxKm ?? "sem limite"} km
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditTier(tier)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand-ink"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier)}
                          className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                      <span>
                        Preço: <strong className="text-brand-ink">{tier.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                      </span>
                      <span>
                        Custo:{" "}
                        {tier.costPrice != null
                          ? tier.costPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </span>
                      <span>Ordem: {tier.order}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{tier.etaLabel ?? "—"}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
