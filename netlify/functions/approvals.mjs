// Approvals from the client dashboard.
// POST saves an approval and creates a task for Pixel Primed in GHL.
// GET lists approvals with their status: approved, in progress (task open) or done (task completed in GHL).
// Creating tasks needs the "Edit Contacts" (contacts.write) scope on the GHL private integration.
import { getStore } from '@netlify/blobs';

const API = 'https://services.leadconnectorhq.com';
const REQUESTS_CONTACT = 'Meridian requests';

async function ghl(path, token, opts = {}) {
  const res = await fetch(API + path, {
    method: opts.method || 'GET',
    headers: { Authorization: 'Bearer ' + token, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    let m = ''; try { m = String((await res.json()).message || '').slice(0, 160); } catch (e) {}
    throw new Error(path.split('?')[0] + ' returned ' + res.status + (m ? ' (' + m + ')' : ''));
  }
  return res.json();
}

// One contact in the client's account holds all Meridian request tasks.
async function requestsContact(store, token, loc) {
  const saved = await store.get('_contact', { type: 'json' });
  if (saved && saved.id) return saved.id;
  const r = await ghl('/contacts/', token, { method: 'POST', body: { locationId: loc, firstName: 'Meridian', lastName: 'requests', name: REQUESTS_CONTACT, source: 'Meridian dashboard', tags: ['meridian-requests'] } });
  const id = r.contact && r.contact.id;
  if (id) await store.setJSON('_contact', { id });
  return id;
}

// The GHL user who receives approval tasks. Set TASK_ASSIGNEE_EMAIL in Netlify to choose someone else.
async function assignee(store, token, loc) {
  const saved = await store.get('_assignee', { type: 'json' });
  if (saved && saved.id) return saved.id;
  try {
    const r = await ghl('/users/?locationId=' + loc, token);
    const users = r.users || [];
    const wanted = [process.env.TASK_ASSIGNEE_EMAIL, 'contact@pixelprimed.com', 'jemimarmiller@gmail.com'].filter(Boolean).map(e => e.toLowerCase());
    let u = null;
    for (const w of wanted) { u = users.find(x => String(x.email || '').toLowerCase() === w); if (u) break; }
    if (u) { await store.setJSON('_assignee', { id: u.id, email: u.email }); return u.id; }
  } catch (e) {}
  return null;
}

async function makeTask(store, token, loc, rec) {
  if (!token || !loc) return;
  try {
    const cid = await requestsContact(store, token, loc);
    const due = new Date(Date.now() + 3 * 86400000).toISOString();
    const t = await ghl('/contacts/' + cid + '/tasks', token, { method: 'POST', body: {
      title: 'Approved: ' + rec.title,
      body: (rec.detail ? '<p>' + rec.detail + '.</p>' : '') + '<p>Approved on the Meridian dashboard (' + rec.page + ' page). Mark this task complete when it is done and the dashboard will show it as Done.</p>',
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
  const store = getStore({ name: 'approvals', consistency: 'strong' });
  const token = process.env.GHL_SANDBOX_TOKEN, loc = process.env.GHL_SANDBOX_LOCATION_ID;

  if (req.method === 'POST') {
    let item; try { item = await req.json(); } catch (e) { return Response.json({ error: 'Bad request' }, { status: 400 }); }
    const key = String(item.key || '').slice(0, 200);
    if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
    const existing = await store.get(key, { type: 'json' });
    if (existing) return Response.json(existing);
    const rec = {
      key, title: String(item.title || '').slice(0, 200), detail: String(item.detail || '').slice(0, 500),
      page: String(item.page || '').slice(0, 40), approvedAt: new Date().toISOString(), status: 'approved', taskId: null, note: null
    };
    await makeTask(store, token, loc, rec);
    await store.setJSON(key, rec);
    return Response.json(rec);
  }

  // GET: list approvals and refresh status from GHL tasks.
  const { blobs } = await store.list();
  const recs = (await Promise.all(blobs.filter(b => !b.key.startsWith('_')).map(b => store.get(b.key, { type: 'json' })))).filter(Boolean);
  // Approvals saved before tasks could be created get their task now (a few per visit, to stay within GHL limits).
  for (const r of recs.filter(x => !x.taskId).slice(0, 3)) { await makeTask(store, token, loc, r); await store.setJSON(r.key, r); }
  const contact = await store.get('_contact', { type: 'json' });
  // Tasks created before an assignee was available get assigned now.
  if (token && contact && contact.id) {
    const uid = await assignee(store, token, loc);
    for (const r of recs.filter(x => x.taskId && !x.assigned && x.status !== 'done' && uid).slice(0, 3)) {
      try { await ghl('/contacts/' + contact.id + '/tasks/' + r.taskId, token, { method: 'PUT', body: { assignedTo: uid } }); r.assigned = true; await store.setJSON(r.key, r); } catch (e) {}
    }
  }
  if (token && contact && contact.id && recs.some(r => r.taskId && r.status !== 'done')) {
    try {
      const t = await ghl('/contacts/' + contact.id + '/tasks', token);
      const done = new Set((t.tasks || []).filter(x => x.completed === true || /complete/i.test(String(x.status || ''))).map(x => x.id || x._id));
      for (const r of recs) if (r.taskId && done.has(r.taskId) && r.status !== 'done') { r.status = 'done'; await store.setJSON(r.key, r); }
    } catch (e) {}
  }
  return Response.json({ approvals: recs }, { headers: { 'Cache-Control': 'no-store' } });
};
