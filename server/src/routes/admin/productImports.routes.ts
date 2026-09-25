import { Router, type RequestHandler } from "express";
import multer, { MulterError } from "multer";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { HttpError } from "../../errors.js";
import { uniqueSlug } from "../../utils/slug.js";
import { saveValidatedImage } from "../../upload.js";
import { deleteUpload } from "../../storage.js";
import { lerPlanilha, PLANILHA_MAX_BYTES } from "../../imports/planilha.js";
import {
  COLUNAS_MODELO,
  chave,
  nomeOficial,
  revalidarLinhas,
  validarPlanilha,
  type Campo,
  type ContextoValidacao,
  type LinhaImportacao,
} from "../../imports/produtos.js";
import { baixarImagem, casarImagens, type AlvoImagem, type ArquivoEnviado } from "../../imports/imagens.js";

export const adminProductImportsRouter = Router();

/** Linhas por requisição de gravação: mantém cada lote rápido e o progresso fluido. */
const MAX_LINHAS_POR_LOTE = 50;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Campo CSV com aspas quando precisa (separador, aspas ou quebra de linha dentro). */
function campoCsv(valor: string) {
  return /[;"\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

/** CSV para o Excel em português: separador `;` e BOM, como o resto do painel. */
function montarCsv(linhas: string[][]) {
  return "﻿" + linhas.map((l) => l.map(campoCsv).join(";")).join("\r\n") + "\r\n";
}

/** Contexto de validação: categorias e SKUs que já existem na loja. */
async function carregarContexto(): Promise<ContextoValidacao> {
  const [categorias, produtos] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.product.findMany({ select: { id: true, name: true, sku: true } }),
  ]);

  const mapaCategorias = new Map<string, { id: string; name: string }>();
  for (const c of categorias) {
    // Nome e slug apontam para a mesma categoria: a planilha pode trazer
    // "Camisetas" ou "camisetas".
    mapaCategorias.set(chave(c.name), { id: c.id, name: c.name });
    mapaCategorias.set(chave(c.slug), { id: c.id, name: c.name });
  }

  return {
    categorias: mapaCategorias,
    produtosPorSku: new Map(produtos.map((p) => [p.sku.toUpperCase(), { id: p.id, name: p.name }])),
  };
}

/** Só o que a prévia precisa mostrar — a linha crua volta para permitir edição. */
function paraResposta(item: LinhaImportacao) {
  return {
    linha: item.linha,
    valores: item.valores,
    erros: item.erros,
    avisos: item.avisos,
    duplicado: item.duplicado,
    categoriaFaltando: item.categoriaFaltando,
    resumo: item.produto
      ? {
          nome: item.produto.nome,
          sku: item.produto.sku,
          categoria: item.produto.categoria,
          preco: item.produto.preco,
          precoPromocional: item.produto.precoPromocional,
          estoque: item.produto.estoqueTotal,
          variacoes: item.produto.variacoes.length,
          imagens: item.produto.imagensUrls.length + item.produto.imagensNomes.length,
          ativo: item.produto.ativo,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Modelo de planilha
// ---------------------------------------------------------------------------

adminProductImportsRouter.get("/template.csv", (_req, res) => {
  const csv = montarCsv([
    COLUNAS_MODELO.map(nomeOficial),
    [
      "Camiseta Oversized Preta",
      "Camiseta de algodão com modelagem ampla e caimento reto.",
      "Camisetas",
      "Inovação",
      "CAM-001",
      "89,90",
      "129,90",
      "40,00",
      "20",
      "P,M,G,GG",
      "Preto,Branco",
      "0,3",
      "5",
      "30",
      "40",
      "ativo",
      "sim",
      "novo",
      "100% algodão|Gola reforçada",
      "",
      "",
    ],
    [
      "Calça Cargo Bege",
      "Calça cargo com bolsos laterais e cordão no cós.",
      "Calças",
      "",
      "CAL-001",
      "149,90",
      "",
      "70,00",
      "15",
      "38,40,42",
      "Bege",
      "0,6",
      "",
      "",
      "",
      "ativo",
      "nao",
      "importado",
      "",
      "",
      "",
    ],
  ]);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="modelo-produtos-inovacao-store.csv"');
  res.send(csv);
});

// ---------------------------------------------------------------------------
// 1) Enviar a planilha → prévia validada (nada é gravado aqui)
// ---------------------------------------------------------------------------

const planilhaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PLANILHA_MAX_BYTES, files: 1, fields: 5, parts: 8 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(csv|txt|xlsx|xls)$/i.test(file.originalname)) {
      cb(new HttpError(400, "Envie um arquivo .csv, .xlsx ou .xls."));
      return;
    }
    cb(null, true);
  },
});

