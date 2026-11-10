// Approvals from the client dashboard.
// POST saves an approval and creates a task for Pixel Primed in GHL.
// GET lists approvals with their status: approved, in progress (task open) or done (task completed in GHL).
// Creating tasks needs the "Edit Contacts" (contacts.write) scope on the GHL private integration.
import { getStore } from '@netlify/blobs';

import { ghl, assignee, issues } from '../lib/ghl.mjs';
import { readSession, unauthorised } from '../lib/session.mjs';

const REQUESTS_CONTACT = 'Meridian requests';

// One contact in the client's account holds all Meridian request tasks.
async function requestsContact(store, token, loc) {
  const saved = await store.get('_contact', { type: 'json' });
  if (saved && saved.id) return saved.id;
  const r = await ghl('/contacts/', token, { method: 'POST', body: { locationId: loc, firstName: 'Meridian', lastName: 'requests', name: REQUESTS_CONTACT, source: 'Meridian dashboard', tags: ['meridian-requests'] } });
  const id = r.contact && r.contact.id;
  if (id) await store.setJSON('_contact', { id });
  return id;
}

async function makeTask(store, token, loc, rec) {
  if (!token || !loc) return;
  try {
    const cid = await requestsContact(store, token, loc);
    const due = new Date(Date.now() + 3 * 86400000).toISOString();
    const t = await ghl('/contacts/' + cid + '/tasks', token, { method: 'POST', body: {
      title: (rec.kind === 'edit' ? 'Change requested' : 'Approved') + (rec.client ? ' (' + rec.client + ')' : '') + ': ' + rec.title,
      body: (rec.kind === 'edit' ? '<p>New wording:</p><p>' + String(rec.text || '').replace(/[<>]/g, '').replace(/\n/g, '<br>') + '</p>' : (rec.detail ? '<p>' + rec.detail + '.</p>' : '')) + '<p>From the Meridian dashboard (' + rec.page + ' page' + (rec.client ? ', ' + rec.client : '') + '). Mark this task complete when it is done and the dashboard will show it as Done.</p>',
      dueDate: due, completed: false, assignedTo: (await assignee(store, token, loc)) || undefined
    } });
    rec.taskId = (t.task && (t.task.id || t.task._id)) || null;
    rec.contactId = cid;
    rec.assigned = !!(t.task && t.task.assignedTo);
    rec.status = rec.taskId ? 'in_progress' : 'approved';
    rec.note = null;
  } catch (e) { rec.note = 'Saved. The task could not be created yet: ' + String(e.message || e); }
}

export default async (req) => {
  const sess = readSession(req);
  if (!sess) return unauthorised();
  const store = getStore({ name: 'approvals', consistency: 'strong' });
  // Each client's approvals are kept apart. Staff without a client use the sandbox's.
  const q = new URL(req.url).searchParams.get('client');
  const scope = (sess.admin ? (q || '_sandbox') : sess.cid || '').replace(/[^a-z0-9_-]/g, '');
  if (!scope) return unauthorised();
  const prefix = scope + '|';
  let clientName = '';
  if (scope !== '_sandbox') { try { const c = await getStore({ name: 'clients', consistency: 'strong' }).get(scope, { type: 'json' }); clientName = (c && c.answers && c.answers.business_name) || ''; } catch (e) {} }
  const token = process.env.GHL_SANDBOX_TOKEN, loc = process.env.GHL_SANDBOX_LOCATION_ID;

  if (req.method === 'POST') {
    let item; try { item = await req.json(); } catch (e) { return Response.json({ error: 'Bad request' }, { status: 400 }); }
    const key = String(item.key || '').slice(0, 200);
    if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
    const isEdit = item.kind === 'edit';
    const existing = await store.get(prefix + key, { type: 'json' });
    if (existing && !isEdit) return Response.json(existing);
    const rec = {
      key, title: String(item.title || '').slice(0, 200), detail: String(item.detail || '').slice(0, 500),
      page: String(item.page || '').slice(0, 40), approvedAt: new Date().toISOString(), status: 'approved', taskId: null, note: null,
      kind: isEdit ? 'edit' : 'approve', text: isEdit ? String(item.text || '').slice(0, 4000) : undefined, client: clientName || undefined
    };
    await makeTask(store, token, loc, rec);
    await store.setJSON(prefix + key, rec);
    return Response.json(rec);
  }

  // GET: list approvals and refresh status from GHL tasks.
  const { blobs } = await store.list();
  const mine = blobs.filter(b => b.key.startsWith(prefix) || (scope === '_sandbox' && !b.key.startsWith('_') && b.key.indexOf('|') < 0));
  const recs = (await Promise.all(mine.map(b => store.get(b.key, { type: 'json' }).then(r => r && Object.assign(r, { _k: b.key }))))).filter(Boolean);
  // Approvals saved before tasks could be created get their task now (a few per visit, to stay within GHL limits).
  for (const r of recs.filter(x => !x.taskId).slice(0, 3)) { await makeTask(store, token, loc, r); await store.setJSON(r._k, r); }
  const contact = await store.get('_contact', { type: 'json' });
  // Tasks created before an assignee was available get assigned now.
  if (token && contact && contact.id) {
    const uid = await assignee(store, token, loc);
    for (const r of recs.filter(x => x.taskId && !x.assigned && x.status !== 'done' && uid).slice(0, 3)) {
      try { await ghl('/contacts/' + contact.id + '/tasks/' + r.taskId, token, { method: 'PUT', body: { assignedTo: uid } }); r.assigned = true; await store.setJSON(r._k, r); } catch (e) {}
    }
  }
  if (token && contact && contact.id && recs.some(r => r.taskId && r.status !== 'done')) {
    try {
      const t = await ghl('/contacts/' + contact.id + '/tasks', token);
      const done = new Set((t.tasks || []).filter(x => x.completed === true || /complete/i.test(String(x.status || ''))).map(x => x.id || x._id));
      for (const r of recs) if (r.taskId && done.has(r.taskId) && r.status !== 'done') { r.status = 'done'; await store.setJSON(r._k, r); }
    } catch (e) {}
  }
  return Response.json({ approvals: recs.map(r => { const o = Object.assign({}, r); delete o._k; return o; }), assigneeIssue: issues.assignee }, { headers: { 'Cache-Control': 'no-store' } });
};
