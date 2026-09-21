import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    plugins: [react(), tailwindcss()],

    // O @vitejs/plugin-react configura o JSX como "automatic" mas não define
    // `development`; quem decide isso é o Vite, a partir de `NODE_ENV` lida
    // ANTES de este arquivo ser carregado. Como nem `npm run build` nem o
    // build da Vercel definem essa variável, o app inteiro saía compilado com
    // o JSX runtime de DESENVOLVIMENTO: ~190 KB a mais no chunk de entrada,
    // checagens extras a cada render, os caminhos dos arquivos-fonte
    // embutidos no bundle e o StrictMode repetindo os efeitos (era daí a
    // chamada duplicada de /api/account/me na home).
    //
    // Fixar aqui resolve sem depender de variável de ambiente, em qualquer
    // sistema operacional e em qualquer CI. No servidor de desenvolvimento
    // continua valendo o runtime de dev, que é o que o Fast Refresh usa.
    // Só no build: em desenvolvimento a configuração do plugin precisa passar
    // intacta (ela carrega o `refresh` do Fast Refresh), senão o HMR quebra.
    ...(isBuild ? { oxc: { jsx: { development: false } } } : {}),

    // Pelo mesmo motivo, o próprio react-dom continuava caindo no ramo de
    // desenvolvimento: ele escolhe entre a versão com avisos e a versão
    // enxuta lendo `process.env.NODE_ENV` no momento do bundle. Sem esta
    // substituição explícita, a loja publicada carregava o React com todas
    // as validações e mensagens de erro de desenvolvimento ligadas.
    define: isBuild ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},

    // Em desenvolvimento o Vite serve o front e repassa a API para o Express
    // na 4000. Na Vercel isso não existe: lá o front é estático e /api cai na
    // função serverless por causa do rewrite do vercel.json.
    server: {
      proxy: {
        '/api': 'http://localhost:4000',
        '/uploads': 'http://localhost:4000',
      },
    },
  }
})
