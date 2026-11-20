// This week's posts for a client, and scheduling an approved post to their connected Instagram and Facebook.
// GET ?client=id               posts for this week (written in the background if new) and connected accounts
// POST ?client=id {postId}     schedule that post at its suggested day and time
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { internalKey } from '../lib/internal.mjs';
import { tokenFor } from '../lib/ghl-access.mjs';
import { ghl } from '../lib/ghl.mjs';
import { mediaUrl } from '../lib/media-sign.mjs';
import { brandImages, markUsed } from '../lib/photos.mjs';

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

// The Social Planner calendar: posts from two weeks ago to four weeks ahead, with likes, comments and shares once published.
async function calendar(rec, token, accounts, accountsError, sess) {
  const from = new Date(Date.now() - 14 * 86400000), to = new Date(Date.now() + 35 * 86400000);
  if (!token) return { posts: [], connected: false };
  try {
    const r = await ghl('/social-media-posting/' + rec.locationId + '/posts/list', token, { method: 'POST', body: { type: 'all', skip: '0', limit: '100', fromDate: from.toISOString(), toDate: to.toISOString(), includeUsers: 'false' } });
    const list = (r.results && r.results.posts) || r.posts || [];
    const posts = list.filter(p => p.status !== 'deleted').map(p => {
      const ins = p.insights || {}, m = (p.media || [])[0] || {};
      return { id: p._id, status: p.status, when: p.publishedAt || p.displayDate || p.scheduleDate || p.createdAt, platform: p.platform || '', text: String(p.summary || '').slice(0, 280),
        img: p.thumbnail || (/^image\//.test(m.type || '') ? m.url : null) || null, likes: ins.like != null ? +ins.like : null, comments: ins.comment != null ? +ins.comment : null, shares: ins.share != null ? +ins.share : null,
        link: p.previewLink || null, error: p.status === 'failed' ? String(p.error || '').slice(0, 160) : undefined };
    }).sort((a, b) => String(a.when).localeCompare(String(b.when)));
    return { posts, connected: accounts.length > 0, from: from.toISOString(), to: to.toISOString() };
  } catch (e) { return { posts: [], connected: accounts.length > 0, error: sess.admin ? String(e.message || e).slice(0, 200) : 'The calendar could not be loaded just now' }; }
}

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
  if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });
  const store = getStore({ name: 'content', consistency: 'strong' });
  const week = weekKey(), key = cid + '/' + week;
  const images = brandImages(rec);
  // The photos for a post: its own choice, or (for posts written before photos were chosen) one in turn.
  const photosOf = (p, i) => (p.photos && p.photos.length ? p.photos.filter(f => images.indexOf(f) >= 0) : images.length ? [images[i % images.length]] : []);
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
    if (url.searchParams.get('calendar')) return Response.json(await calendar(rec, token, accounts, accountsError, sess), { headers: { 'Cache-Control': 'no-store' } });
    // Posts are rewritten when asked, or by themselves when Business details or the strategy changed after they were written.
    const newer = wk && wk.status === 'ready' && [rec.updatedAt, rec.guideAt].some(t => t && t > wk.at) && !wk.autoFor;
    const rewrite = (url.searchParams.get('rewrite') || newer) && wk && wk.status === 'ready';
    if ((!wk || (wk.status === 'failed' && url.searchParams.get('retry')) || rewrite) && process.env.ANTHROPIC_API_KEY) {
      // A rewrite keeps the posts already scheduled and writes fresh ones for the rest of the week.
      const sched = (wk && wk.scheduled) || {}, keep = rewrite ? wk.posts.filter(p => sched[p.id]) : [];
      wk = { status: 'writing', at: new Date().toISOString(), posts: rewrite ? wk.posts : undefined, scheduled: sched };
      if (newer) wk.autoFor = rec.updatedAt || rec.guideAt;
      await store.setJSON(key, wk);
      await fetch(url.origin + '/.netlify/functions/content-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid, week, keep, scheduled: sched, round: rewrite ? Date.now().toString(36) : '' }) }).catch(() => {});
    }
    const posts = ((wk && wk.posts) || []).map((p, i) => { const ph = photosOf(p, i).map(f => mediaUrl(url.origin, cid, f)); return Object.assign({}, p, { img: ph[0] || null, imgs: ph }); });
    if (posts.some(p => p.rewriting)) { const w = posts.find(p => p.rewriting); if (Date.now() - new Date(w.rewritingAt || 0).getTime() > 5 * 60000) w.rewriting = false; }
    return Response.json({ status: (wk && wk.status) || 'none', photosLeft: wk && wk.photosLeft != null ? wk.photosLeft : null, photoCount: images.length, usedStrategy: !!(wk && wk.usedStrategy), campaigns: (wk && wk.campaigns) || [], hasGuide: !!(rec.files || []).find(f => f === 'style_guide' || f === 'content_strategy'), guideUnread: (rec.guideBrief && rec.guideBrief.unread) || [], error: sess.admin && wk && wk.error || undefined, accountsError: sess.admin ? accountsError || undefined : undefined, week, posts, scheduled: (wk && wk.scheduled) || {}, accounts }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) {}
    // Another version of one post, written in the background.
    if (b.redo) {
      const k = ((wk && wk.posts) || []).findIndex(p => p.id === b.redo);
      if (k < 0 || (wk.scheduled || {})[b.redo]) return Response.json({ error: 'That post can no longer be rewritten' }, { status: 409 });
      wk.posts[k] = Object.assign({}, wk.posts[k], { rewriting: true, rewritingAt: new Date().toISOString(), redoError: null });
      await store.setJSON(key, wk);
      await fetch(url.origin + '/.netlify/functions/content-background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: internalKey(), client: cid, week, redo: b.redo, note: String(b.note || '').slice(0, 500), scheduled: wk.scheduled || {} }) }).catch(() => {});
      return Response.json({ ok: true });
    }
    const i = ((wk && wk.posts) || []).findIndex(p => p.id === b.postId);
    if (i < 0) return Response.json({ error: 'That post is no longer available' }, { status: 404 });
    const p = wk.posts[i];
    if (wk.scheduled && wk.scheduled[p.id]) return Response.json(wk.scheduled[p.id]);
    if (!token || !accounts.length) return Response.json({ error: 'Connect Instagram or Facebook first', needsConnect: true }, { status: 409 });
    let tz = 'Australia/Melbourne', userId = '';
    try { const L = await ghl('/locations/' + rec.locationId, token); tz = (L.location && L.location.timezone) || tz; } catch (e) {}
    try { const U = await ghl('/users/?locationId=' + rec.locationId, token); userId = ((U.users || [])[0] || {}).id || ''; } catch (e) {}
    const photos = photosOf(p, i), media = photos.map(f => ({ url: mediaUrl(url.origin, cid, f), type: 'image/jpeg' }));
    const when = nextSlot(p.day, p.time, tz);
    // Without a photo, or for a reel still to be filmed, the post is saved as a draft for our team to finish.
    const ready = media.length > 0 && p.format !== 'reel';
    const body = { accountIds: accounts.map(a => a.id), userId, summary: String(b.caption || p.caption).slice(0, 2200), type: 'post', status: ready ? 'scheduled' : 'draft', scheduleDate: when.toISOString(),
      media: p.format === 'carousel' ? media.slice(0, 10) : media.slice(0, 1) };
    try {
      const r = await ghl('/social-media-posting/' + rec.locationId + '/posts', token, { method: 'POST', body });
      const out = { status: ready ? 'scheduled' : 'draft', reason: !media.length ? 'photo' : p.format === 'reel' ? 'video' : undefined, when: when.toISOString(), postId: (r.results && (r.results.post && r.results.post._id || r.results._id)) || r.id || null, to: accounts.map(a => a.platform + ' ' + a.name) };
      if (photos.length) await markUsed(cid, p.format === 'carousel' ? photos : photos.slice(0, 1)).catch(() => {});
      wk.scheduled = Object.assign({}, wk.scheduled || {}, { [p.id]: out });
      await store.setJSON(key, wk);
      return Response.json(out);
    } catch (e) { return Response.json({ error: String(e.message || e).slice(0, 200) }, { status: 502 }); }
  }
  return Response.json({ error: 'Method' }, { status: 405 });
};
