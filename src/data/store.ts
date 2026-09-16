export const STORE = {
  name: "Inovação Store",
  shortName: "Inovação",
  tagline: "Moda masculina nacional e importada",
  description:
    "Loja de roupas masculinas com peças nacionais e importadas. Camisetas, camisas, calças, bermudas, jaquetas e acessórios com estilo urbano e premium.",
  address: {
    street: "Rua Ouro Preto, 784",
    city: "Patos de Minas",
    state: "MG",
    zip: "38700-000",
  },
  contact: {
    whatsapp: "5534900000000",
    whatsappDisplay: "(34) 90000-0000",
    email: "contato@inovacaostore.com.br",
  },
  hours: [
    { label: "Segunda a Sexta", value: "09h às 18h" },
    { label: "Sábado", value: "09h às 13h" },
  ],
  social: {
    instagram: "https://www.instagram.com/inovacaostore__",
    instagramHandle: "@inovacaostore__",
  },
  seoDefaultTitle: "Inovação Store | Roupas Masculinas Nacionais e Importadas",
  seoDefaultDescription:
    "Inovação Store — moda masculina em Patos de Minas. Camisetas, camisas, calças, bermudas, jaquetas e acessórios nacionais e importados. Compre online com frete para todo o Brasil.",
} as const;

export function buildWhatsAppLink(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${STORE.contact.whatsapp}?text=${encoded}`;
}
