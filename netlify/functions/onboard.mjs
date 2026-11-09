// Onboarding for new Meridian clients.
// POST (JSON)              saves answers, builds the client's dashboard profile and creates a setup task in GHL.
// POST ?id=&file=<field>   saves one upload (logo, style guide or brand photo) for that client.
// GET  ?id=                returns the client's profile for the dashboard.
// GET  ?id=&file=<field>   serves one of that client's uploads.
import { getStore } from '@netlify/blobs';
import { buildProfile } from '../lib/profile.mjs';
import { ghl, assignee } from '../lib/ghl.mjs';
import { readSession, canSee, unauthorised, makeCookie } from '../lib/session.mjs';

const FILE_FIELDS = ['logo', 'style_guide', 'brand_image_1', 'brand_image_2', 'brand_image_3', 'brand_image_4', 'brand_image_5'];
const MAX_FILE = 4 * 1024 * 1024;

function slug(s) { return String(s || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'client'; }
function validId(id) { return /^[a-z0-9-]{3,60}$/.test(id || ''); }

// The new client becomes a contact in Pixel Primed's GHL with a setup task assigned to the team.
async function notify(rec) {
  const token = process.env.GHL_SANDBOX_TOKEN, loc = process.env.GHL_SANDBOX_LOCATION_ID;
  if (!token || !loc) return 'GHL is not connected';
  const a = rec.answers, p = rec.profile;
  try {
    const c = await ghl('/contacts/upsert', token, { method: 'POST', body: {
      locationId: loc, firstName: a.owner_name || undefined, email: a.email, phone: a.phone || undefined,
      companyName: a.business_name, website: a.website || undefined, city: a.city || undefined, country: undefined,
      source: 'Meridian onboarding', tags: ['meridian-client', 'plan-' + p.plan]
    } });
    const cid = c.contact && c.contact.id;
    if (!cid) return 'Contact not created';
    const site = process.env.URL || 'https://meridian.pixelprimed.com';
    await ghl('/contacts/' + cid + '/tasks', token, { method: 'POST', body: {
      title: 'Set up Meridian: ' + p.venue.name + ' (' + p.planName + ')',
      body: '<p>' + p.venue.name + ' in ' + p.venue.place + ' finished onboarding on the ' + p.planName + ' plan, billed ' + p.billing + '.</p>' +
        '<p>Tone: ' + p.voice.tone + '. Imagery: ' + p.imagery.style + '.</p>' +
        '<p>Dashboard preview: ' + site + '/app/?client=' + rec.id + '</p>',
      dueDate: new Date(Date.now() + 86400000).toISOString(), completed: false,
      assignedTo: (await assignee(getStore({ name: 'approvals', consistency: 'strong' }), token, loc)) || undefined
    } });
    rec.contactId = cid;
    return null;
  } catch (e) { return String(e.message || e); }
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id'), file = url.searchParams.get('file');
  const clients = getStore({ name: 'clients', consistency: 'strong' });
  const files = getStore({ name: 'client-files', consistency: 'strong' });

  if (req.method === 'GET') {
    if (!validId(id)) return Response.json({ error: 'Missing client' }, { status: 400 });
    // Only the client themselves (or Pixel Primed staff) can see a client's profile and files.
    if (!canSee(readSession(req), id)) return unauthorised();
    if (file) {
      if (FILE_FIELDS.indexOf(file) < 0) return new Response('Not found', { status: 404 });
      const r = await files.getWithMetadata(id + '/' + file, { type: 'arrayBuffer' });
      if (!r) return new Response('Not found', { status: 404 });
      return new Response(r.data, { headers: { 'Content-Type': (r.metadata && r.metadata.type) || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600' } });
    }
    const rec = await clients.get(id, { type: 'json' });
    if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ id: rec.id, createdAt: rec.createdAt, files: rec.files || [], profile: rec.profile }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // One upload for an existing client.
  if (file) {
    if (!validId(id) || FILE_FIELDS.indexOf(file) < 0) return Response.json({ error: 'Bad upload' }, { status: 400 });
    if (!canSee(readSession(req), id)) return unauthorised();
    const rec = await clients.get(id, { type: 'json' });
    if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
    const type = req.headers.get('content-type') || 'application/octet-stream';
    if (!/^(image\/(png|jpeg|svg\+xml)|application\/pdf)$/.test(type)) return Response.json({ error: 'File type not allowed' }, { status: 400 });
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_FILE) return Response.json({ error: 'File too large' }, { status: 413 });
    await files.set(id + '/' + file, buf, { metadata: { type } });
    rec.files = Array.from(new Set((rec.files || []).concat(file)));
    await clients.setJSON(id, rec);
    return Response.json({ ok: true });
  }

  // Answers.
  let a; try { a = await req.json(); } catch (e) { return Response.json({ error: 'Bad request' }, { status: 400 }); }
  if (a.company_website) return Response.json({ ok: true }); // honeypot
  if (!a.business_name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email || '')) return Response.json({ error: 'Business name and email are required' }, { status: 400 });
  const newId = slug(a.business_name) + '-' + Math.random().toString(36).slice(2, 8);
  const rec = { id: newId, createdAt: new Date().toISOString(), answers: a, profile: buildProfile(a), files: [] };
  rec.taskIssue = await notify(rec);
  await clients.setJSON(newId, rec);
  // Their email signs them in to this dashboard from now on.
  const email = String(a.email).trim().toLowerCase();
  await getStore({ name: 'client-index', consistency: 'strong' }).set(email, newId);
  // Sign them in straight away so "See your dashboard" works at the end of the form.
  const sess = readSession(req);
  const headers = sess && sess.admin ? {} : { 'Set-Cookie': makeCookie({ email, cid: newId, admin: false }) };
  return Response.json({ id: newId, taskIssue: rec.taskIssue }, { headers });
};