/** Traduz os limites do multer para a linguagem desta tela. */
function receber(middleware: RequestHandler, mensagens: Record<string, string>): RequestHandler {
  return (req, res, next) => {
    middleware(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        res.status(400).json({ error: mensagens[err.code] ?? "Não foi possível enviar o arquivo." });
        return;
      }
      next(err);
    });
  };
}

adminProductImportsRouter.post(
  "/parse",
  receber(planilhaUpload.single("planilha"), {
    LIMIT_FILE_SIZE: `A planilha deve ter no máximo ${PLANILHA_MAX_BYTES / (1024 * 1024)} MB.`,
    LIMIT_FILE_COUNT: "Envie uma planilha por vez.",
  }),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Escolha a planilha com os produtos." });
      return;
    }

    const { colunas, linhas } = lerPlanilha(req.file.buffer, req.file.originalname);
    const ctx = await carregarContexto();
    const { mapa, itens } = validarPlanilha(colunas, linhas, ctx);

    if (mapa.faltando.length > 0) {
      res.status(400).json({
        error: `A planilha não tem a coluna ${mapa.faltando.map(nomeOficial).join(", ")}. Baixe o modelo e confira o cabeçalho.`,
      });
      return;
    }

    const categoriasFaltando = [...new Set(itens.map((i) => i.categoriaFaltando).filter(Boolean))] as string[];

    res.json({
      fileName: req.file.originalname,
      colunasReconhecidas: (Object.keys(mapa.indices) as Campo[]).map(nomeOficial),
      colunasIgnoradas: mapa.ignoradas,
      categoriasFaltando,
      categoriasExistentes: [...new Map([...ctx.categorias.values()].map((c) => [c.id, c])).values()],
      itens: itens.map(paraResposta),
    });
  },
);

/**
 * Revalida linhas corrigidas na tela.
 *
 * A prévia precisa reagir à edição do lojista, e quem diz o que é válido é
 * sempre o servidor — a tela nunca decide sozinha que uma linha ficou boa.
 */
const revalidarSchema = z.object({
  itens: z
    .array(
      z.object({
        linha: z.number().int().min(0).max(100_000),
        valores: z.record(z.string().max(40), z.string().max(4000)),
      }),
    )
    .max(2000),
});

adminProductImportsRouter.post("/revalidate", async (req, res) => {
  const parsed = revalidarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const ctx = await carregarContexto();
  const itens = revalidarLinhas(parsed.data.itens, ctx);
  res.json({
    itens: itens.map(paraResposta),
    categoriasFaltando: [...new Set(itens.map((i) => i.categoriaFaltando).filter(Boolean))],
  });
});

// ---------------------------------------------------------------------------
// 2) Enviar as imagens (em lotes) → já casadas com os produtos da prévia
// ---------------------------------------------------------------------------

const imagensUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 12, fields: 5, parts: 20 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)) {
      cb(new HttpError(400, `"${file.originalname}": use imagens JPG, PNG, WEBP ou AVIF.`));
      return;
    }
    cb(null, true);
  },
});

adminProductImportsRouter.post(
  "/images",
  receber(imagensUpload.array("imagens", 12), {
    LIMIT_FILE_SIZE: "Cada imagem deve ter no máximo 6MB.",
    LIMIT_FILE_COUNT: "Envie no máximo 12 imagens por vez.",
  }),
  async (req, res) => {
    const arquivos = (req.files as Express.Multer.File[]) ?? [];
    if (arquivos.length === 0) {
      res.status(400).json({ error: "Nenhuma imagem enviada." });
      return;
    }

    // O nome original é o que liga a foto ao produto, então volta na resposta
    // — mas quem grava o arquivo é o servidor, com nome gerado por ele.
    const enviadas: ArquivoEnviado[] = [];
    for (const arquivo of arquivos) {
      enviadas.push({ nome: arquivo.originalname, url: await saveValidatedImage(arquivo.buffer) });
    }

    res.status(201).json({ itens: enviadas });
  },
);

/**
 * Prévia de quais imagens (já enviadas) ficam com quais produtos.
 *
 * Quem decide é sempre o servidor, com a mesma função usada na gravação: a
 * tela só exibe o resultado.
 */
const casarSchema = z.object({
  alvos: z
    .array(
      z.object({
        sku: z.string().max(40),
        nome: z.string().max(200),
        nomesNaPlanilha: z.array(z.string().max(200)).max(8).default([]),
      }),
    )
    .max(2000),
  arquivos: z
    .array(z.object({ nome: z.string().max(200), url: z.string().max(600) }))
    .max(600)
    .default([]),
});

