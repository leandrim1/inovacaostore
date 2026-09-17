# Inovação Store

E-commerce completo para loja de roupas masculinas: frontend em **React + TypeScript + Vite** (mobile-first) integrado a um **backend real** (Express + Prisma + Postgres) com autenticação de administrador, painel administrativo e banco de dados — sem produtos fixos no código. Preparado para publicar **100% na Vercel** (frontend + API serverless + Postgres + upload de imagens), mas também roda como processo único em qualquer outro host (VPS, Railway, Render).

## Stack

**Frontend**
- React 19 + TypeScript + Vite
- React Router (rotas amigáveis: `/categoria/:slug`, `/produto/:slug`, etc.)
- TanStack React Query (consumo da API, cache e invalidação)
- Tailwind CSS v4
- Framer Motion (animações sutis)
- Lucide React (ícones)

**Backend**
- Node.js + Express + TypeScript (executado com `tsx` em dev; roda como função serverless na Vercel via `api/index.ts`)
- Prisma ORM + PostgreSQL
- Autenticação de administrador via JWT em cookie `httpOnly` + bcrypt
- Upload de imagens de produto (multer): vai para o **Vercel Blob** quando configurado, ou para `server/uploads/` em desenvolvimento local sem Blob (ver `server/src/storage.ts`)

## Rodando o projeto localmente

Precisa de um Postgres para desenvolvimento (local via Docker/instalação nativa, ou um banco na nuvem — inclusive o mesmo que você for usar na Vercel).

```bash
npm install
cp .env.example .env
# edite o .env: DATABASE_URL e DIRECT_URL apontando para o seu Postgres
# (para dev local sem Vercel, deixe as duas iguais)

npm run db:migrate          # aplica as migrations no Postgres
npm run db:seed             # popula categorias, catálogo inicial e usuário admin

npm run dev                 # roda frontend (Vite) + backend (Express) juntos
```

- Loja: http://localhost:5173
- Painel admin: http://localhost:5173/admin (login criado pelo seed — veja `.env`)
- API: http://localhost:4000 (o Vite faz proxy de `/api` e `/uploads` para o backend em desenvolvimento)
- Sem `BLOB_READ_WRITE_TOKEN` no `.env`, upload de imagem cai automaticamente para `server/uploads/` local — não precisa de conta na Vercel só para desenvolver.

Outros scripts úteis:

```bash
npm run dev:client        # só o frontend (Vite)
npm run dev:server        # só o backend (Express, com watch)
npm run db:studio         # abre o Prisma Studio para inspecionar o banco visualmente
npm run db:migrate:deploy # aplica migrations já existentes sem criar uma nova (usado em produção)
npm run build             # build de produção do frontend (gera dist/)
npm run preview           # pré-visualiza o build do frontend isoladamente
```

## Publicando na Vercel

