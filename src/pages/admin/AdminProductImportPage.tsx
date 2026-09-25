import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Images,
  Loader2,
  PenLine,
  RotateCcw,
  Undo2,
  Upload,
} from "lucide-react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { PreviaImportacao } from "../../components/admin/import/PreviaImportacao";
import {
  IMAGENS_POR_LOTE,
  LINHAS_POR_LOTE,
  URL_MODELO,
  urlRelatorioErros,
  useCasarImagens,
  useDesfazerImportacao,
  useEnviarImagens,
  useEnviarPlanilha,
  useGravarLote,
  useHistoricoImportacoes,
  useRevalidarLinhas,
  type ArquivoImagem,
  type CampoImport,
  type ErroImport,
  type LinhaImport,
  type OpcoesImport,
  type PreviaImport,
} from "../../hooks/admin/useProductImport";

/**
 * Importação em massa de produtos.
 *
 * O caminho é sempre o mesmo: escolher a planilha → conferir a prévia →
 * corrigir → importar → ver o resultado. Nada é gravado antes do último
 * passo, e quem valida é o servidor: esta tela mostra o que ele respondeu.
 */

type Etapa = "escolher" | "previa" | "importando" | "resultado";

interface Resultado {
  importId: string;
  total: number;
  criados: number;
  atualizados: number;
  ignorados: number;
  erros: ErroImport[];
}

const OPCOES_INICIAIS: OpcoesImport = {
  duplicados: "ignorar",
  criarCategorias: true,
  categoriasEscolhidas: {},
};

