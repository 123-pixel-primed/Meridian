// AI visibility check: are we recommended when guests ask an AI assistant?
// GET ?client=id[&run=1]  latest results. A new check starts when there is none or the last is a month old; staff can run one any time.
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { internalKey } from '../lib/internal.mjs';

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const store = getStore({ name: 'visibility', consistency: 'strong' });
  let V = (await store.get(cid, { type: 'json' })) || { runs: [] };
  const last = V.runs[0], running = V.status === 'running' && Date.now() - new Date(V.startedAt || 0).getTime() < 20 * 60000;
  const due = !last || Date.now() - new Date(last.at).getTime() > 30 * 86400000;
  if (!running && process.env.ANTHROPIC_API_KEY && ((due && V.status !== 'failed') || (url.searchParams.get('run') && sess.admin) || (V.status === 'failed' && url.searchParams.get('retry')))) {
    V.status = 'running'; V.startedAt = new Date().toISOString(); V.error = null;
    await store.setJSON(cid, V);
    await fetch(url.origin + '/.netlify/functions/visibility-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid }) }).catch(() => {});
  }
  return Response.json({ status: V.status || 'none', error: sess.admin ? V.error : (V.error ? 'The check could not finish' : null), questions: V.questions || [], latest: V.runs[0] || null,
    history: V.runs.slice(0, 6).map(r => ({ at: r.at, named: r.named, total: r.total })), admin: !!sess.admin }, { headers: { 'Cache-Control': 'no-store' } });
};
