// A client's guest journey emails.
// GET ?client=id[&rewrite=1]  the journeys (written in the background when new, or again on request)
// POST ?client=id {key}       approve a journey: our team gets a task with every email to set it live
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { internalKey } from '../lib/internal.mjs';
import { mediaUrl } from '../lib/media-sign.mjs';
import { ghl, assignee } from '../lib/ghl.mjs';

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
  if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
  const store = getStore({ name: 'journeys', consistency: 'strong' });
  let J = await store.get(cid, { type: 'json' });

  if (req.method === 'GET') {
    const again = url.searchParams.get('rewrite') && (!J || J.status !== 'writing' || Date.now() - new Date(J.startedAt || 0).getTime() > 10 * 60000);
    if ((!J || again || (J.status === 'failed' && url.searchParams.get('retry'))) && process.env.ANTHROPIC_API_KEY) {
      J = Object.assign({}, J || {}, { status: J && J.journeys ? 'rewriting' : 'writing', startedAt: new Date().toISOString() });
      await store.setJSON(cid, J);
      await fetch(url.origin + '/.netlify/functions/journeys-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid }) }).catch(() => {});
    }
    const images = (rec.files || []).filter(f => /^brand_image_\d+$/.test(f)).sort((a, b) => +a.split('_')[2] - +b.split('_')[2]);
    let n = 0;
    const journeys = ((J && J.journeys) || []).map(j => Object.assign({}, j, { approved: (J.approved || {})[j.key] || null, emails: j.emails.map(e => Object.assign({}, e, { img: images.length ? mediaUrl(url.origin, cid, images[n++ % images.length]) : null })) }));
    return Response.json({ status: (J && J.status) || 'none', error: sess.admin && J && J.error || undefined, journeys }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) {}
    const j = ((J && J.journeys) || []).find(x => x.key === b.key);
    if (!j) return Response.json({ error: 'Journey not found' }, { status: 404 });
    // Wording the client edited on screen comes with the approval.
    const edits = b.edits || {};
    const emails = j.emails.map(e => Object.assign({}, e, edits[e.id] ? { body: String(edits[e.id]).slice(0, 4000) } : {}));
    j.emails = emails;
    const token = process.env.GHL_SANDBOX_TOKEN, loc = process.env.GHL_SANDBOX_LOCATION_ID;
    let taskId = null;
    try {
      const name = (rec.answers || {}).business_name || cid;
      const c = await ghl('/contacts/upsert', token, { method: 'POST', body: { locationId: loc, email: (rec.answers || {}).email, firstName: (rec.answers || {}).first_name, companyName: name } });
      const html = emails.map(e => '<p><b>' + e.when + '</b><br>Subject: ' + e.subject + '<br>' + e.body.replace(/[<>]/g, '').replace(/\n/g, '<br>') + '<br>Button: ' + e.cta + '</p>').join('');
      const t = await ghl('/contacts/' + c.contact.id + '/tasks', token, { method: 'POST', body: { title: 'Set live: ' + j.name + ' journey (' + name + ')', body: '<p>Approved on the Meridian dashboard. Put these emails live in their ' + j.name + ' workflow.</p>' + html, dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), completed: false, assignedTo: await assignee(getStore({ name: 'approvals', consistency: 'strong' }), token, loc) || undefined } });
      taskId = (t.task && t.task.id) || null;
    } catch (e) {}
    J.approved = Object.assign({}, J.approved || {}, { [j.key]: { at: new Date().toISOString(), taskId } });
    await getStore({ name: 'approvals', consistency: 'strong' }).setJSON(cid + '|journey:' + j.key + ':' + Date.now(), { key: 'journey:' + j.key, title: j.name + ' journey', page: 'returning', approvedAt: new Date().toISOString(), status: 'approved', kind: 'approve', taskId, client: (rec.answers || {}).business_name });
    await store.setJSON(cid, J);
    return Response.json({ ok: true, approved: J.approved[j.key] });
  }
  return Response.json({ error: 'Method' }, { status: 405 });
};