1. **Suba o código para um repositório Git** (GitHub/GitLab/Bitbucket) e importe-o em [vercel.com/new](https://vercel.com/new). A Vercel detecta o Vite automaticamente.
2. **Crie o banco**: na aba **Storage** do projeto na Vercel, clique em **Create Database → Postgres**. Isso já injeta as variáveis de conexão no projeto (não precisa copiar/colar nada).
3. **Crie o storage de imagens**: ainda em **Storage**, **Create → Blob**. Isso injeta `BLOB_READ_WRITE_TOKEN` automaticamente.
4. **Configure as variáveis de ambiente** do projeto (aba **Settings → Environment Variables**):
   - `DATABASE_URL` → cole o valor de `POSTGRES_PRISMA_URL` (conexão *pooled*, gerado pela Vercel no passo 2).
   - `DIRECT_URL` → cole o valor de `POSTGRES_URL_NON_POOLING` (conexão direta, usada só para migrations).
   - `JWT_SECRET` → uma string longa e aleatória (ex.: `openssl rand -hex 32`).
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` → usadas pelo `db:seed` para criar o primeiro admin.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME` → envio real dos e-mails de verificação de cadastro e redefinição de senha dos clientes (veja `.env.example` para instruções de como gerar uma senha de app do Gmail).
   - `NODE_ENV=production` (a Vercel já define isso automaticamente em produção, não precisa adicionar).
5. **Rode as migrations e o seed uma vez**, apontando para o banco de produção. O jeito mais simples é puxar as variáveis para a sua máquina:
   ```bash
   npx vercel link          # conecta esta pasta ao projeto criado na Vercel
   npx vercel env pull .env.production.local
   npx dotenv -e .env.production.local -- npm run db:migrate:deploy
   npx dotenv -e .env.production.local -- npm run db:seed
   ```
6. **Deploy**: `npx vercel --prod`, ou simplesmente faça push no branch conectado — a Vercel builda e publica sozinha a cada push.

Depois disso a loja, o painel admin e a API inteira funcionam no domínio da Vercel, sem servidor separado. Detalhes técnicos de como isso funciona:

- `api/index.ts` exporta o mesmo app Express usado em desenvolvimento como uma função serverless; `vercel.json` redireciona `/api/*` para essa função e todo o resto para o app React (SPA).
- `server/src/db.ts` reaproveita a conexão do Prisma entre invocações da função (evita esgotar o limite de conexões do Postgres); por isso o uso da *pooled connection* (`DATABASE_URL`/`POSTGRES_PRISMA_URL`) é importante.
- `server/src/storage.ts` decide sozinho entre Vercel Blob (produção) e disco local (dev) com base na presença de `BLOB_READ_WRITE_TOKEN` — nenhum código de rota precisa saber a diferença.

### Rodando fora da Vercel (VPS, Railway, Render — processo único)

Com `NODE_ENV=production` e sem a variável `VERCEL` definida, o próprio servidor Express também serve os arquivos estáticos do frontend (pasta `dist/`) e faz o fallback de rotas para o `index.html`, então um único processo atende loja + painel + API:

```bash
npm run build
NODE_ENV=production npx tsx server/src/index.ts
```

Nesse cenário, se não configurar `BLOB_READ_WRITE_TOKEN`, o upload de imagens usa o disco do próprio servidor — funciona desde que o host tenha disco persistente (é o caso de uma VPS/Railway/Render, mas não da Vercel).

## Credenciais do administrador (seed)

Definidas em `.env` (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) e criadas pelo `npm run db:seed`. **Troque a senha padrão antes de publicar o site.** Não há tela de "esqueci minha senha"; para trocar a senha, gere um novo hash com bcrypt e atualize o registro em `AdminUser` (via `npm run db:studio` ou uma migration).

## Estrutura

```
api/
  index.ts               # entrada da função serverless da Vercel (reexporta o app Express)

vercel.json               # rewrites de /api/* para a função serverless e fallback de SPA

server/
  prisma/schema.prisma   # modelos: Category, Product, ProductImage, ProductVariant, Customer,
                          # EmailVerification, PasswordReset, Order, OrderItem, AdminUser, SiteSettings
  prisma/seed.ts         # popula categorias, catálogo inicial e o usuário admin
  src/app.ts             # monta o app Express (rotas, middlewares) sem chamar listen()
  src/index.ts           # entrada de desenvolvimento local: importa app.ts e chama listen()
  src/storage.ts         # upload/remoção de imagem: Vercel Blob ou disco local, conforme o ambiente
  src/email.ts            # envio real de e-mail via SMTP (nodemailer)
  src/emailTemplates.ts   # HTML dos e-mails de verificação e redefinição de senha
  src/customerAuth.ts     # JWT do cliente (cookie), geração/hash de código e token
  src/routes/            # rotas públicas (produtos, categorias, pedidos, frete, cupons, conta do cliente)
  src/routes/admin/      # rotas protegidas (CRUD de produtos/categorias, pedidos, dashboard)
  src/middleware/        # requireAdmin e requireCustomerAuth/requireVerifiedCustomer (validam o cookie JWT)
  uploads/                # imagens de produto em disco local (dev sem Vercel Blob configurado)

src/
  lib/api.ts              # cliente fetch (credentials: "include" para os cookies de sessão)
  lib/adapters.ts          # converte a resposta da API para o formato usado pelos componentes
  hooks/                   # dados públicos (useProducts, useProduct, useCategories, useMyOrders)
  hooks/admin/             # dados do painel (produtos, categorias, pedidos, dashboard)
  context/CartContext.tsx  # carrinho (localStorage) referenciando variantId real do banco
  context/AuthContext.tsx  # sessão real do cliente na loja (checa /api/account/me no backend)
  context/AdminAuthContext.tsx # sessão do admin (checa /api/admin/auth/me no backend)
  routes/ProtectedRoute.tsx # bloqueia rotas que exigem login (e, opcionalmente, e-mail verificado)
  pages/admin/             # painel administrativo (login, dashboard, produtos, categorias, pedidos)
  pages/                   # páginas da loja (Home, categoria, produto, carrinho, checkout, login,
                            # cadastro, verificar-email, esqueci/redefinir senha, minha conta, meus pedidos…)
```

## Como funciona o catálogo (sem dados fixos no frontend)

Nenhum produto ou categoria está hardcoded no frontend. Tudo vem do banco via API:

- **Home** busca produtos em destaque (`featured: true`) e categorias reais para montar a vitrine.
- **Categoria/Busca** buscam produtos filtrando por categoria/termo; os filtros de tamanho, cor e preço são aplicados no cliente sobre o resultado já vindo do banco.
- **Página do produto** carrega pelo slug (`GET /api/products/:slug`), com estoque **por variação** (cor + tamanho) controlando o que pode ser adicionado ao carrinho.
- Produtos marcados como **ocultos** no painel (`active: false`) somem da loja automaticamente; produtos novos aparecem assim que criados, sem precisar alterar código.

## Pedidos e estoque

No checkout, o frontend envia os itens do carrinho (por `variantId`) para `POST /api/orders`. O backend, em uma transação:

1. Recalcula o frete a partir do CEP (não confia no valor vindo do cliente).
2. Revalida o cupom, se houver.
3. Confere e decrementa o estoque de cada variação de forma atômica — se o estoque não for suficiente, o pedido é rejeitado com erro claro e nada é debitado.
4. Cria/reaproveita o cliente pelo e-mail, grava o pedido e os itens.

O administrador acompanha e atualiza o status do pedido (`pendente → pago → separação → enviado → entregue`, ou `cancelado`) em `/admin/pedidos`.

## Painel administrativo (`/admin`)

Protegido por autenticação real no backend (não é apenas uma tela escondida no frontend — todas as rotas `/api/admin/*` exigem o cookie de sessão válido, verificado no servidor). Permite:

- Produtos: criar, editar, excluir, ocultar/reativar, definir preço e preço promocional, categoria, destaque, etiquetas, características, imagens (upload/remoção) e variações (cor, tamanho, estoque e SKU por variação).
- Categorias: criar, editar e excluir.
- Pedidos: visualizar detalhes e atualizar o status.
- Dashboard: contagem de produtos ativos, pedidos pendentes, categorias e variações com estoque baixo.

Excluir um produto que já tem pedidos associados é bloqueado (para não perder o histórico) — use "ocultar" nesse caso. Da mesma forma, remover uma variação existente no formulário apenas zera o estoque dela, em vez de apagá-la.

## Autenticação de clientes

Sistema completo e real (não é uma tela mockada): cadastro, confirmação de e-mail por código, login, logout, recuperação de senha e proteção do checkout — tudo com backend, banco de dados, hash de senha e sessão via cookie `httpOnly`.

- **Cadastro** (`/cadastro`): nome, e-mail e senha (mínimo 8 caracteres, com letra e número). A senha é armazenada com hash `bcrypt`, nunca em texto puro. Um código de 6 dígitos é gerado, armazenado com hash (`sha256`) e prazo de expiração de 15 minutos, e enviado por e-mail de verdade.
- **Confirmação de e-mail** (`/verificar-email`): o cliente digita o código recebido. Há limite de 5 tentativas por código e de 5 reenvios por hora (com intervalo mínimo de 60s entre eles).
- **Login/logout** (`/login`): sessão via cookie `httpOnly` assinado com JWT (30 dias), no mesmo padrão usado pelo admin. Se o e-mail ainda não foi confirmado, o cliente é encaminhado para `/verificar-email` automaticamente.
- **Recuperação de senha** (`/esqueci-senha` → `/redefinir-senha`): gera um token de uso único (hash `sha256`, expira em 60 minutos) e envia um link por e-mail. A resposta da API é sempre genérica, para não revelar se um e-mail está cadastrado.
- **Checkout protegido**: `/checkout` exige sessão autenticada **e** e-mail verificado — o backend confere isso de novo no servidor (`requireVerifiedCustomer`), nunca confiando apenas na checagem feita no React. Sem isso, o cliente é redirecionado para `/login?redirect=/checkout` (ou para `/verificar-email`) e volta automaticamente para o checkout depois de entrar. O carrinho (guardado no `localStorage`) não se perde durante esse fluxo.
- **Minha conta** (`/minha-conta`) e **Meus pedidos** (`/meus-pedidos`): rotas protegidas; a API de pedidos (`/api/account/orders`) sempre filtra pelo cliente da sessão — nunca por um ID vindo do frontend, então um cliente não consegue ver pedidos de outra conta.
- **E-mails reais**: enviados via SMTP (`nodemailer`, funciona com Gmail ou qualquer outro provedor) configurado por variáveis de ambiente — veja `.env.example`.

## O que ainda é simulado e precisa de integração real antes de ir ao ar

- **Pagamento**: o checkout tem UI completa para Pix, cartão e boleto, mas não processa pagamento de verdade — falta integrar um gateway (Mercado Pago, Pagar.me, Stripe etc.) que confirme o pagamento e atualize o status do pedido.
- **Frete**: o cálculo por CEP (`server/src/shipping.ts`) é uma fórmula determinística local, para demonstrar a UX de ponta a ponta. Substitua por uma integração real (Correios, Melhor Envio, etc.).
- **Newsletter**: o cadastro de e-mail apenas simula sucesso; conecte a uma ferramenta de e-mail marketing ou a um backend próprio.
- **E-mail de confirmação de pedido**: os e-mails de autenticação (verificação/redefinição de senha) já são reais, mas ainda não existe um e-mail transacional de "pedido confirmado" — a confirmação ao cliente acontece na tela e, opcionalmente, via WhatsApp.

## Dados de contato a revisar

Em `src/data/store.ts`:

- `contact.whatsapp` / `contact.whatsappDisplay` — número de WhatsApp (placeholder, atualize com o número real da loja).
- `contact.email` — e-mail de contato (placeholder).
- `address` — endereço da loja (já preenchido com o endereço informado).
- `social.instagram` — perfil do Instagram (já preenchido: `@inovacaostore__`).

## Sobre as imagens e nomes de produtos

As fotos usadas em `server/uploads/` (catálogo inicial) e `src/assets/images/` (banner, seção "Siga no Instagram") vêm do acervo enviado da loja. Como parte do catálogo fotografado mostra estampas com marcas de terceiros (ex.: réplicas/paródias não-oficiais), os nomes e descrições dos produtos foram escritos de forma **genérica** (cor, corte, estilo), sem atribuir marca, para não sugerir autenticidade de produtos de marca registrada. Ajuste os nomes/descrições pelo próprio painel administrativo conforme a real natureza de cada produto.

As categorias **Camisas**, **Jaquetas** e **Acessórios** vêm com produtos cadastrados porém **ocultos** (sem foto real), pois não havia fotos dessas peças no material enviado — edite-os no painel para adicionar fotos reais e reativá-los.

## SEO

- Meta tags dinâmicas por página (`src/components/seo/Seo.tsx`) e dados estruturados (JSON-LD) para loja e produtos.
- `public/robots.txt` e `public/sitemap.xml` incluídos (atualize a URL do domínio real no sitemap após o deploy).
- Como é uma SPA (sem SSR), para SEO ideal considere pré-renderização (ex.: `vite-plugin-ssr`, Astro ou prerender.io) ao publicar.
