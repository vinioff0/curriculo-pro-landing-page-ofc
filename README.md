# Currículo Pro — Landing Page

Página de vendas do Currículo Pro (HTML estático + funções serverless na Vercel).

## Estrutura
- `index.html` — landing page completa (desktop + mobile), já com checkout Cakto e Meta Pixel.
- `api/webhooks/cakto.js` — recebe eventos de pagamento da Cakto.
- `api/public/recent-purchases.js` — endpoint público e minimizado para as notificações de compra.
- `supabase/migrations/` — tabela `purchase_events`.
- `docs/notificacoes-compras.md` — passo a passo da integração.

## Deploy na Vercel
Importe o repositório na Vercel (Framework: Other, sem build). Variáveis opcionais para as notificações de compra:
`CAKTO_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN`, `CAKTO_PRODUCT_IDS`.
