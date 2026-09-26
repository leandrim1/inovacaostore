import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Texturas da cena — todas geradas no próprio navegador (a CSP só permite a
 * própria origem, e nada aqui justifica baixar arquivo extra).
 */

const LARGURA_FOTO = 600;
const ALTURA_FOTO = 750;

/**
 * Foto do produto recortada em 4:5 num canvas (respeitando o ponto de
 * interesse salvo no painel) antes de ir para a GPU: uma foto de 2000 px vira
 * uma textura de 600×750 — o suficiente para o tamanho do objeto, e barata
 * para a memória de um celular intermediário.
 * Se a imagem não puder ser usada pelo WebGL (servidor sem CORS, 404), devolve
 * `null` e o objeto não aparece; o resto da cena continua.
 */
export function useTexturaDaFoto(url: string | undefined, focoX = 50, focoY = 50, escala = 1) {
  const gl = useThree((s) => s.gl);
  const [textura, setTextura] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    let criada: THREE.Texture | null = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (!vivo || !img.naturalWidth) return;
      const L = Math.round(LARGURA_FOTO * escala);
      const A = Math.round(ALTURA_FOTO * escala);
      const canvas = document.createElement("canvas");
      canvas.width = L;
      canvas.height = A;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const fator = Math.max(L / img.naturalWidth, A / img.naturalHeight);
      const w = img.naturalWidth * fator;
      const h = img.naturalHeight * fator;
      ctx.drawImage(img, (L - w) * (focoX / 100), (A - h) * (focoY / 100), w, h);
      criada = new THREE.CanvasTexture(canvas);
      criada.colorSpace = THREE.SRGBColorSpace;
      criada.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
      setTextura(criada);
    };
    img.src = url;
    return () => {
      vivo = false;
      img.onload = null;
      criada?.dispose();
    };
  }, [url, focoX, focoY, escala, gl]);

  return url ? textura : null;
}

/**
 * Verso para produto de uma foto só: uma etiqueta de loja (tag de roupa) com a
 * marca, o nome e o preço — girar a peça mostra algo com sentido em vez de
 * uma foto espelhada.
 */
export function useTexturaEtiqueta(nome: string, preco: string, ativa: boolean) {
  const [textura, setTextura] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!ativa) return;
    let vivo = true;
    let criada: THREE.Texture | null = null;
    const desenhar = () => {
      if (!vivo) return;
      const L = LARGURA_FOTO;
      const A = ALTURA_FOTO;
      const canvas = document.createElement("canvas");
      canvas.width = L;
      canvas.height = A;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const fundo = ctx.createLinearGradient(0, 0, 0, A);
      fundo.addColorStop(0, "#1c1c1c");
      fundo.addColorStop(1, "#050505");
      ctx.fillStyle = fundo;
      ctx.fillRect(0, 0, L, A);
      const brilho = ctx.createRadialGradient(L / 2, A * 0.1, 0, L / 2, A * 0.1, A * 0.7);
      brilho.addColorStop(0, "rgba(245,196,0,0.22)");
      brilho.addColorStop(1, "rgba(245,196,0,0)");
      ctx.fillStyle = brilho;
      ctx.fillRect(0, 0, L, A);

      ctx.strokeStyle = "rgba(245,196,0,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, L - 56, A - 56);
      // Furo da etiqueta.
      ctx.beginPath();
      ctx.arc(L / 2, 92, 22, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.strokeStyle = "#f5c400";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#f5c400";
      ctx.font = '120px "Bebas Neue", Impact, sans-serif';
      ctx.fillText("INOVAÇÃO", L / 2, 290);
      ctx.font = '38px "Bebas Neue", Impact, sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("S  T  O  R  E", L / 2, 340);

      ctx.fillStyle = "#fff";
      ctx.font = '60px "Bebas Neue", Impact, sans-serif';
      const palavras = nome.toUpperCase().split(/\s+/);
      const linhas: string[] = [];
      let linha = "";
      for (const p of palavras) {
        const teste = linha ? `${linha} ${p}` : p;
        if (ctx.measureText(teste).width > L - 120 && linha) {
          linhas.push(linha);
          linha = p;
        } else {
          linha = teste;
        }
      }
      if (linha) linhas.push(linha);
      linhas.slice(0, 3).forEach((l, i) => ctx.fillText(l, L / 2, 470 + i * 62));

      ctx.fillStyle = "#f5c400";
      ctx.font = 'bold 54px "Inter", Arial, sans-serif';
      ctx.fillText(preco, L / 2, A - 90);

      criada = new THREE.CanvasTexture(canvas);
      criada.colorSpace = THREE.SRGBColorSpace;
      setTextura(criada);
    };
    // A etiqueta usa as fontes da loja: espera elas estarem prontas.
    Promise.all([document.fonts.load('120px "Bebas Neue"'), document.fonts.load('bold 54px "Inter"')])
      .catch(() => undefined)
      .then(desenhar);
    return () => {
      vivo = false;
      criada?.dispose();
    };
  }, [nome, preco, ativa]);

  return ativa ? textura : null;
}

/** Degradê radial branco→transparente: halo aditivo e sombra projetada falsa. */
export function texturaRadial(centro = 1, meio = 0.35) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(255,255,255,${centro})`);
  g.addColorStop(0.4, `rgba(255,255,255,${meio})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Plano de cantos arredondados com UV de 0 a 1 (o `ShapeGeometry` usa as coordenadas da forma). */
export function retanguloArredondado(l: number, a: number, r: number) {
  const x = -l / 2;
  const y = -a / 2;
  const forma = new THREE.Shape();
  forma.moveTo(x + r, y);
  forma.lineTo(x + l - r, y);
  forma.quadraticCurveTo(x + l, y, x + l, y + r);
  forma.lineTo(x + l, y + a - r);
  forma.quadraticCurveTo(x + l, y + a, x + l - r, y + a);
  forma.lineTo(x + r, y + a);
  forma.quadraticCurveTo(x, y + a, x, y + a - r);
  forma.lineTo(x, y + r);
  forma.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ShapeGeometry(forma, 8);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x) / l, (pos.getY(i) - y) / a);
  return geo;
}
