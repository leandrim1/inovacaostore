# Inovação Store

E-commerce completo para loja de roupas masculinas: frontend em **React + TypeScript + Vite** (mobile-first) integrado a um **backend real** (Express + Prisma + SQLite) com autenticação de administrador, painel administrativo e banco de dados — sem produtos fixos no código.

## Stack

**Frontend**
- React 19 + TypeScript + Vite
- React Router (rotas amigáveis: `/categoria/:slug`, `/produto/:slug`, etc.)
- TanStack React Query (consumo da API, cache e invalidação)
- Tailwind CSS v4
- Framer Motion (animações sutis)
- Lucide React (ícones)

**Backend**
- Node.js + Express + TypeScript (executado com `tsx`)
- Prisma ORM + SQLite (arquivo local, fácil de trocar por Postgres/MySQL no `schema.prisma`)
- Autenticação de administrador via JWT em cookie `httpOnly` + bcrypt
- Upload de imagens de produto (multer), servidas em `/uploads`

## Rodando o projeto

```bash
npm install
cp .env.example .env        # ajuste os valores se quiser (JWT_SECRET, admin, etc.)
npm run db:migrate          # cria o banco SQLite e aplica as migrations
npm run db:seed             # popula categorias, catálogo inicial e usuário admin

npm run dev                 # roda frontend (Vite) + backend (Express) juntos
```

- Loja: http://localhost:5173
- Painel admin: http://localhost:5173/admin (login criado pelo seed — veja `.env`)
- API: http://localhost:4000 (o Vite faz proxy de `/api` e `/uploads` para o backend em desenvolvimento)

Outros scripts úteis:

```bash
npm run dev:client   # só o frontend (Vite)
npm run dev:server   # só o backend (Express, com watch)
npm run db:studio    # abre o Prisma Studio para inspecionar o banco visualmente
npm run build        # build de produção do frontend (gera dist/)
npm run preview      # pré-visualiza o build do frontend isoladamente
```

### Rodando em "produção" (um único processo)

Com `NODE_ENV=production`, o servidor Express também serve os arquivos estáticos do frontend (pasta `dist/`) e faz o fallback de rotas para o `index.html`, então um único processo atende loja + painel + API:

```bash
npm run build
NODE_ENV=production npx tsx server/src/index.ts
```

## Credenciais do administrador (seed)

Definidas em `.env` (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) e criadas pelo `npm run db:seed`. **Troque a senha padrão antes de publicar o site.** Não há tela de "esqueci minha senha"; para trocar a senha, gere um novo hash com bcrypt e atualize o registro em `AdminUser` (via `npm run db:studio` ou uma migration).

## Estrutura

```
server/
  prisma/schema.prisma   # modelos: Category, Product, ProductImage, ProductVariant,
                          # Customer, Order, OrderItem, AdminUser
  prisma/seed.ts         # popula categorias, catálogo inicial e o usuário admin
  src/routes/            # rotas públicas (produtos, categorias, pedidos, frete, cupons)
  src/routes/admin/      # rotas protegidas (CRUD de produtos/categorias, pedidos, dashboard)
  src/middleware/        # requireAdmin (valida o cookie JWT)
  uploads/                # imagens de produto enviadas pelo painel (servidas em /uploads)

src/
  lib/api.ts              # cliente fetch (credentials: "include" para o cookie de admin)
  lib/adapters.ts          # converte a resposta da API para o formato usado pelos componentes
  hooks/                   # dados públicos (useProducts, useProduct, useCategories)
  hooks/admin/             # dados do painel (produtos, categorias, pedidos, dashboard)
  context/CartContext.tsx  # carrinho (localStorage) referenciando variantId real do banco
  context/AuthContext.tsx  # conta do cliente na loja (demonstrativo, localStorage — ver nota abaixo)
  context/AdminAuthContext.tsx # sessão do admin (checa /api/admin/auth/me no backend)
  pages/admin/             # painel administrativo (login, dashboard, produtos, categorias, pedidos)
  pages/                   # páginas da loja (Home, categoria, busca, produto, carrinho, checkout…)
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

## O que ainda é simulado e precisa de integração real antes de ir ao ar

- **Pagamento**: o checkout tem UI completa para Pix, cartão e boleto, mas não processa pagamento de verdade — falta integrar um gateway (Mercado Pago, Pagar.me, Stripe etc.) que confirme o pagamento e atualize o status do pedido.
- **Frete**: o cálculo por CEP (`server/src/shipping.ts`) é uma fórmula determinística local, para demonstrar a UX de ponta a ponta. Substitua por uma integração real (Correios, Melhor Envio, etc.).
- **Conta do cliente** (login/cadastro na loja, diferente do admin): continua sendo apenas uma demonstração no `localStorage`, sem backend — não é o foco deste projeto, mas pode futuramente reaproveitar o mesmo padrão de autenticação do admin.
- **Newsletter**: o cadastro de e-mail apenas simula sucesso; conecte a uma ferramenta de e-mail marketing ou a um backend próprio.
- **E-mail transacional**: não há envio de e-mail de confirmação de pedido; a confirmação ao cliente acontece na tela e, opcionalmente, via WhatsApp.

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
