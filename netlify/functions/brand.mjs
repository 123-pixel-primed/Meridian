// A client's brand plan: what makes them memorable, the needs they answer and how first visits become lasting relationships.
// GET ?client=id[&rewrite=1]  the plan (written in the background when new, or again on request)
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { internalKey } from '../lib/internal.mjs';

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const store = getStore({ name: 'brand', consistency: 'strong' });
  let B = await store.get(cid, { type: 'json' });
  if (req.method === 'GET') {
    const again = url.searchParams.get('rewrite') && (!B || B.status !== 'writing' || Date.now() - new Date(B.startedAt || 0).getTime() > 10 * 60000);
    if ((!B || again || (B.status === 'failed' && url.searchParams.get('retry'))) && process.env.ANTHROPIC_API_KEY) {
      B = Object.assign({}, B || {}, { status: B && B.plan ? 'rewriting' : 'writing', startedAt: new Date().toISOString() });
      await store.setJSON(cid, B);
      await fetch(url.origin + '/.netlify/functions/brand-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid }) }).catch(() => {});
    }
    return Response.json({ status: (B && B.status) || 'none', error: sess.admin && B && B.error || undefined, plan: (B && B.plan) || null, at: B && B.at }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json({ error: 'Method' }, { status: 405 });
};
