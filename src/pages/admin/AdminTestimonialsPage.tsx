import { useState } from "react";
import { Check, Star, Trash2, X } from "lucide-react";
import {
  useAdminTestimonials,
  useDeleteTestimonial,
  useUpdateTestimonial,
  type AdminTestimonial,
  type TestimonialStatus,
} from "../../hooks/admin/useAdminTestimonials";
import { StarRating } from "../../components/ui/StarRating";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";

const FILTERS: { value: string; label: string }[] = [
  { value: "pendente", label: "Pendentes" },
  { value: "aprovado", label: "Publicados" },
  { value: "reprovado", label: "Reprovados" },
  { value: "", label: "Todos" },
];

const STATUS_STYLES: Record<TestimonialStatus, string> = {
  pendente: "bg-amber-100 text-amber-700",
  aprovado: "bg-green-100 text-green-700",
  reprovado: "bg-neutral-200 text-neutral-600",
};

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  pendente: "Aguardando",
  aprovado: "No site",
  reprovado: "Reprovado",
};

function TestimonialCard({
  testimonial,
  onStatus,
  onToggleFeatured,
  onDelete,
  busy,
}: {
  testimonial: AdminTestimonial;
  onStatus: (status: TestimonialStatus) => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const t = testimonial;
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-brand-ink">{t.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[t.status]}`}>
              {STATUS_LABELS[t.status]}
            </span>
            {t.featured && (
              <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[11px] font-medium text-brand-ink">
                Destaque
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">
            {t.city || "Sem cidade"} · {new Date(t.createdAt).toLocaleDateString("pt-BR")}
            {t.customer ? ` · ${t.customer.email}` : " · cadastrado pela loja"}
          </p>
        </div>
        <StarRating rating={t.rating} size={14} />
      </div>

      <blockquote className="border-l-2 border-brand-yellow pl-3 text-sm leading-relaxed text-neutral-600">
        “{t.quote}”
      </blockquote>

      <div className="flex flex-wrap items-center gap-2">
        {t.status !== "aprovado" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus("aprovado")}
            className="flex items-center gap-1.5 rounded-lg bg-brand-ink px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            <Check size={14} /> Publicar no site
          </button>
        )}
        {t.status !== "reprovado" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus("reprovado")}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-brand-ink hover:text-brand-ink disabled:opacity-60"
          >
            <X size={14} /> {t.status === "aprovado" ? "Tirar do site" : "Reprovar"}
          </button>
        )}
        {t.status === "aprovado" && (
          <button
            type="button"
            disabled={busy}
            onClick={onToggleFeatured}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
              t.featured
                ? "border-brand-yellow-dark bg-brand-yellow/20 text-brand-ink"
                : "border-black/10 text-neutral-600 hover:border-brand-ink hover:text-brand-ink"
            }`}
          >
            <Star size={14} className={t.featured ? "fill-brand-yellow text-brand-yellow-dark" : ""} />
            {t.featured ? "Em destaque" : "Destacar"}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          aria-label="Excluir depoimento"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

export default function AdminTestimonialsPage() {
  const [filter, setFilter] = useState("pendente");
  const { data, isLoading } = useAdminTestimonials(filter ? { status: filter } : {});
  const updateTestimonial = useUpdateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();
  const [error, setError] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  const items = data?.items ?? [];
  const pendingCount = data?.pendingCount ?? 0;
  const busy = updateTestimonial.isPending || deleteTestimonial.isPending;

  async function handleStatus(id: string, status: TestimonialStatus) {
    setError(null);
    try {
      // Tirar do site também remove o destaque: um depoimento reprovado em
      // destaque voltaria para o topo se fosse republicado sem querer.
      await updateTestimonial.mutateAsync({
        id,
        data: status === "aprovado" ? { status } : { status, featured: false },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o depoimento.");
    }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    setError(null);
    try {
      await updateTestimonial.mutateAsync({ id, data: { featured: !current } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o depoimento.");
    }
  }

  function handleDelete(id: string, name: string) {
    confirmDialog.ask({
      title: "Excluir depoimento",
      description: `O depoimento de ${name} será apagado para sempre. Se a ideia é só tirá-lo do site, use "Tirar do site".`,
      onConfirm: async () => {
        setError(null);
        try {
          await deleteTestimonial.mutateAsync(id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Não foi possível excluir.");
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide">Depoimentos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Os clientes enviam pelo site e só aparecem na loja depois que você publicar.
        </p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-brand-ink text-white"
                : "bg-white text-neutral-600 ring-1 ring-black/5 hover:text-brand-ink"
            }`}
          >
            {f.label}
            {f.value === "pendente" && pendingCount > 0 && (
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold ${
                  filter === f.value ? "bg-brand-yellow text-brand-ink" : "bg-amber-100 text-amber-700"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-neutral-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">
            {filter === "pendente"
              ? "Nenhum depoimento aguardando aprovação."
              : "Nenhum depoimento nesta situação."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((t) => (
            <TestimonialCard
              key={t.id}
              testimonial={t}
              busy={busy}
              onStatus={(status) => handleStatus(t.id, status)}
              onToggleFeatured={() => handleToggleFeatured(t.id, t.featured)}
              onDelete={() => handleDelete(t.id, t.name)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </div>
  );
}
