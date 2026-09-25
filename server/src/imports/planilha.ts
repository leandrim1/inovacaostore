import { unzipSync, strFromU8 } from "fflate";
import { HttpError } from "../errors.js";

/**
 * Leitura de planilhas enviadas pelo lojista (CSV e XLSX).
 *
 * Tudo que sai daqui é texto cru, exatamente como estava na célula: quem
 * interpreta preço, estoque e afins é `produtos.ts`. Assim o mesmo validador
 * atende arquivo enviado e linha corrigida na tela.
 */

export interface Planilha {
  /** Cabeçalho (primeira linha não vazia), já sem espaços nas pontas. */
  colunas: string[];
  /** Demais linhas. Cada uma tem o mesmo tamanho de `colunas`. */
  linhas: string[][];
}

/** Limites do arquivo — um upload não pode derrubar a função. */
export const PLANILHA_MAX_BYTES = 8 * 1024 * 1024;
/** Teto de linhas por importação: acima disso, peça para dividir a planilha. */
export const MAX_LINHAS = 2000;
/** Teto de colunas: planilha com milhares de colunas vazias é erro de export. */
const MAX_COLUNAS = 60;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/**
 * Descobre o separador olhando o cabeçalho. Excel em português exporta CSV
 * com `;`, Google Sheets e a maioria das ferramentas usam `,` — adivinhar
 * errado transformaria a planilha inteira numa coluna só.
 */
function detectarSeparador(primeiraLinha: string): string {
  const candidatos = [";", ",", "\t", "|"];
  let melhor = ",";
  let maior = 0;
  for (const sep of candidatos) {
    // Conta só fora das aspas: "Camiseta preta, oversized" não é separador.
    let dentroDeAspas = false;
    let total = 0;
    for (let i = 0; i < primeiraLinha.length; i++) {
      const c = primeiraLinha[i];
      if (c === '"') dentroDeAspas = !dentroDeAspas;
      else if (c === sep && !dentroDeAspas) total++;
    }
    if (total > maior) {
      maior = total;
      melhor = sep;
    }
  }
  return melhor;
}

/** CSV completo: aspas, aspas duplicadas (`""`), quebra de linha dentro do campo, CRLF. */
function lerCsv(texto: string): string[][] {
  const limpo = texto.replace(/^﻿/, "");
  const primeiraQuebra = limpo.search(/\r?\n/);
  const sep = detectarSeparador(primeiraQuebra === -1 ? limpo : limpo.slice(0, primeiraQuebra));

  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];

    if (dentroDeAspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeAspas = true;
    } else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpo[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

/** Teto do conteúdo descompactado: barra "zip bomb" (arquivo pequeno que explode na memória). */
const XLSX_MAX_DESCOMPACTADO = 60 * 1024 * 1024;

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodificarXml(texto: string) {
  return texto.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (inteiro, nome: string) => {
    if (nome.startsWith("#x") || nome.startsWith("#X")) {
      return String.fromCodePoint(parseInt(nome.slice(2), 16));
    }
    if (nome.startsWith("#")) return String.fromCodePoint(parseInt(nome.slice(1), 10));
    return ENTIDADES[nome] ?? inteiro;
  });
}