adminProductImportsRouter.post("/images/match", async (req, res) => {
  const parsed = casarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }
  const mapa = casarImagens(parsed.data.alvos, parsed.data.arquivos.filter((a) => urlDaLoja(a.url)));
  res.json({ porSku: Object.fromEntries(mapa) });
});

/**
 * A URL veio do nosso storage?
 *
 * As imagens chegam na gravação pela tela, e a tela pode ser manipulada. Sem
 * esta checagem, daria para apontar a foto de um produto para um endereço
 * qualquer da internet só alterando a requisição.
 */
function urlDaLoja(url: string) {
  if (/^\/uploads\/[\w.-]+$/.test(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3) Gravar (em lotes, com o resultado de cada um)
// ---------------------------------------------------------------------------

const commitSchema = z.object({
  importId: z.string().max(40).optional(),
  fileName: z.string().max(200).default(""),
  itens: z
    .array(
      z.object({
        linha: z.number().int().min(0).max(100_000),
        valores: z.record(z.string().max(40), z.string().max(4000)),
      }),
    )
    .min(1)
    .max(MAX_LINHAS_POR_LOTE),
  imagens: z
    .array(z.object({ nome: z.string().max(200), url: z.string().max(600) }))
    .max(600)
    .default([]),
  opcoes: z.object({
    duplicados: z.enum(["ignorar", "atualizar", "impedir"]).default("ignorar"),
    criarCategorias: z.boolean().default(true),
    /** chave(nome da categoria na planilha) → id de categoria escolhido na tela. */
    categoriasEscolhidas: z.record(z.string().max(120), z.string().max(40)).default({}),
  }),
  finalizar: z.boolean().default(false),
});

interface ErroImportacao {
  linha: number;
  produto: string;
  sku: string;
  erro: string;
}

adminProductImportsRouter.post("/commit", async (req, res) => {
  const parsed = commitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten() });
    return;
  }
  const { itens, imagens, opcoes, finalizar } = parsed.data;

  const registro = parsed.data.importId
    ? await prisma.productImport.findUnique({ where: { id: parsed.data.importId } })
    : await prisma.productImport.create({ data: { fileName: parsed.data.fileName } });
  if (!registro) {
    res.status(404).json({ error: "Importação não encontrada. Comece de novo." });
    return;
  }
  if (registro.status !== "processando") {
    res.status(409).json({ error: "Esta importação já foi finalizada." });
    return;
  }

  const ctx = await carregarContexto();
  const validadas = revalidarLinhas(itens, ctx);
  const arquivos = imagens.filter((a) => urlDaLoja(a.url));

  // Uma passada só para casar as imagens do lote inteiro, com a mesma regra
  // da prévia.
  const alvos: AlvoImagem[] = validadas
    .filter((i) => i.produto)
    .map((i) => ({ sku: i.produto!.sku, nome: i.produto!.nome, nomesNaPlanilha: i.produto!.imagensNomes }));
  const imagensPorSku = casarImagens(alvos, arquivos);

  const erros: ErroImportacao[] = [];
  const criados: { id: string; nome: string }[] = [];
  let atualizados = 0;
  let ignorados = 0;

  for (const item of validadas) {
    const produto = item.produto;
    const rotulo = (item.valores.nome ?? "").trim() || "(sem nome)";
    const sku = produto?.sku ?? (item.valores.sku ?? "").trim();

    if (!produto) {
      erros.push({ linha: item.linha, produto: rotulo, sku, erro: item.erros.join(" ") });
      continue;
    }

    try {
      // ---- categoria
      let categoriaId = ctx.categorias.get(chave(produto.categoria))?.id;
      if (!categoriaId) {
        const escolhida = opcoes.categoriasEscolhidas[chave(produto.categoria)];
        if (escolhida) {
          const existe = await prisma.category.findUnique({ where: { id: escolhida }, select: { id: true, name: true } });
          if (!existe) throw new Error(`Categoria escolhida para "${produto.categoria}" não existe mais.`);
          categoriaId = existe.id;
          ctx.categorias.set(chave(produto.categoria), existe);
        } else if (opcoes.criarCategorias) {
          const slug = await uniqueSlug(produto.categoria, async (s) =>
            Boolean(await prisma.category.findUnique({ where: { slug: s } })),
          );
          const criada = await prisma.category.create({
            data: { name: produto.categoria, slug, order: 99 },
          });
          categoriaId = criada.id;
          // Próximas linhas com a mesma categoria reaproveitam a que acabou de nascer.
          ctx.categorias.set(chave(produto.categoria), { id: criada.id, name: criada.name });
          ctx.categorias.set(chave(criada.slug), { id: criada.id, name: criada.name });
        } else {
          throw new Error(`A categoria "${produto.categoria}" não existe na loja.`);
        }
      }

      // ---- duplicidade por SKU
      const existente = ctx.produtosPorSku.get(produto.sku);
      if (existente) {
        if (opcoes.duplicados === "ignorar") {
          ignorados++;
          continue;
        }
        if (opcoes.duplicados === "impedir") {
          throw new Error(`SKU "${produto.sku}" já é usado pelo produto "${existente.name}".`);
        }
      }

      // ---- imagens (fora de qualquer transação: download é lento)
      const urls: string[] = [];
      for (const endereco of produto.imagensUrls) {
        try {
          urls.push(await baixarImagem(endereco));
        } catch (err) {
          throw new Error(`Imagem "${endereco}" não pôde ser baixada (${(err as Error).message}).`);
        }
      }
      urls.push(...(imagensPorSku.get(produto.sku) ?? []));

      const dadosBase = {
        name: produto.nome,
        description: produto.descricao,
        features: JSON.stringify(produto.caracteristicas),
        tags: JSON.stringify(produto.tags),
        brand: produto.marca.trim(),
        price: produto.preco,
        compareAtPrice: produto.precoPromocional,
        costPrice: produto.custo,
        weightKg: produto.pesoKg,
        volumeM3: produto.volumeM3,
        sku: produto.sku,
        featured: produto.destaque,
        active: produto.ativo,
        categoryId: categoriaId!,
      };

      if (existente) {
        const urlsAntigas = await atualizarProduto(existente.id, dadosBase, produto.variacoes, urls);
        await Promise.all(urlsAntigas.map((u) => deleteUpload(u).catch(() => undefined)));
        atualizados++;
      } else {
        const slug = await uniqueSlug(produto.nome, async (s) =>
          Boolean(await prisma.product.findUnique({ where: { slug: s } })),
        );
        const novo = await prisma.$transaction(async (tx) => {
          const criado = await tx.product.create({
            data: {
              ...dadosBase,
              slug,
              variants: {
                create: produto.variacoes.map((v) => ({
                  color: v.cor,
                  colorHex: v.corHex,
                  size: v.tamanho,
                  stock: v.estoque,
                })),
              },
            },
            select: { id: true, name: true, sku: true },
          });
          if (urls.length > 0) {
            await tx.productImage.createMany({
              data: urls.map((url, i) => ({ productId: criado.id, url, order: i })),
            });
          }
          return criado;
        });
        criados.push({ id: novo.id, nome: novo.name });
        // O SKU passa a existir: uma linha repetida mais adiante cai na
        // regra de duplicados em vez de estourar a chave única do banco.
        ctx.produtosPorSku.set(novo.sku.toUpperCase(), { id: novo.id, name: novo.name });
      }
    } catch (err) {
      erros.push({ linha: item.linha, produto: rotulo, sku, erro: mensagemDeErro(err) });
    }
  }

  const errosAcumulados = [...(registro.errors as unknown as ErroImportacao[]), ...erros];
  const atualizado = await prisma.productImport.update({
    where: { id: registro.id },
    data: {
      total: registro.total + itens.length,
      created: registro.created + criados.length,
      updated: registro.updated + atualizados,
      skipped: registro.skipped + ignorados,
      failed: registro.failed + erros.length,
      createdProductIds: { push: criados.map((c) => c.id) },
      errors: errosAcumulados as unknown as Prisma.InputJsonValue,
      ...(finalizar ? { status: "concluida" } : {}),
    },
  });

  res.json({
    importId: atualizado.id,
    status: atualizado.status,
    lote: { criados: criados.length, atualizados, ignorados, erros: erros.length },
    acumulado: {
      total: atualizado.total,
      criados: atualizado.created,
      atualizados: atualizado.updated,
      ignorados: atualizado.skipped,
      erros: atualizado.failed,
    },
    errosDoLote: erros,
  });
});

