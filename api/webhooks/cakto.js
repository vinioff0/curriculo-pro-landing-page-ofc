// Vercel Serverless Function — POST /api/webhooks/cakto
// Recebe eventos da Cakto, valida o secret (enviado no corpo) e grava apenas dados mínimos.
// Env: CAKTO_WEBHOOK_SECRET, CAKTO_PRODUCT_IDS (opcional, separados por vírgula),
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createHash, timingSafeEqual } from 'node:crypto';

const sha = v => createHash('sha256').update(String(v)).digest('hex');
const safeEq = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
};

async function upsert(row) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/purchase_events?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error('supabase ' + r.status);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ ok: false, error: 'webhook_not_configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const provided = body.secret || req.headers['x-cakto-secret'];
  if (!safeEq(provided, secret)) return res.status(401).json({ ok: false });

  const event = body.event;
  const items = Array.isArray(body.data) ? body.data : [body.data].filter(Boolean);
  const allowed = (process.env.CAKTO_PRODUCT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

  try {
    for (const d of items) {
      if (!d || !d.id) continue;
      const productId = d.product?.id || d.offer?.product || null;
      if (allowed.length && !allowed.includes(productId)) continue;
      const id = sha(d.id);

      if (event === 'purchase_approved' && (!d.status || d.status === 'paid')) {
        const t = new Date(d.paidAt || d.paid_at || d.createdAt || Date.now());
        await upsert({ id, product_id: productId, status: 'confirmed', confirmed_at: isNaN(t) ? new Date().toISOString() : t.toISOString() });
      } else if (event === 'refund' || event === 'chargeback') {
        await upsert({ id, product_id: productId, status: 'revoked', confirmed_at: new Date().toISOString() });
      }
    }
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
}
