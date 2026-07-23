# AGENTS.md

## Cursor Cloud specific instructions

CurrículoJá é um SPA React + Vite + TypeScript (Tailwind v4). Não há backend separado: as
funções serverless em `api/*.js` (Mercado Pago) são servidas em dev pelo plugin Vite
`vite.mp-api.ts`, então `npm run dev` sobe tudo em um único processo.

- Dev server: `npm run dev` → http://localhost:5173/ (Vite já usa `host: true` e
  `allowedHosts: true`). Lint: `npm run lint` (oxlint). Build: `npm run build` (`tsc -b && vite build`).
- Modo demo (padrão): sem chaves de API o app roda 100% local. Não são necessários secrets
  para desenvolver/testar. Login local aceita qualquer e-mail + senha com 4+ caracteres;
  e-mail começando com `admin` (ou o super-admin) vira admin. Pagamento Mercado Pago é simulado.
- Chaves opcionais habilitam integrações reais (só preencher no `.env` se for testá-las):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (auth/persistência), `VITE_OPENROUTER_API_KEY`
  (IA Gemini), `VITE_MERCADOPAGO_PUBLIC_KEY` + `MERCADOPAGO_ACCESS_TOKEN` (checkout real).
- Rotas `/criar`, `/pagamento`, `/meus-curriculos`, `/admin` exigem login (`RequireAuth`).
  Para testar criação de currículo, faça login antes de acessar `/criar`.