function mensagemDeErro(err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const alvo = (err.meta?.target as string[] | undefined)?.join(", ") ?? "campo único";
      return `Já existe um produto com esse ${alvo}.`;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  console.error(err);
  return "Erro inesperado ao gravar o produto.";
}

/**
 * Atualiza um produto existente com os dados da planilha e devolve as URLs
 * das imagens que saíram (para apagar do storage depois da transação).
 *
 * Variações seguem a mesma política do cadastro manual: as que sumiram da
 * planilha ficam com estoque 0 em vez de serem apagadas — elas podem estar
 * em pedidos antigos.
 */
async function atualizarProduto(
  productId: string,
  dados: Record<string, unknown>,
  variacoes: { cor: string; corHex: string; tamanho: string; estoque: number }[],
  urls: string[],
): Promise<string[]> {
  return prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: dados });

    const atuais = await tx.productVariant.findMany({ where: { productId } });
    const mantidas = new Set<string>();
    for (const v of variacoes) {
      const upsert = await tx.productVariant.upsert({
        where: { productId_color_size: { productId, color: v.cor, size: v.tamanho } },
        update: { colorHex: v.corHex, stock: v.estoque },
        create: { productId, color: v.cor, colorHex: v.corHex, size: v.tamanho, stock: v.estoque },
      });
      mantidas.add(upsert.id);
    }
    for (const antiga of atuais) {
      if (!mantidas.has(antiga.id)) {
        await tx.productVariant.update({ where: { id: antiga.id }, data: { stock: 0 } });
      }
    }

    // Sem imagem na planilha, a galeria atual fica como está.
    if (urls.length === 0) return [];
    const antigas = await tx.productImage.findMany({ where: { productId }, select: { id: true, url: true } });
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productImage.createMany({
      data: urls.map((url, i) => ({ productId, url, order: i })),
    });
    return antigas.map((a) => a.url);
  });
}

