# Notificações de compras confirmadas — Currículo Pro

Fluxo: Cakto → `POST /api/webhooks/cakto` (valida o `secret`) → Supabase `purchase_events` → `GET /api/public/recent-purchases` → landing page.

## Setup
1. Rode `supabase/migrations/001_public_purchase_events.sql` no Supabase.
2. Copie `api/` para a raiz do projeto na Vercel (preserve rotas existentes).
3. Variáveis na Vercel: `CAKTO_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGIN`, opcional `CAKTO_PRODUCT_IDS`.
4. Na Cakto, crie o webhook para `https://SEU-DOMINIO/api/webhooks/cakto` com `purchase_approved`, `refund`, `chargeback`.
5. Envie um evento de teste pela Cakto e confira a tabela.
6. Na landing, preencha a prop `purchasesEndpoint` com `https://SEU-DOMINIO/api/public/recent-purchases`.

## Garantias
- Sem endpoint configurado ou sem compras nas últimas 72h → nenhuma notificação.
- Nenhum dado pessoal sai do backend: só id opaco + horário.
- Reembolsos/chargebacks removem a compra da lista.
- Confirme o formato real do payload da sua conta (campos `data.id`, `data.status`, `data.paidAt`) com um evento real.
