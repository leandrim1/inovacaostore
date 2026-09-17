export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Lucas Almeida",
    city: "Patos de Minas, MG",
    rating: 5,
    quote:
      "Comprei duas camisetas e a qualidade surpreendeu. Chegou rápido e o caimento é perfeito. Já virei cliente fiel.",
  },
  {
    id: "t2",
    name: "Rafael Souza",
    city: "Patos de Minas, MG",
    rating: 5,
    quote:
      "Atendimento excelente pelo WhatsApp, tiraram todas as minhas dúvidas antes da compra. Recomendo demais a loja.",
  },
  {
    id: "t3",
    name: "Gabriel Ferreira",
    city: "Uberlândia, MG",
    rating: 4,
    quote:
      "Peças com ótimo custo-benefício e estilo diferenciado. A calça jeans ficou show, com certeza vou comprar mais.",
  },
  {
    id: "t4",
    name: "Matheus Costa",
    city: "Patos de Minas, MG",
    rating: 5,
    quote:
      "Loja de confiança, embalagem caprichada e troca facilitada quando precisei mudar o tamanho. Nota 10!",
  },
];

export const AVERAGE_RATING =
  Math.round((TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / TESTIMONIALS.length) * 10) / 10;
