import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
  featured: boolean;
  /** Enviado por um cliente com pedido entregue ("Compra verificada"). */
  verified: boolean;
  createdAt: string;
}

export interface TestimonialsResponse {
  items: Testimonial[];
  averageRating: number | null;
  count: number;
}

/** Motivo pelo qual o cliente ainda não pode enviar um depoimento. */
export type TestimonialBlockReason =
  | "nao_logado"
  | "email_nao_verificado"
  | "sem_pedido_entregue"
  | "ja_enviado"
  | "ja_publicado";

export interface TestimonialEligibility {
  canSubmit: boolean;
  reason: TestimonialBlockReason | null;
  suggestedName: string | null;
}

export interface TestimonialInput {
  name?: string;
  city?: string;
  rating: number;
  quote: string;
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: () => api.get<TestimonialsResponse>("/api/testimonials"),
    staleTime: 60 * 1000,
  });
}

export function useTestimonialEligibility() {
  return useQuery({
    queryKey: ["testimonial-eligibility"],
    queryFn: () => api.get<TestimonialEligibility>("/api/testimonials/eligibility"),
  });
}

export function useCreateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TestimonialInput) => api.post<{ message: string }>("/api/testimonials", data),
    onSuccess: () => {
      // A lista pública não muda agora (entra pendente), mas a elegibilidade sim.
      qc.invalidateQueries({ queryKey: ["testimonial-eligibility"] });
    },
  });
}
