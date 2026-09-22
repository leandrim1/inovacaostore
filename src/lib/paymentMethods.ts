/**
 * Rótulos das formas de pagamento que o checkout oferece.
 *
 * Fica num arquivo só porque o mesmo `paymentMethod` cru do banco aparece em
 * três telas (meus pedidos, minha conta e o painel de formas de pagamento do
 * dashboard) — com um mapa por tela, a primeira renomeação deixaria as telas
 * discordando entre si.
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};

/** Sem rótulo conhecido devolve o próprio valor — nunca um nome inventado. */
export function paymentMethodLabel(method: string) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
