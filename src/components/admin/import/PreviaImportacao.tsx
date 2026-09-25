import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Copy, ImagePlus, Loader2, Pencil, Tag, X } from "lucide-react";
import { formatBRL } from "../../../lib/format";
import {
  IMAGENS_POR_LOTE,
  type ArquivoImagem,
  type CampoImport,
  type LinhaImport,
  type OpcoesImport,
  type PreviaImport,
} from "../../../hooks/admin/useProductImport";

/** Campos que o lojista pode corrigir direto na prévia, na ordem do formulário. */
const CAMPOS_EDITAVEIS: { campo: CampoImport; rotulo: string; dica?: string }[] = [
  { campo: "nome", rotulo: "Nome" },
  { campo: "sku", rotulo: "SKU" },
  { campo: "categoria", rotulo: "Categoria" },
  { campo: "preco", rotulo: "Preço", dica: "Ex: 89,90" },
  { campo: "precoPromocional", rotulo: "Preço promocional (De: riscado)" },
  { campo: "custo", rotulo: "Custo" },
  { campo: "estoque", rotulo: "Estoque" },
  { campo: "tamanho", rotulo: "Tamanhos", dica: "Ex: P,M,G" },
  { campo: "cor", rotulo: "Cores", dica: "Ex: Preto,Branco" },
  { campo: "marca", rotulo: "Marca" },
  { campo: "status", rotulo: "Status", dica: "ativo ou inativo" },
  { campo: "destaque", rotulo: "Destaque", dica: "sim ou não" },
  { campo: "tags", rotulo: "Etiquetas" },
  { campo: "descricao", rotulo: "Descrição" },
  { campo: "imagens", rotulo: "Imagens", dica: "Endereços ou nomes de arquivo" },
];

const POR_PAGINA = 25;

