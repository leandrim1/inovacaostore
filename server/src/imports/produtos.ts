import { slugify } from "../utils/slug.js";

/**
 * Regras da importação em massa de produtos.
 *
 * Este arquivo é a ÚNICA autoridade sobre o que a planilha significa: quais
 * colunas existem, como "89,90" vira 89.9 e o que torna uma linha inválida.
 * A prévia e a gravação chamam as mesmas funções daqui — o que o lojista vê
 * na tela é exatamente o que vai ser gravado, e uma linha nunca é aceita na
 * gravação por ter passado só pela validação da tela.
 */

// ---------------------------------------------------------------------------
// Colunas
// ---------------------------------------------------------------------------

export type Campo =
  | "nome"
  | "descricao"
  | "categoria"
  | "subcategoria"
  | "marca"
  | "sku"
  | "preco"
  | "precoPromocional"
  | "custo"
  | "estoque"
  | "tamanho"
  | "cor"
  | "variacoes"
  | "peso"
  | "altura"
  | "largura"
  | "comprimento"
  | "volume"
  | "status"
  | "destaque"
  | "tags"
  | "caracteristicas"
  | "imagemPrincipal"
  | "imagens";

/** Tira acentos, pontuação e caixa: "Preço Promocional" e "preco_promocional" viram a mesma chave. */
export function chave(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Nome oficial da coluna (o que vai no modelo) seguido dos sinônimos aceitos.
 * Aceitar sinônimo importa: o lojista costuma exportar a planilha de outro
 * sistema, onde a coluna se chama "titulo", "valor" ou "qtd".
 */
export const COLUNAS: { campo: Campo; nomes: string[]; obrigatoria?: boolean }[] = [
  { campo: "nome", nomes: ["nome", "produto", "titulo", "nome_do_produto", "descricao_curta"], obrigatoria: true },
  { campo: "descricao", nomes: ["descricao", "detalhes", "descricao_longa", "descricao_completa"] },
  { campo: "categoria", nomes: ["categoria", "categorias", "departamento"], obrigatoria: true },
  { campo: "subcategoria", nomes: ["subcategoria", "sub_categoria"] },
  { campo: "marca", nomes: ["marca", "fabricante", "brand"] },
  { campo: "sku", nomes: ["sku", "codigo", "cod", "referencia", "ref", "codigo_interno"] },
  { campo: "preco", nomes: ["preco", "preco_venda", "valor", "preco_atual", "price"], obrigatoria: true },
  {
    campo: "precoPromocional",
    nomes: ["preco_promocional", "preco_de", "preco_antigo", "preco_original", "de", "preco_comparativo"],
  },
  { campo: "custo", nomes: ["custo", "preco_custo", "custo_produto", "preco_de_custo"] },
  { campo: "estoque", nomes: ["estoque", "quantidade", "qtd", "qtde", "stock"] },
  { campo: "tamanho", nomes: ["tamanho", "tamanhos", "size"] },
  { campo: "cor", nomes: ["cor", "cores", "color"] },
  { campo: "variacoes", nomes: ["variacoes", "variacao", "grade", "estoque_por_variacao"] },
  { campo: "peso", nomes: ["peso", "peso_kg", "peso_g"] },
  { campo: "altura", nomes: ["altura", "altura_cm"] },
  { campo: "largura", nomes: ["largura", "largura_cm"] },
  { campo: "comprimento", nomes: ["comprimento", "comprimento_cm", "profundidade"] },
  { campo: "volume", nomes: ["volume", "volume_m3", "cubagem"] },
  { campo: "status", nomes: ["status", "ativo", "situacao", "publicado", "visivel"] },
  { campo: "destaque", nomes: ["destaque", "destacado", "featured"] },
  { campo: "tags", nomes: ["tags", "etiquetas", "selos"] },
  { campo: "caracteristicas", nomes: ["caracteristicas", "features", "detalhes_tecnicos"] },
  { campo: "imagemPrincipal", nomes: ["imagem_principal", "imagem", "foto", "foto_principal", "imagem_1"] },
  { campo: "imagens", nomes: ["imagens", "fotos", "galeria", "imagens_adicionais"] },
];

/** Colunas do modelo baixado pelo lojista, na ordem em que aparecem. */
export const COLUNAS_MODELO: Campo[] = [
  "nome",
  "descricao",
  "categoria",
  "marca",
  "sku",
  "preco",
  "precoPromocional",
  "custo",
  "estoque",
  "tamanho",
  "cor",
  "peso",
  "altura",
  "largura",
  "comprimento",
  "status",
  "destaque",
  "tags",
  "caracteristicas",
  "imagemPrincipal",
  "imagens",
];

export function nomeOficial(campo: Campo) {
  return COLUNAS.find((c) => c.campo === campo)!.nomes[0];
}

export interface MapaColunas {
  /** campo canônico → índice da coluna na planilha. */
  indices: Partial<Record<Campo, number>>;
  /** Cabeçalhos que a loja não usa (informado ao lojista, não é erro). */
  ignoradas: string[];
  /** Colunas obrigatórias que faltaram. */
  faltando: Campo[];
}

export function mapearColunas(cabecalho: string[]): MapaColunas {
  const indices: Partial<Record<Campo, number>> = {};
  const ignoradas: string[] = [];

  cabecalho.forEach((titulo, i) => {
    const k = chave(titulo);
    if (!k) return;
    const coluna = COLUNAS.find((c) => c.nomes.includes(k));
    // Primeira ocorrência vence: planilha com duas colunas "preço" usa a da esquerda.
    if (coluna && indices[coluna.campo] === undefined) indices[coluna.campo] = i;
    else ignoradas.push(titulo);
  });

  const faltando = COLUNAS.filter((c) => c.obrigatoria && indices[c.campo] === undefined).map((c) => c.campo);
  return { indices, ignoradas, faltando };
}

// ---------------------------------------------------------------------------
// Conversões
// ---------------------------------------------------------------------------

/**
 * "R$ 1.234,56" → 1234.56; "89,90" → 89.9; "1,234.56" → 1234.56.
 *
 * O separador decimal é o ÚLTIMO ponto ou vírgula que aparecer — é o que
 * distingue o padrão brasileiro do americano sem precisar perguntar nada ao
 * lojista. `null` quando o texto não é um número.
 */
export function paraNumero(texto: string): number | null {
  const limpo = texto
    .replace(/\s| /g, "")
    .replace(/^R\$?/i, "")
    .replace(/[^\d.,+-]/g, "");
  if (!limpo || !/\d/.test(limpo)) return null;

  const ultimoPonto = limpo.lastIndexOf(".");
  const ultimaVirgula = limpo.lastIndexOf(",");
  let normalizado: string;

  if (ultimoPonto === -1 && ultimaVirgula === -1) {
    normalizado = limpo;
  } else if (ultimaVirgula > ultimoPonto) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (ultimoPonto > ultimaVirgula) {
    normalizado = limpo.replace(/,/g, "");
  } else {
    normalizado = limpo;
  }
  // "1.234" sem outro separador: milhar, não decimal.
  if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) normalizado = limpo.replace(/\./g, "");

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/**
 * Arredonda para as casas que o campo usa de verdade.
 *
 * Não é frescura: o Excel guarda 89,90 como 89.90000000000001, e sem isto o
 * produto entrava na loja com esse preço — some na exibição (que formata com
 * 2 casas) e reaparece no cálculo de lucro e no formulário de edição.
 */
function arredondar(valor: number, casas: number) {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

const VERDADEIROS = new Set(["sim", "s", "1", "true", "verdadeiro", "ativo", "ativado", "publicado", "x", "y"]);
const FALSOS = new Set(["nao", "n", "0", "false", "falso", "inativo", "desativado", "rascunho", "oculto"]);

/** Aceita "sim/não", "ativo/inativo", "1/0", "true/false". `null` = não reconhecido. */
export function paraBooleano(texto: string): boolean | null {
  const k = chave(texto);
  if (!k) return null;
  if (VERDADEIROS.has(k)) return true;
  if (FALSOS.has(k)) return false;
  return null;
}

/** Separa por vírgula, ponto-e-vírgula, barra ou quebra de linha, sem itens vazios. */
export function paraLista(texto: string): string[] {
  return texto
    .split(/[,;\n|/]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Lista de imagens. Separa por `|`, `;` e quebra de linha — nunca por `/`,
 * que faz parte de todo endereço `https://`, e só por vírgula no que não for
 * endereço (vírgula é válida dentro de uma URL).
 */
export function paraListaImagens(texto: string): string[] {
  return texto
    .split(/[|;\n]+/)
    .flatMap((parte) => (parte.includes("://") ? [parte] : parte.split(",")))
    .map((t) => t.trim())
    .filter(Boolean);
}

const TAGS_VALIDAS = ["novo", "mais-vendido", "importado", "ultimas-unidades"] as const;
export type Tag = (typeof TAGS_VALIDAS)[number];

const TAGS_SINONIMOS: Record<string, Tag> = {
  novo: "novo",
  novidade: "novo",
  lancamento: "novo",
  mais_vendido: "mais-vendido",
  mais_vendidos: "mais-vendido",
  bestseller: "mais-vendido",
  importado: "importado",
  importados: "importado",
  ultimas_unidades: "ultimas-unidades",
  ultima_unidade: "ultimas-unidades",
  ultimas_pecas: "ultimas-unidades",
};

/** Cores comuns de vestuário → cor da bolinha no site. Desconhecida usa o padrão do formulário. */
const CORES: Record<string, string> = {
  preto: "#141414",
  branco: "#f5f5f5",
  off_white: "#efeae1",
  cinza: "#8a8a8a",
  chumbo: "#4a4a4a",
  grafite: "#3a3a3a",
  bege: "#d8c3a5",
  caqui: "#a89f68",
  marrom: "#6b4a2f",
  vermelho: "#c0392b",
  vinho: "#6d1f2f",
  rosa: "#e58fa6",
  laranja: "#e07b39",
  amarelo: "#f5c400",
  verde: "#3f7a4a",
  verde_militar: "#4b5320",
  azul: "#2c4a7c",
  azul_marinho: "#1b2a4a",
  azul_claro: "#7aa7d8",
  jeans: "#4a6b8a",
  roxo: "#5b3a7a",
  lilas: "#b9a3d6",
  dourado: "#c9a227",
  prata: "#bfc3c7",
  nude: "#e3c4a8",
};

export const COR_PADRAO = "#141414";

export function corParaHex(cor: string) {
  return CORES[chave(cor)] ?? COR_PADRAO;
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

export interface VariacaoImportada {
  cor: string;
  corHex: string;
  tamanho: string;
  estoque: number;
}

export interface ProdutoImportado {
  nome: string;
  descricao: string;
  marca: string;
  sku: string;
  preco: number;
  precoPromocional: number | null;
  custo: number;
  pesoKg: number;
  volumeM3: number;
  ativo: boolean;
  destaque: boolean;
  tags: Tag[];
  caracteristicas: string[];
  /** Nome da categoria como veio na planilha (resolvido para id na gravação). */
  categoria: string;
  variacoes: VariacaoImportada[];
  /** URLs http(s) informadas na planilha. */
  imagensUrls: string[];
  /** Nomes de arquivo informados na planilha (casam com as imagens enviadas). */
  imagensNomes: string[];
  estoqueTotal: number;
}

export interface LinhaImportacao {
  /** Número da linha na planilha (2 = primeira linha de dados, como no Excel). */
  linha: number;
  /** Valores crus por campo — é o que a tela deixa editar e reenvia. */
  valores: Partial<Record<Campo, string>>;
  produto: ProdutoImportado | null;
  erros: string[];
  avisos: string[];
  /** Produto já existente com o mesmo SKU. */
  duplicado: { id: string; name: string } | null;
  /** Categoria da planilha que ainda não existe na loja. */
  categoriaFaltando: string | null;
}

export interface ContextoValidacao {
  /** chave(nome ou slug da categoria) → categoria da loja. */
  categorias: Map<string, { id: string; name: string }>;
  /** SKU em caixa alta → produto já cadastrado. */
  produtosPorSku: Map<string, { id: string; name: string }>;
}

/** Teto de variações por produto: 8 tamanhos × 8 cores já é bastante. */
const MAX_VARIACOES = 64;
const MAX_IMAGENS = 8;

/** Uma linha crua (por campo) validada e normalizada. */
export function validarLinha(
  linha: number,
  valores: Partial<Record<Campo, string>>,
  ctx: ContextoValidacao,
  skusJaVistos: Map<string, number>,
): LinhaImportacao {
  const erros: string[] = [];
  const avisos: string[] = [];
  const v = (campo: Campo) => (valores[campo] ?? "").trim();

  // ---- nome
  const nome = v("nome");
  if (!nome) erros.push("Informe o nome do produto.");
  else if (nome.length > 140) erros.push("O nome deve ter no máximo 140 caracteres.");

  // ---- preço
  const precoTexto = v("preco");
  const preco = paraNumero(precoTexto);
  if (!precoTexto) erros.push("Informe o preço.");
  else if (preco === null) erros.push(`Preço inválido ("${precoTexto}").`);
  else if (preco <= 0) erros.push("O preço deve ser maior que zero.");
  else if (preco > 1_000_000) erros.push("Preço acima do limite aceito.");

  // ---- preço promocional (no site é o "De:" riscado, maior que o preço)
  let precoPromocional: number | null = null;
  let precoFinal = preco ?? 0;
  const promoTexto = v("precoPromocional");
  if (promoTexto) {
    const promo = paraNumero(promoTexto);
    if (promo === null) {
      erros.push(`Preço promocional inválido ("${promoTexto}").`);
    } else if (promo <= 0) {
      erros.push("O preço promocional deve ser maior que zero.");
    } else if (preco !== null && promo < preco) {
      // O lojista quis dizer "está em promoção por este valor": o menor é o
      // que se cobra e o maior vira o "De:" riscado. Trocar calado seria pior,
      // então o aviso aparece na prévia e ele pode corrigir antes de gravar.
      precoFinal = promo;
      precoPromocional = preco;
      avisos.push(
        `Preço promocional menor que o preço: vamos cobrar ${promo.toFixed(2)} e riscar ${preco.toFixed(2)}.`,
      );
    } else if (preco !== null && promo === preco) {
      avisos.push("Preço promocional igual ao preço: o produto ficará sem preço riscado.");
    } else {
      precoPromocional = promo;
    }
  }

  // ---- custo
  let custo = 0;
  const custoTexto = v("custo");
  if (custoTexto) {
    const n = paraNumero(custoTexto);
    if (n === null || n < 0) erros.push(`Custo inválido ("${custoTexto}").`);
    else custo = n;
  }

  // ---- categoria
  const categoria = v("categoria");
  let categoriaFaltando: string | null = null;
  if (!categoria) {
    erros.push("Informe a categoria.");
  } else if (!ctx.categorias.has(chave(categoria))) {
    categoriaFaltando = categoria;
  }
  if (v("subcategoria")) {
    avisos.push("A loja não trabalha com subcategoria: a coluna foi ignorada.");
  }

  // ---- SKU (chave de duplicidade; em branco, geramos a partir do nome)
  let sku = v("sku").toUpperCase();
  if (!sku && nome) {
    sku = slugify(nome).toUpperCase().replace(/-/g, "-").slice(0, 24) || "PRODUTO";
    avisos.push(`SKU em branco: usamos "${sku}", gerado a partir do nome.`);
  }
  if (sku.length > 40) erros.push("O SKU deve ter no máximo 40 caracteres.");
  const linhaAnterior = sku ? skusJaVistos.get(sku) : undefined;
  if (linhaAnterior !== undefined) {
    erros.push(`SKU "${sku}" repetido na planilha (já usado na linha ${linhaAnterior}).`);
  } else if (sku) {
    skusJaVistos.set(sku, linha);
  }
  const duplicado = sku ? (ctx.produtosPorSku.get(sku) ?? null) : null;

  // ---- variações (cor × tamanho × estoque)
  const estoqueTexto = v("estoque");
  let estoquePadrao = 0;
  if (estoqueTexto) {
    const n = paraNumero(estoqueTexto);
    if (n === null) erros.push(`Estoque inválido ("${estoqueTexto}").`);
    else if (n < 0) erros.push("O estoque não pode ser negativo.");
    else estoquePadrao = Math.floor(n);
  }

  const variacoes: VariacaoImportada[] = [];
  const variacoesTexto = v("variacoes");
  if (variacoesTexto) {
    // Formato avançado: "Preto|P|10; Preto|M|5" (ou "P|10" usando a cor da linha).
    for (const parte of variacoesTexto.split(";").map((p) => p.trim()).filter(Boolean)) {
      const campos = parte.split("|").map((c) => c.trim());
      const [cor, tamanho, qtd] =
        campos.length >= 3 ? campos : [v("cor") || "Única", campos[0] ?? "", campos[1] ?? ""];
      const estoque = paraNumero(qtd ?? "");
      if (!tamanho || estoque === null || estoque < 0) {
        erros.push(`Variação inválida ("${parte}"). Use o formato Cor|Tamanho|Estoque.`);
        continue;
      }
      variacoes.push({
        cor: cor || "Única",
        corHex: corParaHex(cor),
        tamanho,
        estoque: Math.floor(estoque),
      });
    }
  } else {
    const tamanhos = paraLista(v("tamanho"));
    const cores = paraLista(v("cor"));
    const listaTamanhos = tamanhos.length > 0 ? tamanhos : ["Único"];
    const listaCores = cores.length > 0 ? cores : ["Única"];
    if (listaTamanhos.length * listaCores.length > MAX_VARIACOES) {
      erros.push(
        `${listaCores.length} cores × ${listaTamanhos.length} tamanhos passam do limite de ${MAX_VARIACOES} variações por produto.`,
      );
    } else {
      for (const cor of listaCores) {
        for (const tamanho of listaTamanhos) {
          variacoes.push({ cor, corHex: corParaHex(cor), tamanho, estoque: estoquePadrao });
        }
      }
    }
  }

  // Cor+tamanho repetidos quebrariam a chave única do banco na gravação.
  const combinacoes = new Set<string>();
  for (const variacao of variacoes) {
    const k = `${chave(variacao.cor)}|${chave(variacao.tamanho)}`;
    if (combinacoes.has(k)) {
      erros.push(`Variação repetida: ${variacao.cor} / ${variacao.tamanho}.`);
      break;
    }
    combinacoes.add(k);
  }
  if (variacoes.length === 0 && erros.length === 0) {
    erros.push("Informe ao menos uma variação (tamanho, cor ou estoque).");
  }

  // ---- peso e volume
  let pesoKg = 0;
  const pesoTexto = v("peso");
  if (pesoTexto) {
    const n = paraNumero(pesoTexto);
    if (n === null || n < 0) erros.push(`Peso inválido ("${pesoTexto}").`);
    else pesoKg = n;
  }

  let volumeM3 = 0;
  const volumeTexto = v("volume");
  if (volumeTexto) {
    const n = paraNumero(volumeTexto);
    if (n === null || n < 0) erros.push(`Volume inválido ("${volumeTexto}").`);
    else volumeM3 = n;
  } else {
    // Sem volume, calcula pelas medidas em cm (1 m³ = 1.000.000 cm³).
    const a = paraNumero(v("altura"));
    const l = paraNumero(v("largura"));
    const c = paraNumero(v("comprimento"));
    if (a !== null && l !== null && c !== null && a > 0 && l > 0 && c > 0) {
      volumeM3 = Number(((a * l * c) / 1_000_000).toFixed(6));
    }
  }

  // ---- status, destaque
  let ativo = true;
  const statusTexto = v("status");
  if (statusTexto) {
    const b = paraBooleano(statusTexto);
    if (b === null) avisos.push(`Status "${statusTexto}" não reconhecido: o produto entra como ativo.`);
    else ativo = b;
  }

  let destaque = false;
  const destaqueTexto = v("destaque");
  if (destaqueTexto) {
    const b = paraBooleano(destaqueTexto);
    if (b === null) avisos.push(`Destaque "${destaqueTexto}" não reconhecido: o produto entra sem destaque.`);
    else destaque = b;
  }

  // ---- tags
  const tags: Tag[] = [];
  for (const bruta of paraLista(v("tags"))) {
    const tag = TAGS_SINONIMOS[chave(bruta)];
    if (!tag) avisos.push(`Etiqueta "${bruta}" não existe na loja e foi ignorada.`);
    else if (!tags.includes(tag)) tags.push(tag);
  }

  // ---- imagens (URLs vão ser baixadas; nomes casam com os arquivos enviados)
  const imagensUrls: string[] = [];
  const imagensNomes: string[] = [];
  for (const item of [...paraListaImagens(v("imagemPrincipal")), ...paraListaImagens(v("imagens"))]) {
    if (/^https?:\/\//i.test(item)) {
      try {
        // eslint-disable-next-line no-new
        new URL(item);
        imagensUrls.push(item);
      } catch {
        erros.push(`Endereço de imagem inválido ("${item}").`);
      }
    } else if (/^[\w\-. ()]+\.(jpe?g|png|webp|avif)$/i.test(item)) {
      imagensNomes.push(item);
    } else if (item) {
      erros.push(`Imagem "${item}" não é um endereço (http://…) nem um nome de arquivo.`);
    }
  }
  if (imagensUrls.length + imagensNomes.length > MAX_IMAGENS) {
    erros.push(`Máximo de ${MAX_IMAGENS} imagens por produto.`);
  }

  const caracteristicas = v("caracteristicas")
    .split(/[\n|;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const produto: ProdutoImportado | null =
    erros.length > 0
      ? null
      : {
          nome,
          descricao: v("descricao"),
          marca: v("marca"),
          sku,
          preco: arredondar(precoFinal, 2),
          precoPromocional: precoPromocional === null ? null : arredondar(precoPromocional, 2),
          custo: arredondar(custo, 2),
          pesoKg: arredondar(pesoKg, 3),
          volumeM3: arredondar(volumeM3, 6),
          ativo,
          destaque,
          tags,
          caracteristicas,
          categoria,
          variacoes,
          imagensUrls,
          imagensNomes,
          estoqueTotal: variacoes.reduce((s, x) => s + x.estoque, 0),
        };

  return { linha, valores, produto, erros, avisos, duplicado, categoriaFaltando };
}

/** Transforma a planilha crua em linhas validadas, na ordem do arquivo. */
export function validarPlanilha(
  cabecalho: string[],
  linhas: string[][],
  ctx: ContextoValidacao,
): { mapa: MapaColunas; itens: LinhaImportacao[] } {
  const mapa = mapearColunas(cabecalho);
  const skusJaVistos = new Map<string, number>();

  const itens = linhas.map((colunas, i) => {
    const valores: Partial<Record<Campo, string>> = {};
    for (const [campo, indice] of Object.entries(mapa.indices) as [Campo, number][]) {
      valores[campo] = colunas[indice] ?? "";
    }
    // +2: a linha 1 é o cabeçalho e o Excel conta a partir de 1.
    return validarLinha(i + 2, valores, ctx, skusJaVistos);
  });

  return { mapa, itens };
}

/** Revalida linhas já editadas na tela (o número da linha vem de quem enviou). */
export function revalidarLinhas(
  itens: { linha: number; valores: Partial<Record<Campo, string>> }[],
  ctx: ContextoValidacao,
): LinhaImportacao[] {
  const skusJaVistos = new Map<string, number>();
  return itens.map((item) => validarLinha(item.linha, item.valores, ctx, skusJaVistos));
}
