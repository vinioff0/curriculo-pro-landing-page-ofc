// Vercel Serverless Function — GET /api/public/recent-purchases
// Público e minimizado: só { id opaco, confirmedAt } das compras confirmadas nas últimas 72h.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN (domínio da landing)
import { createHash } from 'node:crypto';

const WINDOW_H = 72, LIMIT = 10;

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '';
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(200).json({ purchases: [] });

  const since = new Date(Date.now() - WINDOW_H * 3600e3).toISOString();
  const q = `select=id,confirmed_at&status=eq.confirmed&confirmed_at=gte.${encodeURIComponent(since)}&order=confirmed_at.desc&limit=${LIMIT}`;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/purchase_events?${q}`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
    });
    if (!r.ok) return res.status(200).json({ purchases: [] });
    const rows = await r.json();
    // Re-hash para o id público não ser igual ao id interno.
    const purchases = rows.map(x => ({ id: createHash('sha256').update('pub:' + x.id).digest('hex').slice(0, 16), confirmedAt: x.confirmed_at }));
    return res.status(200).json({ purchases });
  } catch {
    return res.status(200).json({ purchases: [] });
  }
}
