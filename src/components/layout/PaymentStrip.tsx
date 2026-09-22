import { ShieldCheck } from "lucide-react";
import { useSiteSettings } from "../../hooks/useSiteSettings";

/**
 * Faixa de formas de pagamento do rodapé.
 *
 * Fica sobre o creme, entre o cartão branco do rodapé e a linha de
 * copyright: é ali que as bandeirinhas brancas ganham contraste sem precisar
 * de borda grossa. Três decisões que separam isso de uma fileira de logos
 * solta:
 *
 * 1. Todas as marcas no mesmo enquadramento e na mesma pastilha, então a
 *    fileira lê como um conjunto — e não como logos de tamanhos diferentes
 *    colados um do lado do outro.
 * 2. Em vez de quebrar em linhas tortas no celular, a fileira vira um
 *    carrossel horizontal com a barra de rolagem escondida: o bloco mantém
 *    uma altura só em qualquer tela.
 * 3. O selo de compra segura usa o preto e o amarelo da marca, não o verde
 *    genérico de plataforma — o rodapé continua parecendo desta loja.
 *
 * As bandeiras vêm inteiramente do painel (Configurações › Formas de
 * pagamento) — as dez iniciais já vêm cadastradas por migração. Não existe
 * lista de reserva em código de propósito: se houvesse, excluir uma bandeira
 * no painel a traria de volta no site, que é o oposto do que o lojista pediu
 * ao excluir. Sem nenhuma cadastrada, só o selo continua aparecendo.
 */
/** A pastilha é a mesma nos dois casos: é ela que dá unidade à fileira. */
const PASTILHA =
  "flex h-10 w-[58px] shrink-0 snap-start items-center justify-center rounded-xl bg-white p-2 " +
  "shadow-[0_1px_2px_rgba(10,10,10,0.05)] ring-1 ring-brand-ink/[0.08] transition-all duration-300 " +
  "hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-8px_rgba(10,10,10,0.25)] hover:ring-brand-ink/20";

export function PaymentStrip() {
  const { data: settings } = useSiteSettings();
  const doPainel = settings.paymentMethods ?? [];

  return (
    <div className="border-t border-brand-ink/[0.07] px-6 py-7 sm:px-10 sm:py-8 lg:px-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        {doPainel.length > 0 && (
        <div className="flex min-w-0 flex-col gap-3.5">
          <h3 className="font-display text-xs tracking-[0.3em] text-neutral-400">
            Formas de pagamento
          </h3>

          {/* `-mx-* px-*` deixa a primeira e a última pastilha respirarem nas
              pontas quando a fileira rola no celular, sem cortar a sombra. */}
          <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {doPainel.map((forma) => (
              <li key={forma.id} title={forma.label || undefined} className={PASTILHA}>
                <img
                  src={forma.url}
                  // Sem nome cadastrado a bandeira entra como decorativa: o
                  // texto logo abaixo já diz o que a loja aceita, e anunciar
                  // um nome inventado seria pior que não anunciar nada.
                  alt={forma.label}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </li>
            ))}
          </ul>

          {/* Só o que o checkout realmente oferece hoje (pix, cartão e boleto).
              Nada de prometer número de parcelas ou desconto que a loja não
              tenha configurado. */}
          <p className="text-xs text-neutral-400">
            Escolha Pix, cartão ou boleto na finalização da compra
          </p>
        </div>
        )}

        <div className="flex shrink-0 items-center gap-3.5 self-start rounded-2xl bg-brand-ink px-5 py-4 lg:self-auto">
          <ShieldCheck size={28} strokeWidth={1.6} className="shrink-0 text-brand-yellow" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <p className="font-display text-sm leading-none tracking-[0.16em] text-white">
              Compra 100% segura
            </p>
            <p className="text-xs leading-tight text-white/55">
              Seus dados trafegam criptografados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
