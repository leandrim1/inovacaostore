import { useParams } from "react-router-dom";
import { Seo } from "../components/seo/Seo";
import { STORE, buildWhatsAppLink } from "../data/store";
import { useSiteSettings } from "../hooks/useSiteSettings";
import NotFoundPage from "./NotFoundPage";

const POLICIES: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  "trocas-e-devolucoes": {
    title: "Trocas e devoluções",
    sections: [
      {
        heading: "Prazo para troca",
        text: "Você tem até 30 dias corridos após o recebimento para solicitar a troca de um produto por defeito de fabricação ou por tamanho/cor, desde que a peça esteja sem uso, com etiquetas e embalagem originais.",
      },
      {
        heading: "Direito de arrependimento",
        text: "Conforme o Código de Defesa do Consumidor, compras feitas fora do estabelecimento comercial (como pela internet) podem ser canceladas em até 7 dias corridos após o recebimento, sem necessidade de justificativa.",
      },
      {
        heading: "Como solicitar",
        text: "Entre em contato pelo WhatsApp informando o número do pedido e o motivo da troca ou devolução. Nossa equipe vai orientar sobre o envio da peça e os próximos passos.",
      },
      {
        heading: "Reembolso",
        text: "Em caso de devolução aprovada, o reembolso é feito pelo mesmo meio de pagamento utilizado na compra, em até 10 dias úteis após o recebimento e análise do produto.",
      },
    ],
  },
  privacidade: {
    title: "Política de privacidade",
    sections: [
      {
        heading: "Quais dados coletamos",
        text: "Coletamos apenas os dados necessários para processar seu pedido, como nome, e-mail, telefone e endereço de entrega. Não compartilhamos suas informações com terceiros para fins de marketing sem sua autorização.",
      },
      {
        heading: "Uso dos dados",
        text: "Seus dados são utilizados exclusivamente para processar pedidos, calcular frete, enviar atualizações sobre sua compra e, caso você opte, enviar ofertas por e-mail ou WhatsApp.",
      },
      {
        heading: "Segurança",
        text: "Adotamos medidas técnicas para proteger seus dados contra acessos não autorizados. Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco.",
      },
    ],
  },
  entrega: {
    title: "Prazos de entrega",
    sections: [
      {
        heading: "Cálculo de frete",
        text: "O prazo e valor do frete são calculados automaticamente com base no CEP informado no carrinho ou no checkout, considerando frete econômico e expresso.",
      },
      {
        heading: "Frete grátis",
        text: "Pedidos acima de R$ 299,00 têm frete grátis na modalidade econômica para todo o Brasil.",
      },
      {
        heading: "Retirada na loja",
        text: `Você também pode retirar seu pedido pessoalmente em nossa loja física, na ${STORE.address.street}, ${STORE.address.city} - ${STORE.address.state}.`,
      },
    ],
  },
};

export default function PolicyPage() {
  const { slug = "" } = useParams();
  const { data: settings } = useSiteSettings();
  const policy = POLICIES[slug];

  if (!policy) return <NotFoundPage />;

  return (
    <>
      <Seo title={policy.title} description={`${policy.title} da ${STORE.name}.`} />
      <div className="container-page max-w-3xl py-14">
        <h1 className="section-title mb-8">{policy.title}</h1>
        <div className="flex flex-col gap-6">
          {policy.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="mb-1.5 font-display text-base tracking-wide">{s.heading}</h2>
              <p className="text-sm leading-relaxed text-neutral-600">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-neutral-500">
          Ficou com alguma dúvida?{" "}
          <a
            href={buildWhatsAppLink(settings.whatsappNumber, "Olá! Tenho uma dúvida sobre as políticas da loja.")}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-green-700 hover:underline"
          >
            Fale conosco pelo WhatsApp
          </a>
          .
        </p>
      </div>
    </>
  );
}
