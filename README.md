# Inovação Store

Site de e-commerce para loja de roupas masculinas, construído com **React + TypeScript + Vite**, mobile-first e responsivo para celular, tablet e desktop.

## Stack

- React 19 + TypeScript + Vite
- React Router (rotas amigáveis: `/categoria/:slug`, `/produto/:slug`, etc.)
- Tailwind CSS v4
- Framer Motion (animações sutis de entrada e transições)
- Lucide React (ícones)

## Rodando o projeto

```bash
npm install
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção (gera pasta dist/)
npm run preview   # pré-visualiza o build de produção
```

## Estrutura

- `src/data/` — configuração da loja, catálogo de produtos, categorias e depoimentos (mock, fácil de editar ou trocar por uma API/CMS real).
- `src/context/` — carrinho (`CartContext`, persistido em `localStorage`) e conta do cliente (`AuthContext`, demonstrativo, também em `localStorage`).
- `src/components/` — componentes de layout, produto, home e UI.
- `src/pages/` — páginas roteadas (Home, categoria, busca, produto, carrinho, checkout, políticas, sobre).
- `src/lib/` — utilitários (formatação de preço/parcelamento, cálculo de frete simulado, cupons).

## O que é simulado (mock) e precisa de integração real antes de ir ao ar

- **Frete**: o cálculo por CEP (`src/lib/shipping.ts`) é uma simulação determinística local, para demonstrar a UX. Substitua por uma integração real (Correios, Melhor Envio, etc.).
- **Pagamento**: o checkout (`src/pages/CheckoutPage.tsx`) tem UI completa para Pix, cartão e boleto, mas não processa pagamento de verdade — é necessário integrar um gateway (Mercado Pago, Pagar.me, Stripe etc.).
- **Conta do cliente**: login/cadastro funcionam apenas no navegador (`localStorage`), sem backend. Para produção, use um backend de autenticação real.
- **Newsletter**: o cadastro de e-mail apenas simula sucesso; conecte a uma ferramenta de e-mail marketing (Mailchimp, RD Station etc.) ou a um backend próprio.

## Dados de contato a revisar

Em `src/data/store.ts`:

- `contact.whatsapp` / `contact.whatsappDisplay` — número de WhatsApp (placeholder, atualize com o número real da loja).
- `contact.email` — e-mail de contato (placeholder).
- `address` — endereço da loja (já preenchido com o endereço informado).
- `social.instagram` — perfil do Instagram (já preenchido: `@inovacaostore__`).

## Sobre as imagens e nomes de produtos

As fotos usadas em `src/assets/images/` vêm do acervo enviado da loja. Como parte do catálogo fotografado mostra estampas com marcas de terceiros (ex.: réplicas/paródias não-oficiais), os nomes e descrições dos produtos no site foram escritos de forma **genérica** (cor, corte, estilo), sem atribuir marca, para não sugerir autenticidade de produtos de marca registrada. Ajuste os nomes/descrições conforme a real natureza do produto vendido.

As categorias **Camisas**, **Jaquetas** e **Acessórios** usam cartões de "em breve" (sem foto real), pois não havia fotos dessas peças no material enviado — troque pelas fotos reais quando disponíveis (basta adicionar a imagem em `src/assets/images/` e referenciá-la em `src/data/products.ts`).

## SEO

- Meta tags dinâmicas por página (`src/components/seo/Seo.tsx`) e dados estruturados (JSON-LD) para loja e produtos.
- `public/robots.txt` e `public/sitemap.xml` incluídos (atualize a URL do domínio real no sitemap após o deploy).
- Como é uma SPA (sem SSR), para SEO ideal considere pré-renderização (ex.: `vite-plugin-ssr`, Astro ou prerender.io) ao publicar.