// ---------------------------------------------------------------------------
// 4) Histórico, relatório de erros e desfazer
// ---------------------------------------------------------------------------

adminProductImportsRouter.get("/", async (_req, res) => {
  const itens = await prisma.productImport.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fileName: true,
      status: true,
      total: true,
      created: true,
      updated: true,
      skipped: true,
      failed: true,
      undoneAt: true,
      createdAt: true,
      createdProductIds: true,
    },
  });
  res.json({
    itens: itens.map(({ createdProductIds, ...i }) => ({ ...i, podeDesfazer: createdProductIds.length > 0 })),
  });
});

adminProductImportsRouter.get("/:id", async (req, res) => {
  const registro = await prisma.productImport.findUnique({ where: { id: req.params.id } });
  if (!registro) {
    res.status(404).json({ error: "Importação não encontrada." });
    return;
  }
  // Os produtos criados podem ter sido excluídos depois, por isso a busca.
  const produtos = await prisma.product.findMany({
    where: { id: { in: registro.createdProductIds } },
    select: { id: true, name: true, sku: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ ...registro, produtos, podeDesfazer: produtos.length > 0 && !registro.undoneAt });
});

adminProductImportsRouter.get("/:id/errors.csv", async (req, res) => {
  const registro = await prisma.productImport.findUnique({ where: { id: req.params.id } });
  if (!registro) {
    res.status(404).json({ error: "Importação não encontrada." });
    return;
  }
  const erros = registro.errors as unknown as ErroImportacao[];
  const csv = montarCsv([
    ["linha", "produto", "sku", "erro"],
    ...erros.map((e) => [String(e.linha), e.produto, e.sku, e.erro]),
  ]);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="erros-importacao-${registro.id}.csv"`);
  res.send(csv);
});

/**
 * Desfaz: apaga só os produtos CRIADOS nesta importação.
 *
 * Produto que já existia antes (atualizado) nunca é tocado, e produto que já
 * entrou em algum pedido não é apagado — o pedido perderia o item. Os dois
 * casos voltam no resumo para o lojista saber o que ficou.
 */
adminProductImportsRouter.post("/:id/undo", async (req, res) => {
  const registro = await prisma.productImport.findUnique({ where: { id: req.params.id } });
  if (!registro) {
    res.status(404).json({ error: "Importação não encontrada." });
    return;
  }
  if (registro.undoneAt) {
    res.status(409).json({ error: "Esta importação já foi desfeita." });
    return;
  }

  let removidos = 0;
  let comPedido = 0;
  const imagens: string[] = [];

  for (const id of registro.createdProductIds) {
    try {
      const produto = await prisma.product.delete({ where: { id }, include: { images: true } });
      imagens.push(...produto.images.map((i) => i.url));
      removidos++;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: existe pedido apontando para uma variação deste produto.
        if (err.code === "P2003") comPedido++;
        // P2025: já tinha sido excluído à mão.
        else if (err.code !== "P2025") throw err;
      } else {
        throw err;
      }
    }
  }

  await Promise.all(imagens.map((url) => deleteUpload(url).catch(() => undefined)));
  await prisma.productImport.update({
    where: { id: registro.id },
    data: { status: "desfeita", undoneAt: new Date(), createdProductIds: [] },
  });

  res.json({ removidos, comPedido });
});
