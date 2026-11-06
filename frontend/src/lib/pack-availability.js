import { STEWARD_URL } from '@/lib/steward';

// One switch for whether a pack is on sale: Steward's. The website, Brew and the owner web app all read and change it there,
// so they always agree. A pack that's switched on still shows unavailable while Steward doesn't have enough tea for it.
const KEY = () => process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

export async function stewardCatalog() {
  if (!KEY()) return null;
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/catalog`, { headers: { 'x-internal-service-key': KEY() }, cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export async function setStewardAvailability(product_id, available, by = 'owner') {
  if (!KEY()) throw new Error('Steward key is not configured on the website');
  const r = await fetch(`${STEWARD_URL}/api/steward/catalog/availability`, {
    method: 'POST', cache: 'no-store',
    headers: { 'x-internal-service-key': KEY(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, available: Boolean(available), by }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.detail || 'Steward did not accept the change');
  return body;
}

// The website used to keep its own on/off switch. Carry any pack that was switched off here across to Steward once,
// so nothing that was unavailable suddenly goes on sale.
export async function carryOverWebsiteSwitches(db, local, live) {
  const byId = new Map((live?.products || []).map(p => [p.product_id, p]));
  for (const p of local) {
    if (p.steward_synced) continue;
    try {
      const there = byId.get(p.product_id);
      if (p.in_stock === false && there && there.enabled !== false) await setStewardAvailability(p.product_id, false, 'website (carried over)');
      await db.collection('products').updateOne({ product_id: p.product_id }, { $set: { steward_synced: true } });
    } catch { /* try again on the next visit */ }
  }
}
