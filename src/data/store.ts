export const STORE = {
  name: "Inovação Store",
  shortName: "Inovação",
  tagline: "Moda masculina nacional e importada",
  description:
    "Loja de roupas masculinas com peças nacionais e importadas. Camisetas, camisas, calças, bermudas, jaquetas e acessórios com estilo urbano e premium.",
  /**
   * Valor inicial do endereço. A partir daqui quem manda é o painel
   * (Configurações › Endereço da loja); isto só é usado enquanto a primeira
   * resposta da API não chega.
   */
  address: {
    street: "Rua Ouro Preto, 784",
    city: "Patos de Minas",
    state: "MG",
    zip: "38700-000",
  },
  contact: {
    whatsapp: "5534996576357",
    whatsappDisplay: "(34) 99657-6357",
    email: "inovacaostoretiktok@gmail.com",
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

export function buildWhatsAppLink(phone: string, message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/** Formata um número tipo "5534996576357" como "(34) 99657-6357". */
export function formatWhatsAppDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  const match = local.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (!match) return phone;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

/**
 * O endereço mora nas Configurações do painel (SiteSettings). Estas funções
 * recebem as configurações inteiras para que nenhuma tela precise remontar o
 * endereço por conta própria — e para que trocar a loja de lugar seja uma
 * edição só, no painel.
 */
export interface AddressSource {
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
}

/** Endereço completo em uma linha, como se escreve num envelope. */
export function formatStoreAddress(a: AddressSource) {
  return `${a.addressStreet}, ${a.addressCity} - ${a.addressState}, ${a.addressZip}`;
}

/** "Patos de Minas - MG" — o jeito curto, usado no rodapé e nos textos. */
export function formatCityState(a: AddressSource) {
  return `${a.addressCity} - ${a.addressState}`;
}

/**
 * Link universal do Google Maps. No celular o próprio sistema abre o
 * aplicativo do Maps; no computador abre o site com o endereço já buscado.
 */
export function buildMapsLink(a: AddressSource) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatStoreAddress(a))}`;
}

/** Abre o aplicativo de e-mail do aparelho já com destinatário e assunto. */
export function buildMailtoLink(email: string, subject = `Contato pelo site da ${STORE.name}`) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
