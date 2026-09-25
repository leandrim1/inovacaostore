import dns from "node:dns/promises";
import net from "node:net";
import { chave } from "./produtos.js";
import { saveValidatedImage } from "../upload.js";

/**
 * Como as imagens enviadas em massa encontram o produto delas, e como uma
 * imagem informada por endereço (http) é baixada sem virar uma porta de
 * entrada para a rede interna do servidor.
 */

export interface ArquivoEnviado {
  /** Nome original, como o lojista salvou: "CAM-001-02.jpg". */
  nome: string;
  /** Endereço já gravado no storage da loja. */
  url: string;
}

/** "CAM-001-02.jpg" → { base: "cam_001_02", indice: 2 } */
function analisarNome(nome: string) {
  const semExtensao = nome.replace(/\.[a-z0-9]+$/i, "");
  const base = chave(semExtensao);
  const indice = Number(base.match(/_(\d+)$/)?.[1] ?? "0");
  return { base, indice };
}

/**
 * O arquivo pertence ao produto?
 *
 * O nome tem que COMEÇAR com o identificador e, se sobrar alguma coisa, ela
 * precisa começar num separador. Sem essa regra, "CAM-0012-01.jpg" seria
 * puxada para o produto "CAM-001".
 */
function combina(baseArquivo: string, identificador: string) {
  const id = chave(identificador);
  if (!id || !baseArquivo.startsWith(id)) return false;
  const resto = baseArquivo.slice(id.length);
  return resto === "" || resto.startsWith("_");
}

export interface AlvoImagem {
  sku: string;
  nome: string;
  /** Nomes de arquivo citados na planilha para este produto. */
  nomesNaPlanilha: string[];
}

/**
 * Distribui os arquivos enviados entre os produtos.
 *
 * Ordem de preferência, a mesma da prévia e da gravação:
 *   1. nome do arquivo citado na planilha (o lojista mandou);
 *   2. SKU no começo do nome do arquivo;
 *   3. nome do produto no começo do nome do arquivo.
 *
 * Cada arquivo vai para um produto só — o primeiro que casar, na ordem da
 * planilha —, senão a mesma foto apareceria em vários produtos.
 */
export function casarImagens(alvos: AlvoImagem[], arquivos: ArquivoEnviado[]): Map<string, string[]> {
  const analisados = arquivos.map((a) => ({ ...a, ...analisarNome(a.nome) }));
  const usados = new Set<string>();
  const porSku = new Map<string, string[]>();

  for (const alvo of alvos) {
    const escolhidos: typeof analisados = [];

    for (const citado of alvo.nomesNaPlanilha) {
      const arquivo = analisados.find(
        (a) => !usados.has(a.url) && a.nome.toLowerCase() === citado.toLowerCase(),
      );
      if (arquivo) {
        escolhidos.push(arquivo);
        usados.add(arquivo.url);
      }
    }

    for (const identificador of [alvo.sku, alvo.nome]) {
      if (!identificador) continue;
      const casados = analisados
        .filter((a) => !usados.has(a.url) && combina(a.base, identificador))
        .sort((a, b) => a.indice - b.indice || a.nome.localeCompare(b.nome, "pt-BR"));
      if (casados.length > 0) {
        for (const a of casados) {
          escolhidos.push(a);
          usados.add(a.url);
        }
        break;
      }
    }

    if (escolhidos.length > 0) porSku.set(alvo.sku, escolhidos.map((a) => a.url));
  }

  return porSku;
}

// ---------------------------------------------------------------------------
// Download de imagem por endereço (coluna `imagem_principal` / `imagens`)
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 8000;
const MAX_BYTES = 6 * 1024 * 1024;
const MAX_REDIRECIONAMENTOS = 3;

/**
 * Endereço de rede interna? Baixar de `http://169.254.169.254` ou
 * `http://localhost:5432` transformaria a importação num túnel para dentro da
 * infraestrutura (SSRF) — o lojista digita a URL, mas quem faz a requisição é
 * o servidor, com os acessos dele.
 */
function ehIpPrivado(ip: string): boolean {
  const versao = net.isIP(ip);
  if (versao === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / metadados da nuvem
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
    if (a === 192 && b === 0) return true;
    if (a >= 224) return true; // multicast e reservados
    return false;
  }
  if (versao === 6) {
    const normalizado = ip.toLowerCase();
    if (normalizado === "::1" || normalizado === "::") return true;
    // IPv4 embutido em IPv6 (::ffff:127.0.0.1) usa as regras do IPv4.
    const embutido = normalizado.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (embutido) return ehIpPrivado(embutido[1]);
    if (/^f[cd]/.test(normalizado)) return true; // ULA
    if (/^fe[89ab]/.test(normalizado)) return true; // link-local
    if (normalizado.startsWith("ff")) return true; // multicast
    return false;
  }
  return true;
}

async function checarEnderecoPublico(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("use um endereço http:// ou https://");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (ehIpPrivado(host)) throw new Error("endereço de rede interna");
    return;
  }
  let enderecos: { address: string }[];
  try {
    enderecos = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("endereço não encontrado");
  }
  if (enderecos.length === 0 || enderecos.some((e) => ehIpPrivado(e.address))) {
    throw new Error("endereço de rede interna");
  }
}

/**
 * Baixa a imagem e grava no storage da loja com as mesmas regras do upload
 * do painel (confere os bytes iniciais, converte e limita o tamanho).
 * Devolve a URL local ou lança um erro com um motivo curto.
 */
export async function baixarImagem(endereco: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(endereco);
  } catch {
    throw new Error("endereço inválido");
  }

  for (let salto = 0; salto <= MAX_REDIRECIONAMENTOS; salto++) {
    await checarEnderecoPublico(url);

    const resposta = await fetch(url, {
      // Cada redirecionamento é conferido de novo: sem isso, um endereço
      // público poderia redirecionar para 127.0.0.1 e furar a checagem.
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "image/*" },
    }).catch(() => {
      throw new Error("não foi possível acessar o endereço");
    });

    if (resposta.status >= 300 && resposta.status < 400) {
      const destino = resposta.headers.get("location");
      if (!destino) throw new Error("redirecionamento sem destino");
      url = new URL(destino, url);
      continue;
    }
    if (!resposta.ok) throw new Error(`o site respondeu ${resposta.status}`);

    const tipo = resposta.headers.get("content-type") ?? "";
    if (tipo && !tipo.startsWith("image/")) throw new Error("o endereço não devolveu uma imagem");
    const tamanho = Number(resposta.headers.get("content-length") ?? "0");
    if (tamanho > MAX_BYTES) throw new Error("imagem maior que 6 MB");

    const buffer = Buffer.from(await resposta.arrayBuffer());
    if (buffer.length > MAX_BYTES) throw new Error("imagem maior que 6 MB");
    // saveValidatedImage confere o conteúdo real: um HTML servido como
    // "image/jpeg" morre aqui, antes de virar arquivo da loja.
    return await saveValidatedImage(buffer);
  }

  throw new Error("redirecionamentos demais");
}
