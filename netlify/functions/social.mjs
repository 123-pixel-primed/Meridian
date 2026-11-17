// This week's posts for a client, and scheduling an approved post to their connected Instagram and Facebook.
// GET ?client=id               posts for this week (written in the background if new) and connected accounts
// POST ?client=id {postId}     schedule that post at its suggested day and time
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { internalKey } from '../lib/internal.mjs';
import { tokenFor } from '../lib/ghl-access.mjs';
import { ghl } from '../lib/ghl.mjs';
import { mediaUrl } from '../lib/media-sign.mjs';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function weekKey(d = new Date()) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); }
// The next given weekday and time in the business's own time zone, as a UTC date.
function nextSlot(day, time, tz) {
  const want = Math.max(0, DAYS.indexOf(String(day || '').toLowerCase())), [h, m] = String(time || '10:00').split(':').map(Number);
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }).formatToParts(d).map(p => [p.type, p.value]));
    if (parts.weekday.toLowerCase() !== DAYS[want]) continue;
    const guess = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, h || 10, m || 0));
    const shown = new Date(guess.toLocaleString('en-US', { timeZone: tz }));
    const slot = new Date(guess.getTime() + (guess.getTime() - shown.getTime()));
    if (slot.getTime() > now.getTime() + 30 * 60000) return slot;
  }
  return new Date(now.getTime() + 86400000);
}

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
  if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
  const store = getStore({ name: 'content', consistency: 'strong' });
  const week = weekKey(), key = cid + '/' + week;
  const images = (rec.files || []).filter(f => /^brand_image_\d+$/.test(f)).sort((a, b) => +a.split('_')[2] - +b.split('_')[2]);
  let token = null, accounts = [], accountsError = null;
  if (rec.locationId) {
    try {
      token = await tokenFor(rec.locationId);
      const a = await ghl('/social-media-posting/' + rec.locationId + '/accounts', token);
      accounts = ((a.results && a.results.accounts) || a.accounts || []).filter(x => !x.isExpired && /instagram|facebook/i.test(x.platform || ''))
        .map(x => ({ id: x.id || x._id, platform: x.platform, name: x.name }));
    } catch (e) { accounts = []; accountsError = String(e.message || e).slice(0, 200); }
  }
  let wk = await store.get(key, { type: 'json' });

  if (req.method === 'GET') {
    if ((!wk || (wk.status === 'failed' && url.searchParams.get('retry'))) && process.env.ANTHROPIC_API_KEY) {
      wk = { status: 'writing', at: new Date().toISOString() };
      await store.setJSON(key, wk);
      await fetch(url.origin + '/.netlify/functions/content-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid, week }) }).catch(() => {});
    }
    const posts = ((wk && wk.posts) || []).map((p, i) => Object.assign({}, p, { img: images.length ? mediaUrl(url.origin, cid, images[i % images.length]) : null }));
    return Response.json({ status: (wk && wk.status) || 'none', error: sess.admin && wk && wk.error || undefined, accountsError: sess.admin ? accountsError || undefined : undefined, week, posts, scheduled: (wk && wk.scheduled) || {}, accounts }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) {}
    const i = ((wk && wk.posts) || []).findIndex(p => p.id === b.postId);
    if (i < 0) return Response.json({ error: 'That post is no longer available' }, { status: 404 });
    const p = wk.posts[i];
    if (wk.scheduled && wk.scheduled[p.id]) return Response.json(wk.scheduled[p.id]);
    if (!token || !accounts.length) return Response.json({ error: 'Connect Instagram or Facebook first', needsConnect: true }, { status: 409 });
    let tz = 'Australia/Melbourne', userId = '';
    try { const L = await ghl('/locations/' + rec.locationId, token); tz = (L.location && L.location.timezone) || tz; } catch (e) {}
    try { const U = await ghl('/users/?locationId=' + rec.locationId, token); userId = ((U.users || [])[0] || {}).id || ''; } catch (e) {}
    const img = images.length ? mediaUrl(url.origin, cid, images[i % images.length]) : null;
    const when = nextSlot(p.day, p.time, tz);
    // Without an image Instagram cannot publish, so the post is saved as a draft for our team to add one.
    const body = { accountIds: accounts.map(a => a.id), userId, summary: String(b.caption || p.caption).slice(0, 2200), type: 'post', status: img ? 'scheduled' : 'draft', scheduleDate: when.toISOString(),
      media: img ? [{ url: img, type: 'image/jpeg' }] : [] };
    try {
      const r = await ghl('/social-media-posting/' + rec.locationId + '/posts', token, { method: 'POST', body });
      const out = { status: img ? 'scheduled' : 'draft', when: when.toISOString(), postId: (r.results && (r.results.post && r.results.post._id || r.results._id)) || r.id || null, to: accounts.map(a => a.platform + ' ' + a.name) };
      wk.scheduled = Object.assign({}, wk.scheduled || {}, { [p.id]: out });
      await store.setJSON(key, wk);
      return Response.json(out);
    } catch (e) { return Response.json({ error: String(e.message || e).slice(0, 200) }, { status: 502 }); }
  }
  return Response.json({ error: 'Method' }, { status: 405 });
};
