import { api } from "./api";

export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Consulta o endereço de um CEP pelo nosso servidor.
 *
 * Passa pelo backend em vez de chamar a ViaCEP direto do navegador: o CSP
 * continua sem liberar domínio externo e a resposta fica em cache do lado
 * de cá — o segundo cliente que digitar o mesmo CEP nem chega a sair da
 * nossa API. Erros sobem com a mensagem que o servidor mandou.
 */
export function lookupCep(cep: string) {
  const digitos = cep.replace(/\D/g, "");
  return api.get<CepAddress>(`/api/cep/${digitos}`);
}
