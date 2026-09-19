export const TESTIMONIAL_STATUSES = ["pendente", "aprovado", "reprovado"] as const;

export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export const APPROVED_STATUS: TestimonialStatus = "aprovado";
export const PENDING_STATUS: TestimonialStatus = "pendente";

/** Status de pedido que libera o cliente a avaliar a loja. */
export const DELIVERED_ORDER_STATUS = "entregue";
