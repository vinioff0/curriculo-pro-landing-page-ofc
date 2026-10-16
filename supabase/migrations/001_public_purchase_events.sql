-- Registro mínimo de compras confirmadas para a notificação pública da landing page.
-- Não guarda nome, e-mail, CPF, telefone nem valores. Apenas um id opaco e o horário.
create table if not exists public.purchase_events (
  id            text primary key,              -- sha256(cakto data.id) — nunca o id bruto
  product_id    text,
  status        text not null default 'confirmed' check (status in ('confirmed','revoked')),
  confirmed_at  timestamptz not null,
  received_at   timestamptz not null default now()
);

create index if not exists purchase_events_recent_idx
  on public.purchase_events (confirmed_at desc) where status = 'confirmed';

-- RLS ligada e sem policies: só a service role (backend) lê/escreve.
alter table public.purchase_events enable row level security;
