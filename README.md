# CurrículoJá

SaaS para criar currículo profissional em 2 minutos com IA, pagamento via Mercado Pago e PDF automático.

**Stack:** React · Vite · TypeScript · Tailwind CSS · Supabase · Mercado Pago · OpenRouter (Gemini)

## Funcionalidades

- Landing page de alta conversão
- Formulário completo de currículo (dados, experiências, formação, skills, idiomas)
- IA (OpenRouter / Gemini): correção, palavras-chave e resumo profissional
- Checkout Mercado Pago (R$4,90) + modo demo local
- 10 modelos de PDF com prévia e download
- Upsells: carta, LinkedIn, pacote completo
- Painel admin com métricas e gráficos
- Cupons, afiliados, modo escuro, Meus Currículos, recuperação de senha, WhatsApp
- SEO: meta tags, Open Graph, `sitemap.xml`, `robots.txt`

> Sem chaves de API o app roda em **modo demonstração** (dados locais + pagamento simulado).

## Instalação local

```bash
# 1. Clone e entre na pasta
git clone <seu-repo> curriculoja
cd curriculoja

# 2. Instale dependências
npm install

# 3. Configure o ambiente
cp .env.example .env

# 4. (Opcional) Preencha as variáveis no .env
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_OPENROUTER_API_KEY=
# VITE_MERCADOPAGO_PUBLIC_KEY=

# 5. Suba o servidor
npm run dev
```

Abra `http://localhost:5173`.

### Fluxo demo (sem APIs)

1. Clique em **Criar meu currículo agora** ou **Ver demonstração**
2. Avance os passos (ou use “Preencher com dados de demonstração”)
3. Em **Modelo & IA**, clique em **Melhorar textos com IA** (mock se não houver OpenRouter)
4. Vá ao pagamento — cupons demo: `BEMVINDO10`, `CURRICULO20`, `AFILIADO15`
5. Pague (simulado) → prévia do PDF → download → upsells → página de sucesso
6. Admin: login `admin@curriculoja.com` / `demo1234` → `/admin`

## Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Em **SQL Editor**, execute o arquivo:
   `supabase/migrations/20260323000000_init.sql`
3. Em **Project Settings → API**, copie URL e `anon` key para o `.env`
4. Ative Auth (Email) em Authentication → Providers

Tabelas: `users`, `resumes`, `payments`, `templates`, `upsells`, `analytics`, `coupons`.

## Configurar OpenRouter (Gemini)

1. Crie chave em [openrouter.ai](https://openrouter.ai)
2. Defina `VITE_OPENROUTER_API_KEY` no `.env`
3. O app usa o modelo `google/gemini-2.0-flash-001`

## Configurar Mercado Pago

1. Crie app em [developers.mercadopago.com](https://www.mercadopago.com.br/developers)
2. Frontend: `VITE_MERCADOPAGO_PUBLIC_KEY`
3. Backend (Vercel): `MERCADOPAGO_ACCESS_TOKEN`
4. Opcional: `MP_WEBHOOK_URL=https://seu-dominio.vercel.app/api/webhook`
5. Funções em `/api/create-preference.js` e `/api/webhook.js`

Em desenvolvimento local sem token, o checkout redireciona para a página de sucesso em modo demo.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Oxlint |

## Deploy na Vercel

### Via CLI

```bash
npm i -g vercel
vercel login
vercel          # preview
vercel --prod   # produção
```

### Via Dashboard

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Framework preset: **Vite**
3. Build: `npm run build` · Output: `dist`
4. Adicione as variáveis de ambiente:

| Variável | Escopo |
|----------|--------|
| `VITE_SUPABASE_URL` | Build |
| `VITE_SUPABASE_ANON_KEY` | Build |
| `VITE_OPENROUTER_API_KEY` | Build |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Build |
| `MERCADOPAGO_ACCESS_TOKEN` | Runtime (API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime (webhook) |
| `APP_URL` | Runtime |
| `MP_WEBHOOK_URL` | Runtime |

5. Deploy e teste `/criar` → `/pagamento` → sucesso

O arquivo `vercel.json` já configura SPA fallback + rotas `/api/*`.

## Estrutura

```
src/
  components/   # UI, layout, seções
  pages/        # Rotas
  lib/          # supabase, openrouter, mercadopago, pdf/
  store/        # Zustand (persist)
  data/         # constantes e analytics demo
  types/        # TypeScript
api/            # Serverless Mercado Pago
supabase/       # Migrations SQL
public/         # robots.txt, sitemap.xml, favicon
```

## SEO

Otimizado para: fazer currículo online, currículo profissional, gerar currículo em PDF, currículo para primeiro emprego, currículo com IA.

Atualize o domínio em `index.html`, `public/sitemap.xml` e `public/robots.txt` antes do go-live.

## Licença

Projeto demonstrativo — adapte conforme sua necessidade comercial.