/** "Chapéus" → "chapeus": a mesma chave que o servidor usa para casar categoria. */
function chaveCategoria(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

interface Props {
  previa: PreviaImport;
  itens: LinhaImport[];
  opcoes: OpcoesImport;
  imagens: ArquivoImagem[];
  imagensPorSku: Record<string, string[]>;
  revalidando: boolean;
  enviandoImagens: boolean;
  erroImagens: string | null;
  onEditar: (linha: number, campo: CampoImport, valor: string) => void;
  onRemoverLinha: (linha: number) => void;
  onOpcoes: (opcoes: OpcoesImport) => void;
  onImagens: (arquivos: File[]) => void;
  onImportar: () => void;
  onCancelar: () => void;
}

export function PreviaImportacao({
  previa,
  itens,
  opcoes,
  imagens,
  imagensPorSku,
  revalidando,
  enviandoImagens,
  erroImagens,
  onEditar,
  onRemoverLinha,
  onOpcoes,
  onImagens,
  onImportar,
  onCancelar,
}: Props) {
  const [pagina, setPagina] = useState(0);
  const [soComProblema, setSoComProblema] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const entradaImagens = useRef<HTMLInputElement>(null);

  const validos = itens.filter((i) => i.erros.length === 0);
  const comErro = itens.filter((i) => i.erros.length > 0);
  const duplicados = validos.filter((i) => i.duplicado);
  const categoriasFaltando = [...new Set(itens.map((i) => i.categoriaFaltando).filter(Boolean))] as string[];

  const listados = useMemo(
    () => (soComProblema ? itens.filter((i) => i.erros.length > 0 || i.avisos.length > 0 || i.duplicado) : itens),
    [itens, soComProblema],
  );
  const totalPaginas = Math.max(1, Math.ceil(listados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = listados.slice(paginaAtual * POR_PAGINA, paginaAtual * POR_PAGINA + POR_PAGINA);

  /** Quantos produtos realmente entram, já descontando os que serão ignorados. */
  const aImportar = opcoes.duplicados === "ignorar" ? validos.length - duplicados.length : validos.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Contadores */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Contador rotulo="Encontrados" valor={itens.length} />
        <Contador rotulo="Válidos" valor={validos.length} cor="text-green-700" />
        <Contador rotulo="Com erro" valor={comErro.length} cor={comErro.length ? "text-red-600" : undefined} />
        <Contador rotulo="Já existem" valor={duplicados.length} cor={duplicados.length ? "text-amber-600" : undefined} />
      </section>

      {previa.colunasIgnoradas.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Colunas que a loja não usa e foram ignoradas: {previa.colunasIgnoradas.join(", ")}.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Opções */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 font-display text-sm tracking-widest text-neutral-500">OPÇÕES</h2>

          <fieldset className="mb-5">
            <legend className="mb-2 text-xs font-medium text-neutral-500">
              Produtos que já existem (mesmo SKU)
            </legend>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["ignorar", "Ignorar", "Mantém o produto atual como está."],
                  ["atualizar", "Atualizar", "Substitui os dados pelos da planilha."],
                  ["impedir", "Não importar", "Marca a linha como erro."],
                ] as const
              ).map(([valor, rotulo, ajuda]) => (
                <label key={valor} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="duplicados"
                    value={valor}
                    checked={opcoes.duplicados === valor}
                    onChange={() => onOpcoes({ ...opcoes, duplicados: valor })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-brand-ink">{rotulo}</span>
                    <span className="block text-xs text-neutral-500">{ajuda}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="criarCategorias"
              checked={opcoes.criarCategorias}
              onChange={(e) => onOpcoes({ ...opcoes, criarCategorias: e.target.checked })}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-brand-ink">Criar categorias que não existem</span>
              <span className="block text-xs text-neutral-500">
                Categorias novas da planilha entram automaticamente na loja.
              </span>
            </span>
          </label>

          {categoriasFaltando.length > 0 && (
            <div className="mt-5 border-t border-black/5 pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                <Tag size={13} /> CATEGORIAS QUE NÃO EXISTEM
              </p>
              <div className="flex flex-col gap-2">
                {categoriasFaltando.map((nome) => (
                  <label key={nome} className="text-xs text-neutral-500">
                    “{nome}”
                    <select
                      name={`categoria-${chaveCategoria(nome)}`}
                      value={opcoes.categoriasEscolhidas[chaveCategoria(nome)] ?? ""}
                      onChange={(e) =>
                        onOpcoes({
                          ...opcoes,
                          categoriasEscolhidas: {
                            ...opcoes.categoriasEscolhidas,
                            [chaveCategoria(nome)]: e.target.value,
                          },
                        })
                      }
                      className="mt-1 w-full admin-input px-3 py-2"
                    >
                      <option value="">
                        {opcoes.criarCategorias ? `Criar “${nome}”` : "Escolha uma categoria"}
                      </option>
                      {previa.categoriasExistentes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Usar {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Imagens */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <h2 className="mb-1 font-display text-sm tracking-widest text-neutral-500">IMAGENS (OPCIONAL)</h2>
          <p className="mb-4 text-xs leading-relaxed text-neutral-500">
            Envie as fotos com o SKU ou o nome do produto no nome do arquivo — por exemplo{" "}
            <code className="rounded bg-neutral-100 px-1">CAM-001-01.jpg</code>,{" "}
            <code className="rounded bg-neutral-100 px-1">CAM-001-02.jpg</code>. A primeira vira a foto
            principal. A planilha também aceita endereços de imagem (https://…).
          </p>

          <input
            ref={entradaImagens}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            data-testid="entrada-imagens"
            onChange={(e) => {
              const arquivos = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (arquivos.length > 0) onImagens(arquivos);
            }}
          />
          <button
            type="button"
            onClick={() => entradaImagens.current?.click()}
            disabled={enviandoImagens}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm text-neutral-500 hover:border-brand-ink hover:text-brand-ink disabled:opacity-60"
          >
            {enviandoImagens ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {enviandoImagens ? "Enviando imagens…" : "Escolher imagens"}
          </button>
          {erroImagens && <p className="alert-error mt-3">{erroImagens}</p>}

          {imagens.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-neutral-500">
                {imagens.length} {imagens.length === 1 ? "imagem enviada" : "imagens enviadas"} ·{" "}
                {Object.keys(imagensPorSku).length} {Object.keys(imagensPorSku).length === 1 ? "produto" : "produtos"} com foto
              </p>
              <ul className="flex flex-wrap gap-2">
                {imagens.slice(0, 24).map((img) => {
                  const dono = Object.entries(imagensPorSku).find(([, urls]) => urls.includes(img.url))?.[0];
                  return (
                    <li
                      key={img.url}
                      title={dono ? `Vai para ${dono}` : "Nenhum produto com esse SKU ou nome"}
                      className="flex items-center gap-1.5 rounded-full bg-neutral-50 py-1 pl-1 pr-2.5 text-[11px] ring-1 ring-black/5"
                    >
                      <img src={img.url} alt="" className="h-6 w-6 rounded-full object-cover" />
                      <span className="max-w-[140px] truncate text-neutral-600">{img.nome}</span>
                      {dono ? (
                        <span className="font-medium text-green-700">{dono}</span>
                      ) : (
                        <span className="text-amber-600">sem produto</span>
                      )}
                    </li>
                  );
                })}
                {imagens.length > 24 && (
                  <li className="self-center text-[11px] text-neutral-400">+{imagens.length - 24}</li>
                )}
              </ul>
            </div>
          )}
          <p className="mt-3 text-[11px] text-neutral-400">
            As imagens são enviadas em grupos de {IMAGENS_POR_LOTE}; pode escolher várias de uma vez.
          </p>
        </section>
      </div>

      {/* Tabela */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-sm tracking-widest text-neutral-500">
            PRODUTOS ENCONTRADOS
            {revalidando && <Loader2 size={13} className="ml-2 inline animate-spin text-neutral-400" />}
          </h2>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <input
              type="checkbox"
              name="so-problemas"
              checked={soComProblema}
              onChange={(e) => {
                setSoComProblema(e.target.checked);
                setPagina(0);
              }}
            />
            Mostrar só erros e avisos
          </label>
        </div>

        <p className="border-b border-black/5 px-5 py-2.5 text-xs text-neutral-500">
          O estoque informado na planilha vale para <strong className="font-medium">cada</strong> variação (cor ×
          tamanho); a coluna Estoque mostra o total do produto.
        </p>

        {listados.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">
            Nenhuma linha com erro ou aviso — pode importar.
          </p>
        ) : (
          <>
            {/* Computador: tabela. Celular: cartões (ver abaixo). */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase text-neutral-400">
                    <th className="py-3 pl-5 pr-4">Produto</th>
                    <th className="py-3 pr-4">Categoria</th>
                    <th className="py-3 pr-4">Preço</th>
                    <th className="py-3 pr-4">Estoque</th>
                    <th className="py-3 pr-4">SKU</th>
                    <th className="py-3 pr-5">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((item) => (
                    <LinhaTabela
                      key={item.linha}
                      item={item}
                      aberto={editando === item.linha}
                      onAbrir={() => setEditando(editando === item.linha ? null : item.linha)}
                      onEditar={onEditar}
                      onRemover={() => onRemoverLinha(item.linha)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-black/5 sm:hidden">
              {visiveis.map((item) => (
                <li key={item.linha} className="p-4">
                  <CartaoLinha
                    item={item}
                    aberto={editando === item.linha}
                    onAbrir={() => setEditando(editando === item.linha ? null : item.linha)}
                    onEditar={onEditar}
                    onRemover={() => onRemoverLinha(item.linha)}
                  />
                </li>
              ))}
            </ul>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-black/5 px-5 py-3 text-sm">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={paginaAtual === 0}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="tabular-nums text-neutral-500">
                  Página {paginaAtual + 1} de {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={paginaAtual >= totalPaginas - 1}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
                >
                  Próxima <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Ações */}
      <section className="sticky bottom-0 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.4)] ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          {comErro.length > 0 && (
            <span className="text-red-600">
              {comErro.length} {comErro.length === 1 ? "linha fica de fora" : "linhas ficam de fora"}.{" "}
            </span>
          )}
          {opcoes.duplicados === "ignorar" && duplicados.length > 0 && (
            <span className="text-amber-600">
              {duplicados.length} já {duplicados.length === 1 ? "existe e será ignorado" : "existem e serão ignorados"}.{" "}
            </span>
          )}
          Os produtos válidos são importados normalmente.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancelar} className="btn-outline">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onImportar}
            disabled={aImportar <= 0 || revalidando}
            className="btn-primary disabled:opacity-60"
          >
            IMPORTAR {aImportar} {aImportar === 1 ? "PRODUTO" : "PRODUTOS"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Contador({ rotulo, valor, cor = "text-brand-ink" }: { rotulo: string; valor: number; cor?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs text-neutral-500">{rotulo}</p>
      <p className={`font-display text-2xl tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}

function Situacao({ item }: { item: LinhaImport }) {
  if (item.erros.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
        <AlertTriangle size={12} /> Erro
      </span>
    );
  }
  if (item.duplicado) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Copy size={12} /> Já existe
      </span>
    );
  }
  if (item.categoriaFaltando) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        <Tag size={12} /> Categoria nova
      </span>
    );
  }
  if (item.avisos.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <AlertTriangle size={12} /> Aviso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle2 size={12} /> Pronto
    </span>
  );
}

function Mensagens({ item }: { item: LinhaImport }) {
  if (item.erros.length === 0 && item.avisos.length === 0 && !item.duplicado) return null;
  return (
    <div className="flex flex-col gap-1">
      {item.erros.map((e, i) => (
        <p key={`e${i}`} className="text-xs text-red-600">
          Linha {item.linha}: {e}
        </p>
      ))}
      {item.duplicado && (
        <p className="text-xs text-amber-700">
          Linha {item.linha}: já existe o produto “{item.duplicado.name}” com este SKU.
        </p>
      )}
      {item.avisos.map((a, i) => (
        <p key={`a${i}`} className="text-xs text-amber-700">
          Linha {item.linha}: {a}
        </p>
      ))}
    </div>
  );
}

interface LinhaProps {
  item: LinhaImport;
  aberto: boolean;
  onAbrir: () => void;
  onEditar: (linha: number, campo: CampoImport, valor: string) => void;
  onRemover: () => void;
}

function Editor({ item, onEditar, onRemover }: Omit<LinhaProps, "aberto" | "onAbrir">) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4">
      <Mensagens item={item} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CAMPOS_EDITAVEIS.filter(({ campo }) => item.valores[campo] !== undefined).map(({ campo, rotulo, dica }) => (
          <label key={campo} className="text-xs font-medium text-neutral-500">
            {rotulo}
            <input
              name={`linha-${item.linha}-${campo}`}
              value={item.valores[campo] ?? ""}
              placeholder={dica}
              onChange={(e) => onEditar(item.linha, campo, e.target.value)}
              className="mt-1 w-full admin-input px-3 py-2"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={onRemover}
        className="self-start text-xs font-medium text-red-600 underline-offset-4 hover:underline"
      >
        Tirar esta linha da importação
      </button>
    </div>
  );
}

function LinhaTabela({ item, aberto, onAbrir, onEditar, onRemover }: LinhaProps) {
  const r = item.resumo;
  return (
    <>
      <tr
        className={`border-b border-black/5 align-top ${item.erros.length > 0 ? "bg-red-50/40" : ""}`}
      >
        <td className="py-3 pl-5 pr-4">
          <p className="font-medium text-brand-ink">{r?.nome || item.valores.nome || "—"}</p>
          {r && r.variacoes > 1 && (
            <p className="text-xs text-neutral-400">{r.variacoes} variações</p>
          )}
          {r && r.imagens > 0 && <p className="text-xs text-neutral-400">{r.imagens} imagem(ns) na planilha</p>}
        </td>
        <td className="py-3 pr-4 text-neutral-600">{r?.categoria || item.valores.categoria || "—"}</td>
        <td className="py-3 pr-4 tabular-nums text-neutral-600">
          {r ? formatBRL(r.preco) : item.valores.preco || "—"}
          {r?.precoPromocional ? (
            <span className="block text-xs text-neutral-400 line-through">{formatBRL(r.precoPromocional)}</span>
          ) : null}
        </td>
        <td className="py-3 pr-4 tabular-nums text-neutral-600">{r ? r.estoque : item.valores.estoque || "—"}</td>
        <td className="py-3 pr-4 font-mono text-xs text-neutral-500">{r?.sku || item.valores.sku || "—"}</td>
        <td className="py-3 pr-5">
          <div className="flex items-center gap-2">
            <Situacao item={item} />
            <button
              type="button"
              onClick={onAbrir}
              aria-label={`Corrigir linha ${item.linha}`}
              aria-expanded={aberto}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink"
            >
              {aberto ? <X size={15} /> : <Pencil size={15} />}
            </button>
          </div>
        </td>
      </tr>
      {(aberto || item.erros.length > 0 || item.avisos.length > 0) && (
        <tr className="border-b border-black/5">
          <td colSpan={6} className="px-5 pb-4">
            {aberto ? <Editor item={item} onEditar={onEditar} onRemover={onRemover} /> : <Mensagens item={item} />}
          </td>
        </tr>
      )}
    </>
  );
}

function CartaoLinha({ item, aberto, onAbrir, onEditar, onRemover }: LinhaProps) {
  const r = item.resumo;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium text-brand-ink">{r?.nome || item.valores.nome || "—"}</p>
          <p className="text-xs text-neutral-500">
            {r?.categoria || item.valores.categoria || "—"} · {r ? formatBRL(r.preco) : item.valores.preco || "—"} ·{" "}
            {r ? r.estoque : item.valores.estoque || 0} un.
          </p>
          <p className="font-mono text-[11px] text-neutral-400">{r?.sku || item.valores.sku || "—"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Situacao item={item} />
          <button
            type="button"
            onClick={onAbrir}
            aria-label={`Corrigir linha ${item.linha}`}
            aria-expanded={aberto}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-ink"
          >
            {aberto ? <X size={15} /> : <Pencil size={15} />}
          </button>
        </div>
      </div>
      {aberto ? <Editor item={item} onEditar={onEditar} onRemover={onRemover} /> : <Mensagens item={item} />}
    </div>
  );
}
