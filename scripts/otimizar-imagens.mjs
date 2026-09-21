/**
 * Gera as versões otimizadas dos assets que entram no bundle.
 *
 * Por que existe: a home baixava 1,8 MB de imagens antes de o visitante rolar
 * um pixel, e oito delas eram arquivos de 1200 px exibidos num quadrado de
 * 114 px — 10,5x mais resolução do que a tela mostra. Redimensionar na origem
 * é a maior economia isolada do site.
 *
 * Não faz parte do `npm run build`: estes assets mudam raramente e colocar o
 * sharp (~30 MB) na árvore de dependências só encareceria o deploy. Para
 * regerar:
 *
 *   npm install --no-save sharp
 *   node scripts/otimizar-imagens.mjs
 *
 * As saídas ficam em src/assets/images/otimizadas/ e são versionadas.
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ORIGEM = "src/assets/images";
const DESTINO = path.join(ORIGEM, "otimizadas");

/**
 * `largura` é o maior tamanho FÍSICO que a imagem chega a ocupar: o tamanho
 * em CSS multiplicado pela densidade de tela do aparelho. Passar disso é
 * baixar pixel que o navegador joga fora.
 */
const ALVOS = [
  // Grade do Instagram: quadrado de ~114 px no celular (342 px em tela 3x) e
  // ~150 px no computador. 400 px cobre os dois com folga.
  { arquivo: "insta-01.jpg", largura: 400, qualidade: 74 },
  { arquivo: "insta-02.jpg", largura: 400, qualidade: 74 },
  { arquivo: "insta-03.jpg", largura: 400, qualidade: 74 },
  { arquivo: "insta-04.jpg", largura: 400, qualidade: 74 },
  { arquivo: "insta-05.jpg", largura: 400, qualidade: 74 },
  { arquivo: "product-camiseta-01.jpg", largura: 400, qualidade: 74 },
  { arquivo: "product-camiseta-03.jpg", largura: 400, qualidade: 74 },
  { arquivo: "product-bermuda-02.jpg", largura: 400, qualidade: 74 },
  // Logo: aparece a 40-44 px no cabeçalho e no rodapé.
  { arquivo: "logo.jpg", largura: 128, qualidade: 82 },
  // Fundo da newsletter: faixa larga no rodapé da página.
  { arquivo: "newsletter-bg.webp", largura: 1280, qualidade: 68 },
  // Foto do hero: ocupa a tela inteira, então precisa de resolução de verdade.
  { arquivo: "hero-friends.jpg", largura: 1600, qualidade: 72 },
];

await fs.mkdir(DESTINO, { recursive: true });

let antes = 0;
let depois = 0;
for (const alvo of ALVOS) {
  const entrada = path.join(ORIGEM, alvo.arquivo);
  const saida = path.join(DESTINO, alvo.arquivo.replace(/\.(jpg|jpeg|png|webp)$/i, ".webp"));
  const origem = await sharp(entrada);
  const meta = await origem.metadata();

  await origem
    // `withoutEnlargement` protege contra ampliar um arquivo já pequeno.
    .resize({ width: alvo.largura, withoutEnlargement: true })
    .webp({ quality: alvo.qualidade, effort: 6 })
    .toFile(saida);

  const bytesAntes = (await fs.stat(entrada)).size;
  const bytesDepois = (await fs.stat(saida)).size;
  antes += bytesAntes;
  depois += bytesDepois;
  const novaMeta = await sharp(saida).metadata();
  console.log(
    `  ${alvo.arquivo.padEnd(26)} ${String(meta.width).padStart(5)}px ${(bytesAntes / 1024).toFixed(0).padStart(4)} KB` +
      `  ->  ${String(novaMeta.width).padStart(5)}px ${(bytesDepois / 1024).toFixed(0).padStart(4)} KB` +
      `  (-${(100 - (bytesDepois / bytesAntes) * 100).toFixed(0)}%)`,
  );
}

console.log(
  `\n  TOTAL  ${(antes / 1024).toFixed(0)} KB -> ${(depois / 1024).toFixed(0)} KB ` +
    `(economia de ${((antes - depois) / 1024).toFixed(0)} KB, -${(100 - (depois / antes) * 100).toFixed(0)}%)`,
);
