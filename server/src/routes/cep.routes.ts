import { Router } from "express";
import { lookupCepAddress } from "../geocoding.js";
import { cepLookupLimiter } from "../security.js";

/**
 * Consulta de CEP para o formulário de endereço se preencher sozinho.
 *
 * Passa pelo servidor em vez de o navegador chamar a ViaCEP direto por duas
 * razões: o CSP continua sem precisar liberar um domínio externo, e a
 * resposta fica em cache — o segundo cliente que digitar o mesmo CEP nem
 * chega a sair daqui.
 */
export const cepRouter = Router();

const MENSAGENS: Record<string, string> = {
  invalid_cep: "CEP inválido.",
  not_found: "CEP não encontrado.",
  service_unavailable: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente.",
};

cepRouter.get("/:cep", cepLookupLimiter, async (req, res) => {
  const resultado = await lookupCepAddress(req.params.cep);
  if (!resultado.ok) {
    // 503 só quando o serviço externo falhou: o cliente precisa saber que
    // pode digitar à mão, e não que errou o CEP.
    const status = resultado.reason === "service_unavailable" ? 503 : 404;
    res.status(status).json({ error: MENSAGENS[resultado.reason], reason: resultado.reason });
    return;
  }

  const { ok: _ok, ...endereco } = resultado;
  res.json(endereco);
});
