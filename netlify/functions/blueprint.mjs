// A client's Growth Blueprint.
// GET ?client=id   the saved Blueprint and whether a new one is being written.
// POST ?client=id  start writing a new one (the work happens in blueprint-background).
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { internalKey } from '../lib/internal.mjs';

export default async (req) => {
  const sess = readSession(req);
  const cid = String(new URL(req.url).searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const store = getStore({ name: 'blueprints', consistency: 'strong' });
  const bp = (await store.get(cid, { type: 'json' })) || null;

  if (req.method === 'POST') {
    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'not set up' }, { status: 503 });
    // One at a time: a request already running in the last 15 minutes is left to finish.
    if (bp && bp.status === 'writing' && Date.now() - new Date(bp.startedAt).getTime() < 15 * 60000) return Response.json({ status: 'writing' });
    await store.setJSON(cid, Object.assign({}, bp || {}, { status: 'writing', startedAt: new Date().toISOString(), error: null }));
    const site = new URL(req.url).origin;
    await fetch(site + '/.netlify/functions/blueprint-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid }) }).catch(() => {});
    return Response.json({ status: 'writing' }, { status: 202 });
  }
  if (!bp) return Response.json({ status: 'none' }, { headers: { 'Cache-Control': 'no-store' } });
  const out = Object.assign({}, bp);
  if (out.current) delete out.current.evidence;
  if (out.baseline) { out.baseline = { date: out.baseline.date, score: out.baseline.score, sections: out.baseline.sections }; }
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
};
