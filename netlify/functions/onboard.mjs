// Onboarding for new Meridian clients.
// POST (JSON)              saves answers, builds the client's dashboard profile and creates a setup task in GHL.
// POST ?id=&file=<field>   saves one upload (logo, style guide or brand photo) for that client.
// GET  ?id=                returns the client's profile for the dashboard.
// GET  ?id=&file=<field>   serves one of that client's uploads.
import { getStore } from '@netlify/blobs';
import { buildProfile } from '../lib/profile.mjs';
import { ghl, assignee } from '../lib/ghl.mjs';
import { readSession, canSee, unauthorised, makeCookie } from '../lib/session.mjs';
import { listLocations, savePit, appStatus } from '../lib/ghl-access.mjs';

const FILE_FIELDS = ['logo', 'style_guide', 'brand_image_1', 'brand_image_2', 'brand_image_3', 'brand_image_4', 'brand_image_5'];
const MAX_FILE = 5 * 1024 * 1024;
const FILE_TYPES = /^(image\/(png|jpeg|svg\+xml|webp)|application\/pdf|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|presentationml\.presentation))$/;

// Answers worth having before the setup call. Anything blank here shows as "to ask" on the Clients page.
const KEY_FIELDS = {
  business_name: 'Business name', owner_name: 'First name', email: 'Email', phone: 'Phone', website: 'Website', city: 'City',
  business_type: 'Business type', locations: 'Locations', management: 'How Meridian is run', revenue_goal: 'Revenue goal',
  current_revenue: 'Current revenue', new_guest_goal: 'New guests a month', avg_visit: 'Average spend', rebook_goal: 'Rebooking goal',
  ad_budget: 'Ad budget', priorities: 'Priorities', offers: 'What they offer', booking_choice: 'Booking choice',
  booking_platform: 'Current booking system', hero_offer: 'Signature offer', different: 'What makes them different',
  ideal_guest: 'Ideal guest', tone: 'Tone of voice', voice_words: 'Brand in their words', words_love: 'Words they love',
  words_avoid: 'Words to avoid', voice_sample: 'Writing sample', signoff: 'Sign-off', imagery_style: 'Imagery style',
  imagery_people: 'People in imagery', colour_primary: 'Brand colour', gbp: 'Google Business Profile', instagram: 'Instagram',
  facebook: 'Facebook', site_platform: 'Website platform', ga4: 'Google Analytics ID', search_console: 'Search Console',
  meta_ads: 'Meta ads account', google_ads: 'Google Ads account', email_provider: 'Email provider'
};
function missing(a) {
  return Object.keys(KEY_FIELDS).filter(k => { const v = a[k]; return v == null || (Array.isArray(v) ? !v.length : !String(v).trim()); }).map(k => KEY_FIELDS[k]);
}

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

  // Staff: the agency's sub-accounts, to link a client to their own account.
  if (req.method === 'GET' && url.searchParams.get('locations')) {
    const sess = readSession(req);
    if (!sess || !sess.admin) return unauthorised();
    const app = await appStatus();
    try { return Response.json({ locations: await listLocations(), app }, { headers: { 'Cache-Control': 'no-store' } }); }
    catch (e) { return Response.json({ locations: [], app, error: String(e.message || e) }, { headers: { 'Cache-Control': 'no-store' } }); }
  }
  // Staff: link a client to their account, optionally with a sub-account Private Integration token.
  if (req.method === 'POST' && url.searchParams.get('link')) {
    const sess = readSession(req);
    if (!sess || !sess.admin) return unauthorised();
    if (!validId(id)) return Response.json({ error: 'Missing client' }, { status: 400 });
    const rec = await clients.get(id, { type: 'json' });
    if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
    let b = {}; try { b = await req.json(); } catch (e) {}
    const loc = String(b.locationId || '').replace(/[^A-Za-z0-9]/g, '');
    if (!loc) return Response.json({ error: 'Choose an account' }, { status: 400 });
    rec.locationId = loc;
    if (b.token) await savePit(loc, String(b.token).trim());
    await clients.setJSON(id, rec);
    return Response.json({ ok: true, locationId: loc });
  }

  if (req.method === 'GET' && url.searchParams.get('list')) {
    // Pixel Primed staff: every onboarding submission, newest first.
    const sess = readSession(req);
    if (!sess || !sess.admin) return unauthorised();
    const { blobs } = await clients.list();
    const recs = (await Promise.all(blobs.map(b => clients.get(b.key, { type: 'json' })))).filter(Boolean);
    recs.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    return Response.json({ clients: recs.map(r => ({
      id: r.id, createdAt: r.createdAt, files: r.files || [], taskIssue: r.taskIssue || null, locationId: r.locationId || null,
      answers: r.answers, missing: missing(r.answers || {}), labels: KEY_FIELDS
    })) }, { headers: { 'Cache-Control': 'no-store' } });
  }

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
    return Response.json({ id: rec.id, createdAt: rec.createdAt, files: rec.files || [], profile: rec.profile, answers: rec.answers || {} }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // One upload for an existing client.
  if (file) {
    if (!validId(id) || FILE_FIELDS.indexOf(file) < 0) return Response.json({ error: 'Bad upload' }, { status: 400 });
    if (!canSee(readSession(req), id)) return unauthorised();
    const rec = await clients.get(id, { type: 'json' });
    if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
    const type = req.headers.get('content-type') || 'application/octet-stream';
    if (!FILE_TYPES.test(type)) return Response.json({ error: 'File type not allowed' }, { status: 400 });
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_FILE) return Response.json({ error: 'File too large' }, { status: 413 });
    await files.set(id + '/' + file, buf, { metadata: { type } });
    rec.files = Array.from(new Set((rec.files || []).concat(file)));
    await clients.setJSON(id, rec);
    return Response.json({ ok: true });
  }

  // A client updating their business details later. Their sign-in email and plan stay as they are.
  if (url.searchParams.get('update')) {
    if (!validId(id)) return Response.json({ error: 'Missing client' }, { status: 400 });
    if (!canSee(readSession(req), id)) return unauthorised();
    const rec = await clients.get(id, { type: 'json' });
    if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
    let b = {}; try { b = await req.json(); } catch (e) {}
    const keep = { email: (rec.answers || {}).email, plan: (rec.answers || {}).plan, billing: (rec.answers || {}).billing };
    rec.answers = Object.assign({}, rec.answers || {}, b, keep);
    rec.profile = buildProfile(rec.answers);
    rec.updatedAt = new Date().toISOString();
    await clients.setJSON(id, rec);
    return Response.json({ ok: true, id });
  }

  // Answers.
  let a; try { a = await req.json(); } catch (e) { return Response.json({ error: 'Bad request' }, { status: 400 }); }
  if (a.company_website) return Response.json({ ok: true }); // honeypot
  if (!a.business_name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email || '')) return Response.json({ error: 'Business name and email are required' }, { status: 400 });
  const newId = slug(a.business_name) + '-' + Math.random().toString(36).slice(2, 8);
  const rec = { id: newId, createdAt: new Date().toISOString(), answers: a, profile: buildProfile(a), files: [] };
  rec.taskIssue = await notify(rec);
  try {
    const em = String(a.email).trim().toLowerCase();
    const match = (await listLocations()).find(l => l.email === em);
    if (match) rec.locationId = match.id;
  } catch (e) { rec.linkIssue = String(e.message || e); }
  await clients.setJSON(newId, rec);
  // Their email signs them in to this dashboard from now on.
  const email = String(a.email).trim().toLowerCase();
  await getStore({ name: 'client-index', consistency: 'strong' }).set(email, newId);
  // Sign them in straight away so "See your dashboard" works at the end of the form.
  const sess = readSession(req);
  const headers = sess && sess.admin ? {} : { 'Set-Cookie': makeCookie({ email, cid: newId, admin: false }) };
  return Response.json({ id: newId, taskIssue: rec.taskIssue }, { headers });
};