/** Todo o texto de `<t>…</t>` dentro do trecho (texto rico vem quebrado em vários). */
function textoDeT(trecho: string) {
  let saida = "";
  for (const m of trecho.matchAll(/<t(?:\s[^>]*)?\/>|<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
    saida += decodificarXml(m[1] ?? "");
  }
  return saida;
}

/**
 * Quebra o XML nas tags `<nome ...>…</nome>` e `<nome ... />`.
 *
 * Escrito à mão porque a versão com uma expressão regular só tinha um
 * defeito silencioso: numa célula vazia (`<c r="D2" />`), o `>` do
 * fechamento era confundido com o fim da tag de abertura e a célula seguinte
 * era engolida — a linha inteira andava uma coluna para a esquerda e o preço
 * de um produto ia parar na coluna do SKU.
 */
function fatiarTags(xml: string, nome: string): { atributos: string; conteudo: string }[] {
  const abertura = new RegExp(`<${nome}(\\s[^>]*?)?(/?)>`, "g");
  const fechamento = `</${nome}>`;
  const encontradas: { atributos: string; conteudo: string }[] = [];

  let m: RegExpExecArray | null;
  while ((m = abertura.exec(xml)) !== null) {
    const atributos = m[1] ?? "";
    if (m[2] === "/") {
      encontradas.push({ atributos, conteudo: "" });
      continue;
    }
    const fim = xml.indexOf(fechamento, abertura.lastIndex);
    if (fim === -1) {
      encontradas.push({ atributos, conteudo: xml.slice(abertura.lastIndex) });
      break;
    }
    encontradas.push({ atributos, conteudo: xml.slice(abertura.lastIndex, fim) });
    abertura.lastIndex = fim + fechamento.length;
  }
  return encontradas;
}

/** "BC12" → 54 (índice da coluna, base 0). */
function colunaDaReferencia(ref: string) {
  let n = 0;
  for (const c of ref) {
    const código = c.charCodeAt(0);
    if (código < 65 || código > 90) break;
    n = n * 26 + (código - 64);
  }
  return n - 1;
}

function lerXlsx(buffer: Buffer): string[][] {
  let arquivos: Record<string, Uint8Array>;
  try {
    arquivos = unzipSync(new Uint8Array(buffer), {
      // Só o que a leitura usa — e nada gigante. `filter` roda antes de
      // descompactar, então um arquivo-bomba é recusado sem gastar memória.
      filter: (arquivo) => {
        if (arquivo.originalSize > XLSX_MAX_DESCOMPACTADO) {
          throw new HttpError(400, "A planilha é grande demais para ser lida. Divida em arquivos menores.");
        }
        return (
          arquivo.name === "xl/workbook.xml" ||
          arquivo.name === "xl/_rels/workbook.xml.rels" ||
          arquivo.name === "xl/sharedStrings.xml" ||
          /^xl\/worksheets\/sheet\d+\.xml$/.test(arquivo.name)
        );
      },
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "Não foi possível abrir a planilha. Salve novamente como .xlsx ou .csv.");
  }

  // Qual aba é a primeira do arquivo (a ordem das abas está no workbook,
  // não no nome do arquivo: a primeira aba pode ser sheet3.xml).
  let caminhoAba: string | undefined;
  const workbook = arquivos["xl/workbook.xml"];
  const rels = arquivos["xl/_rels/workbook.xml.rels"];
  if (workbook && rels) {
    const rId = strFromU8(workbook).match(/<sheet[^>]*r:id="([^"]+)"/)?.[1];
    if (rId) {
      const alvo = strFromU8(rels).match(new RegExp(`Id="${rId}"[^>]*Target="([^"]+)"`))?.[1];
      const normalizado = alvo?.replace(/^\/?(xl\/)?/, "xl/");
      if (normalizado && arquivos[normalizado]) caminhoAba = normalizado;
    }
  }
  if (!caminhoAba) {
    caminhoAba = Object.keys(arquivos)
      .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))[0];
  }
  if (!caminhoAba) {
    throw new HttpError(400, "A planilha não tem nenhuma aba com dados.");
  }

  const compartilhadas: string[] = [];
  if (arquivos["xl/sharedStrings.xml"]) {
    for (const si of fatiarTags(strFromU8(arquivos["xl/sharedStrings.xml"]), "si")) {
      compartilhadas.push(textoDeT(si.conteudo));
    }
  }

  const aba = strFromU8(arquivos[caminhoAba]);
  const linhas: string[][] = [];
  for (const linhaXml of fatiarTags(aba, "row")) {
    const celulas: string[] = [];
    for (const { atributos, conteudo } of fatiarTags(linhaXml.conteudo, "c")) {
      const tipo = atributos.match(/\st="([^"]+)"/)?.[1];
      const ref = atributos.match(/\sr="([A-Z]+)\d+"/)?.[1];

      let valor = "";
      if (tipo === "s") {
        const indice = Number(conteudo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "-1");
        valor = compartilhadas[indice] ?? "";
      } else if (tipo === "inlineStr") {
        valor = textoDeT(conteudo);
      } else if (tipo === "b") {
        valor = conteudo.includes("<v>1</v>") ? "verdadeiro" : "falso";
      } else {
        // Numérico, data (número de série) ou resultado de fórmula (t="str").
        valor = decodificarXml(conteudo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
      }

      // Célula vazia no meio da linha não aparece no XML: usa a referência
      // (A, B, C…) para cada valor cair na coluna certa.
      const coluna = ref ? colunaDaReferencia(ref) : celulas.length;
      while (celulas.length < coluna) celulas.push("");
      celulas[coluna] = valor;
    }
    linhas.push(celulas);
  }
  return linhas;
}

// ---------------------------------------------------------------------------

/** `.xls` antigo (OLE2) e `.xlsx` (zip) têm assinaturas diferentes no começo do arquivo. */
function ehOle2(buffer: Buffer) {
  return buffer.length >= 4 && buffer.readUInt32BE(0) === 0xd0cf11e0;
}

function ehZip(buffer: Buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

/**
 * Lê a planilha enviada e devolve cabeçalho + linhas.
 *
 * O formato vem do CONTEÚDO do arquivo, não da extensão nem do que o
 * navegador declarou: um .csv renomeado para .xlsx continua sendo lido, e um
 * arquivo que não é planilha nenhuma é recusado com uma explicação.
 */
export function lerPlanilha(buffer: Buffer, nomeArquivo = ""): Planilha {
  if (buffer.length === 0) {
    throw new HttpError(400, "O arquivo enviado está vazio.");
  }
  if (buffer.length > PLANILHA_MAX_BYTES) {
    throw new HttpError(400, `A planilha deve ter no máximo ${PLANILHA_MAX_BYTES / (1024 * 1024)} MB.`);
  }
  if (ehOle2(buffer)) {
    throw new HttpError(
      400,
      "Arquivos .xls (formato antigo do Excel) não são suportados. Abra a planilha e salve como .xlsx ou .csv.",
    );
  }

  let cruas: string[][];
  if (ehZip(buffer)) {
    cruas = lerXlsx(buffer);
  } else {
    const texto = buffer.toString("utf8");
    // Texto binário disfarçado de CSV: o caractere nulo não existe em planilha.
    if (texto.includes("\u0000")) {
      throw new HttpError(400, `Não reconhecemos "${nomeArquivo || "o arquivo"}" como planilha. Envie um CSV ou XLSX.`);
    }
    cruas = lerCsv(texto);
  }

  const semVazias = cruas
    .map((l) => l.map((c) => (c ?? "").trim()))
    .filter((l) => l.some((c) => c !== ""));

  if (semVazias.length === 0) {
    throw new HttpError(400, "A planilha está vazia — nenhuma linha preenchida foi encontrada.");
  }

  const colunas = semVazias[0].slice(0, MAX_COLUNAS);
  const linhas = semVazias.slice(1).map((l) => {
    const ajustada = l.slice(0, colunas.length);
    while (ajustada.length < colunas.length) ajustada.push("");
    return ajustada;
  });

  if (linhas.length > MAX_LINHAS) {
    throw new HttpError(
      400,
      `A planilha tem ${linhas.length} produtos e o limite por importação é ${MAX_LINHAS}. Divida em arquivos menores.`,
    );
  }

  return { colunas, linhas };
}
