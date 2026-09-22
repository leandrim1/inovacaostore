import { useCallback, useEffect, useRef, useState } from "react";
import { lookupCep, type CepAddress } from "../lib/cep";

/**
 * Preenchimento automático do endereço a partir do CEP.
 *
 * Fica num hook porque as duas telas que pedem endereço (o cadastro em
 * /minha-conta/enderecos e o checkout) precisam do mesmo comportamento — e
 * de duas proteções que é fácil esquecer ao repetir o código:
 *
 * 1. Não repete a consulta do mesmo CEP. Sem isso, apagar e redigitar o
 *    último dígito dispararia a busca de novo a cada tecla.
 * 2. Ignora a resposta de uma consulta que ficou para trás. Quem digita um
 *    CEP, se arrepende e digita outro pode ter a resposta lenta do primeiro
 *    chegando depois — e sobrescrevendo o endereço certo pelo antigo.
 */
export function useCepAutofill(onFound: (endereco: CepAddress) => void) {
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ultimoConsultado = useRef("");
  /** Cresce a cada busca; só a resposta da mais recente é aproveitada. */
  const versao = useRef(0);
  // Guarda o callback num ref para a identidade de `buscar` não mudar a cada
  // render da página que usa o hook. A escrita vai num efeito, não no corpo
  // do render: um render descartado pelo React deixaria o ref apontando para
  // um callback que nunca chegou a valer.
  const onFoundRef = useRef(onFound);
  useEffect(() => {
    onFoundRef.current = onFound;
  });

  const buscar = useCallback(async (cep: string) => {
    const digitos = cep.replace(/\D/g, "");

    if (digitos.length !== 8) {
      setErro(null);
      // CEP incompleto volta a valer para consulta: quem apaga um dígito e
      // digita o mesmo de novo espera que busque.
      ultimoConsultado.current = "";
      return;
    }
    if (digitos === ultimoConsultado.current) return;

    ultimoConsultado.current = digitos;
    const minhaVersao = ++versao.current;
    setBuscando(true);
    setErro(null);

    try {
      const endereco = await lookupCep(digitos);
      if (minhaVersao !== versao.current) return;
      onFoundRef.current(endereco);
    } catch (err) {
      if (minhaVersao !== versao.current) return;
      // O CEP volta a valer para nova tentativa: quem errou digitando e
      // corrigiu precisa que a busca dispare outra vez.
      ultimoConsultado.current = "";
      setErro(err instanceof Error ? err.message : "Não foi possível consultar o CEP.");
    } finally {
      if (minhaVersao === versao.current) setBuscando(false);
    }
  }, []);

  return { buscando, erro, buscar };
}