export default function AdminProductImportPage() {
  const [etapa, setEtapa] = useState<Etapa>("escolher");
  const [previa, setPrevia] = useState<PreviaImport | null>(null);
  const [itens, setItens] = useState<LinhaImport[]>([]);
  const [opcoes, setOpcoes] = useState<OpcoesImport>(OPCOES_INICIAIS);
  const [imagens, setImagens] = useState<ArquivoImagem[]>([]);
  const [imagensPorSku, setImagensPorSku] = useState<Record<string, string[]>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [erroImagens, setErroImagens] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [progresso, setProgresso] = useState({ feitos: 0, total: 0 });
  const [resultado, setResultado] = useState<Resultado | null>(null);
  /** De onde continuar se um lote falhar no meio (rede caiu, por exemplo). */
  const retomar = useRef<{ indice: number; importId?: string } | null>(null);

  const entradaArquivo = useRef<HTMLInputElement>(null);
  const [aceita, setAceita] = useState(".csv,.xlsx,.xls");

  const enviarPlanilha = useEnviarPlanilha();
  const revalidar = useRevalidarLinhas();
  const enviarImagens = useEnviarImagens();
  const casarImagens = useCasarImagens();
  const gravarLote = useGravarLote();
  const desfazer = useDesfazerImportacao();
  const { data: historico = [] } = useHistoricoImportacoes();
  const confirmDialog = useConfirmDialog();

  // ---- planilha ------------------------------------------------------------

  async function abrirPlanilha(arquivo: File) {
    setErro(null);
    try {
      const resposta = await enviarPlanilha.mutateAsync(arquivo);
      setPrevia(resposta);
      setItens(resposta.itens);
      setOpcoes(OPCOES_INICIAIS);
      setImagens([]);
      setImagensPorSku({});
      setEtapa("previa");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível ler a planilha.");
    }
  }

  // ---- edição na prévia ----------------------------------------------------

  const revalidacaoPendente = useRef<number | null>(null);
  useEffect(() => () => window.clearTimeout(revalidacaoPendente.current ?? undefined), []);

  function agendarRevalidacao(novos: LinhaImport[]) {
    window.clearTimeout(revalidacaoPendente.current ?? undefined);
    revalidacaoPendente.current = window.setTimeout(async () => {
      try {
        const resposta = await revalidar.mutateAsync(
          novos.map((i) => ({ linha: i.linha, valores: i.valores })),
        );
        setItens(resposta.itens);
      } catch {
        // A validação definitiva acontece na gravação: se a revalidação
        // falhar, a tela só fica com o estado anterior.
      }
    }, 500);
  }

  function editarCampo(linha: number, campo: CampoImport, valor: string) {
    setItens((atuais) => {
      const novos = atuais.map((i) =>
        i.linha === linha ? { ...i, valores: { ...i.valores, [campo]: valor } } : i,
      );
      agendarRevalidacao(novos);
      return novos;
    });
  }

  function removerLinha(linha: number) {
    setItens((atuais) => atuais.filter((i) => i.linha !== linha));
  }

  // ---- imagens -------------------------------------------------------------

  async function adicionarImagens(arquivos: File[]) {
    setErroImagens(null);
    const enviadas: ArquivoImagem[] = [];
    try {
      for (let i = 0; i < arquivos.length; i += IMAGENS_POR_LOTE) {
        const resposta = await enviarImagens.mutateAsync(arquivos.slice(i, i + IMAGENS_POR_LOTE));
        enviadas.push(...resposta.itens);
      }
    } catch (err) {
      setErroImagens(err instanceof Error ? err.message : "Não foi possível enviar as imagens.");
    }
    if (enviadas.length === 0) return;

    const todas = [...imagens, ...enviadas];
    setImagens(todas);
    await atualizarCasamento(todas);
  }

  async function atualizarCasamento(arquivos: ArquivoImagem[]) {
    const alvos = itens
      .filter((i) => i.resumo)
      .map((i) => ({
        sku: i.resumo!.sku,
        nome: i.resumo!.nome,
        nomesNaPlanilha: [],
      }));
    try {
      const resposta = await casarImagens.mutateAsync({ alvos, arquivos });
      setImagensPorSku(resposta.porSku);
    } catch {
      setImagensPorSku({});
    }
  }

  // ---- gravação ------------------------------------------------------------

  async function importar(inicio = 0, importIdAnterior?: string) {
    setErro(null);
    setEtapa("importando");
    const lotes: LinhaImport[][] = [];
    for (let i = 0; i < itens.length; i += LINHAS_POR_LOTE) lotes.push(itens.slice(i, i + LINHAS_POR_LOTE));

    setProgresso({ feitos: inicio * LINHAS_POR_LOTE, total: itens.length });
    let importId = importIdAnterior;
    let acumulado = { total: 0, criados: 0, atualizados: 0, ignorados: 0, erros: 0 };
    const errosTodos: ErroImport[] = [];

    for (let i = inicio; i < lotes.length; i++) {
      try {
        const resposta = await gravarLote.mutateAsync({
          importId,
          fileName: previa?.fileName ?? "",
          itens: lotes[i].map((l) => ({ linha: l.linha, valores: l.valores })),
          imagens,
          opcoes,
          finalizar: i === lotes.length - 1,
        });
        importId = resposta.importId;
        acumulado = resposta.acumulado;
        errosTodos.push(...resposta.errosDoLote);
        setProgresso({ feitos: Math.min(itens.length, (i + 1) * LINHAS_POR_LOTE), total: itens.length });
      } catch (err) {
        // Guarda onde parou: os produtos dos lotes anteriores já estão na
        // loja, então recomeçar do zero duplicaria trabalho.
        retomar.current = { indice: i, importId };
        setErro(
          `${err instanceof Error ? err.message : "Falha na importação."} ${acumulado.criados} produto(s) já foram importados.`,
        );
        return;
      }
    }

    retomar.current = null;
    setResultado({
      importId: importId!,
      total: acumulado.total,
      criados: acumulado.criados,
      atualizados: acumulado.atualizados,
      ignorados: acumulado.ignorados,
      erros: errosTodos,
    });
    setEtapa("resultado");
  }

  function recomecar() {
    setEtapa("escolher");
    setPrevia(null);
    setItens([]);
    setImagens([]);
    setImagensPorSku({});
    setResultado(null);
    setErro(null);
    retomar.current = null;
  }

  function pedirDesfazer(importId: string, quantidade: number) {
    confirmDialog.ask({
      title: "Desfazer esta importação",
      description: `Os ${quantidade} produto(s) criados nesta importação serão removidos da loja. Produtos que já existiam antes e produtos que já entraram em algum pedido não são tocados.`,
      confirmLabel: "Desfazer importação",
      onConfirm: async () => {
        setErro(null);
        try {
          const r = await desfazer.mutateAsync(importId);
          setResultado(null);
          setEtapa("escolher");
          setErro(
            r.comPedido > 0
              ? `${r.removidos} produto(s) removido(s). ${r.comPedido} não pôde(ram) ser removido(s) porque já estão em pedidos.`
              : `${r.removidos} produto(s) removido(s).`,
          );
        } catch (err) {
          setErro(err instanceof Error ? err.message : "Não foi possível desfazer.");
        }
      },
    });
  }

  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/admin/produtos"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-ink"
        >
          <ArrowLeft size={15} /> Voltar para produtos
        </Link>
        <h1 className="font-display text-2xl tracking-wide">Importar produtos</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Cadastre vários produtos de uma vez a partir de uma planilha. Nada entra na loja antes de você
          conferir a prévia.
        </p>
      </div>

      {erro && <p className="alert-error">{erro}</p>}

      {etapa === "escolher" && (
        <>
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              const arquivo = e.dataTransfer.files?.[0];
              if (arquivo) void abrirPlanilha(arquivo);
            }}
            className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-colors ${
              arrastando ? "ring-2 ring-brand-yellow" : "ring-black/5"
            }`}
          >
            <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">
              COMO DESEJA ADICIONAR OS PRODUTOS?
            </h2>

            <input
              ref={entradaArquivo}
              type="file"
              accept={aceita}
              className="hidden"
              data-testid="entrada-planilha"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                e.target.value = "";
                if (arquivo) void abrirPlanilha(arquivo);
              }}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Metodo
                icone={FileText}
                titulo="Importar CSV"
                descricao="Planilha salva como .csv"
                onClick={() => {
                  setAceita(".csv,text/csv");
                  setTimeout(() => entradaArquivo.current?.click(), 0);
                }}
              />
              <Metodo
                icone={FileSpreadsheet}
                titulo="Importar Excel"
                descricao="Arquivo .xlsx do Excel ou Google Planilhas"
                onClick={() => {
                  setAceita(".xlsx,.xls");
                  setTimeout(() => entradaArquivo.current?.click(), 0);
                }}
              />
              <Metodo
                icone={Images}
                titulo="Produtos + imagens"
                descricao="Envie a planilha e depois as fotos, na mesma tela"
                onClick={() => {
                  setAceita(".csv,.xlsx,.xls");
                  setTimeout(() => entradaArquivo.current?.click(), 0);
                }}
              />
              <Metodo
                icone={PenLine}
                titulo="Adicionar manualmente"
                descricao="Cadastrar um produto por vez, como sempre"
                para="/admin/produtos/novo"
              />
            </div>

            <p className="mt-4 text-center text-xs text-neutral-400">
              {enviarPlanilha.isPending ? (
                <span className="inline-flex items-center gap-2 text-neutral-600">
                  <Loader2 size={14} className="animate-spin" /> Lendo a planilha…
                </span>
              ) : (
                "Você também pode arrastar a planilha para esta área."
              )}
            </p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">
              MODELO DE PLANILHA
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-neutral-500">
              Baixe o modelo, preencha uma linha por produto e envie de volta. Obrigatórios:{" "}
              <strong className="font-medium text-brand-ink">nome</strong>,{" "}
              <strong className="font-medium text-brand-ink">categoria</strong> e{" "}
              <strong className="font-medium text-brand-ink">preco</strong>. Tamanhos e cores separados por
              vírgula (P,M,G) viram as variações do produto. O <strong className="font-medium text-brand-ink">sku</strong>{" "}
              é o código que identifica o produto numa próxima importação.
            </p>
            <a href={URL_MODELO} className="btn-outline inline-flex">
              <Download size={15} /> Baixar modelo de planilha
            </a>
          </section>

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <h2 className="flex items-center gap-2 border-b border-black/5 px-5 py-4 font-display text-sm tracking-widest text-neutral-500">
              <History size={15} /> IMPORTAÇÕES ANTERIORES
            </h2>
            {historico.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-400">
                Nenhuma importação ainda. A primeira aparece aqui.
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {historico.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-ink">{h.fileName || "Planilha"}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(h.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
                        {h.total} analisado(s) · {h.created} criado(s) · {h.updated} atualizado(s) ·{" "}
                        {h.skipped} ignorado(s) · {h.failed} com erro
                        {h.undoneAt && " · desfeita"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-sm">
                      {h.failed > 0 && (
                        <a href={urlRelatorioErros(h.id)} className="text-neutral-500 underline-offset-4 hover:underline">
                          Baixar erros
                        </a>
                      )}
                      {h.podeDesfazer && !h.undoneAt && (
                        <button
                          type="button"
                          onClick={() => pedirDesfazer(h.id, h.created)}
                          className="flex items-center gap-1.5 text-red-600 underline-offset-4 hover:underline"
                        >
                          <Undo2 size={14} /> Desfazer
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {etapa === "previa" && previa && (
        <PreviaImportacao
          previa={previa}
          itens={itens}
          opcoes={opcoes}
          imagens={imagens}
          imagensPorSku={imagensPorSku}
          revalidando={revalidar.isPending}
          enviandoImagens={enviarImagens.isPending}
          erroImagens={erroImagens}
          onEditar={editarCampo}
          onRemoverLinha={removerLinha}
          onOpcoes={setOpcoes}
          onImagens={(arquivos) => void adicionarImagens(arquivos)}
          onImportar={() => void importar()}
          onCancelar={recomecar}
        />
      )}

      {etapa === "importando" && (
        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            {erro ? (
              <>
                <p className="text-sm text-neutral-600">A importação parou no meio.</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void importar(retomar.current?.indice ?? 0, retomar.current?.importId)}
                    className="btn-primary"
                  >
                    Continuar de onde parou
                  </button>
                  <button type="button" onClick={recomecar} className="btn-outline">
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <Loader2 size={28} className="animate-spin text-brand-yellow-dark" />
                <p className="font-display text-lg tracking-wide text-brand-ink">Importando produtos…</p>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-neutral-100"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={progresso.total}
                  aria-valuenow={progresso.feitos}
                >
                  <div
                    className="h-full rounded-full bg-brand-ink transition-[width] duration-300"
                    style={{ width: `${progresso.total ? (progresso.feitos / progresso.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-sm tabular-nums text-neutral-500">
                  {progresso.feitos} de {progresso.total} produtos processados
                </p>
                <p className="text-xs text-neutral-400">Pode demorar um pouco se houver imagens por endereço.</p>
              </>
            )}
          </div>
        </section>
      )}

      {etapa === "resultado" && resultado && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 size={22} className="text-green-600" />
              <h2 className="font-display text-xl tracking-wide text-brand-ink">Importação concluída!</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero rotulo="Analisados" valor={resultado.total} />
              <Numero rotulo="Cadastrados" valor={resultado.criados} cor="text-green-700" />
              <Numero rotulo="Atualizados" valor={resultado.atualizados} cor="text-blue-700" />
              <Numero rotulo="Ignorados" valor={resultado.ignorados} />
            </div>
            {resultado.erros.length > 0 && (
              <p className="mt-3 text-sm text-red-600">
                {resultado.erros.length} produto(s) com erro — veja a lista abaixo.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/admin/produtos" className="btn-primary">
                Ver produtos cadastrados
              </Link>
              {resultado.erros.length > 0 && (
                <a href={urlRelatorioErros(resultado.importId)} className="btn-outline">
                  <Download size={15} /> Baixar relatório de erros
                </a>
              )}
              <button type="button" onClick={recomecar} className="btn-outline">
                <Upload size={15} /> Nova importação
              </button>
              {resultado.criados > 0 && (
                <button
                  type="button"
                  onClick={() => pedirDesfazer(resultado.importId, resultado.criados)}
                  disabled={desfazer.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-7 py-3.5 font-display text-sm tracking-[0.15em] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  <RotateCcw size={15} /> Desfazer importação
                </button>
              )}
            </div>
          </section>

          {resultado.erros.length > 0 && (
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <h2 className="border-b border-black/5 px-5 py-4 font-display text-sm tracking-widest text-neutral-500">
                PRODUTOS COM ERRO
              </h2>
              <ul className="divide-y divide-black/5">
                {resultado.erros.map((e, i) => (
                  <li key={i} className="px-5 py-3 text-sm">
                    <span className="font-medium text-brand-ink">Linha {e.linha}</span>
                    {e.produto && <span className="text-neutral-600"> — {e.produto}</span>}
                    {e.sku && <span className="font-mono text-xs text-neutral-400"> ({e.sku})</span>}
                    <span className="block text-red-600">{e.erro}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </div>
  );
}

function Metodo({
  icone: Icone,
  titulo,
  descricao,
  onClick,
  para,
}: {
  icone: typeof FileText;
  titulo: string;
  descricao: string;
  onClick?: () => void;
  para?: string;
}) {
  const conteudo = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-brand-yellow-dark">
        <Icone size={20} />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-brand-ink">{titulo}</span>
        <span className="block text-xs text-neutral-500">{descricao}</span>
      </span>
    </>
  );
  const classe =
    "flex items-center gap-3 rounded-xl border border-black/10 p-4 text-left transition-colors hover:border-brand-ink hover:bg-neutral-50";

  if (para) {
    return (
      <Link to={para} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  );
}

function Numero({ rotulo, valor, cor = "text-brand-ink" }: { rotulo: string; valor: number; cor?: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-4">
      <p className="text-xs text-neutral-500">{rotulo}</p>
      <p className={`font-display text-2xl tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}
