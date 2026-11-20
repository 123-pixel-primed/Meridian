// Writes a client's posts for the week in their voice, or one new version of a single post.
// Started by social.mjs; saved in the 'content' store at <client>/<week>.
import { getStore } from '@netlify/blobs';
import { internalKey } from '../lib/internal.mjs';
import { guideBrief, upcomingCampaigns } from '../lib/guide.mjs';
import { photoLibrary, photoOrder } from '../lib/photos.mjs';

const RULES = 'Write in plain, warm English in the business’s own voice. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". ' +
  'No hype, no invented facts, prices, reviews or quotes. Keep hashtags to five or fewer. ' +
  'Write only about what this business actually offers, as given in its strategy and details. Where the strategy and the other details disagree, follow the strategy. Never write about services that appear in neither.';
const FORMATS = ['single', 'carousel', 'reel'];

export default async (req) => {
  let b = {}; try { b = await req.json(); } catch (e) {}
  if (b.key !== internalKey()) return new Response('no', { status: 401 });
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, ''), week = String(b.week || '');
  const store = getStore({ name: 'content', consistency: 'strong' }), key = cid + '/' + week;
  const before = (await store.get(key, { type: 'json' })) || {};
  try {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const bp = await getStore({ name: 'blueprints', consistency: 'strong' }).get(cid, { type: 'json' });
    const A = (rec && rec.answers) || {}, P = (rec && rec.profile) || {};
    const about = { business: A.business_name, type: A.business_type, city: A.city, description: A.different || A.description, offers: P.offers, signature: P.heroOffer, goals: P.goals, voice: P.voice, audience: P.audience,
      imagery: P.imagery && { style: P.imagery.style, look: P.imagery.look }, blueprint: bp && bp.current ? { opportunities: (bp.current.opportunities || []).slice(0, 4) } : null,
      season: new Date().toLocaleDateString('en-AU', { month: 'long' }) + ' in ' + (A.country || 'Australia') };
    let brief = null; try { brief = await guideBrief(cid); } catch (e) {}
    const campaigns = await upcomingCampaigns(cid).catch(() => []);

    // Photos: never used on the grid first. Photos already in this week's other posts are left out.
    const { lib, images } = await photoLibrary(cid, rec);
    const redo = b.redo ? (before.posts || []).find(p => p.id === b.redo) : null;
    const others = redo ? before.posts.filter(p => p.id !== redo.id) : (b.keep || []);
    const taken = others.flatMap(p => p.photos || []);
    const order = photoOrder(images, lib.used, taken);
    const fresh = order.filter(f => !lib.used[f]);
    const photoList = order.slice(0, 30).map(f => ({ id: f, about: lib.notes[f] || 'Brand photo', used: lib.used[f] ? 'used ' + lib.used[f].slice(0, 10) : 'not used yet' }));

    const want = redo ? 1 : Math.max(1, 3 - others.length);
    const ask = 'Business: ' + JSON.stringify(about).slice(0, 10000) +
      (brief ? '\n\nTheir content strategy and style guide. Follow it closely: its pillars, formats, posting rhythm, tone, calls to action and hashtags.\n' + brief.slice(0, 9000) : '') +
      (campaigns.length ? '\n\nTheir campaigns in the coming weeks. Where one is running or about to start, at least one post supports it, using only the details given:\n' + JSON.stringify(campaigns).slice(0, 3000) : '') +
      (others.length ? '\n\nOther posts this week, so cover different ground: ' + JSON.stringify(others.map(k => ({ title: k.title, pillar: k.pillar, format: k.format, day: k.day }))) : '') +
      '\n\nTheir photos: ' + (photoList.length ? JSON.stringify(photoList) + '. Use photos marked "not used yet" first. Never use a photo twice this week. Only use a photo already used on their grid when no unused photo fits.' : 'none uploaded yet, so describe the photo to take in "image".') +
      (redo ? '\n\nWrite a new version of this post, with a different title and caption' + (b.note ? '. They asked for this change: "' + String(b.note).slice(0, 500) + '"' : '') + ': ' + JSON.stringify({ title: redo.title, pillar: redo.pillar, format: redo.format, caption: redo.caption }) + '. Keep it in the same pillar unless the change asks otherwise.'
        : '\n\nWrite this week’s ' + (want === 3 ? 'three' : want === 2 ? 'two' : 'one') + ' Instagram post' + (want === 1 ? '' : 's') + ', each from a different pillar or purpose.') +
      ' Choose each post\'s format as the strategy says: "single" (one photo), "carousel" (3 to 6 photos that tell a story in order) or "reel" (a short video, with one photo as the cover). If the strategy does not say, include at least one carousel each week. ' +
      'Reply with JSON only: {"posts": [{"title": "a short, natural headline for the post, under 8 words, without the pillar name, day or format", "pillar": "the strategy pillar or purpose it belongs to", "format": "single, carousel or reel", "day": "Tuesday", "time": "10:00", "caption": "the full caption", "photos": ["photo ids in order"], "reel": "for a reel only: the shots to film, one line", "image": "one line describing the ideal photo if none fit"}]}. ' + RULES;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 4000, system: 'You are the social media writer for this business, writing posts that bring in enquiries and bookings. ' + RULES, messages: [{ role: 'user', content: ask }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed');
    const out = JSON.parse(((j.content || []).map(c => c.text || '').join('').match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const fix = s => String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_]/g, '').trim();

    // Keep the photo choices honest: real ids only, no repeats this week, and fill gaps from the unused photos.
    const usedNow = taken.slice();
    const written = (out.posts || []).slice(0, want).map((p, i) => {
      const format = FORMATS.indexOf(String(p.format).toLowerCase()) >= 0 ? String(p.format).toLowerCase() : 'single';
      const need = format === 'carousel' ? Math.min(6, Math.max(3, (p.photos || []).length || 4)) : 1;
      let photos = (p.photos || []).map(String).filter(f => images.indexOf(f) >= 0 && usedNow.indexOf(f) < 0).filter((f, k, a) => a.indexOf(f) === k).slice(0, need);
      photoOrder(images, lib.used, usedNow.concat(photos)).forEach(f => { if (photos.length < need) photos.push(f); });
      usedNow.push(...photos);
      const id = redo ? redo.id.replace(/-v\d+$/, '') + '-v' + (Date.now() % 100000) : week + (b.round ? '-r' + b.round : '') + '-' + i;
      return { id, title: fix(p.title), pillar: fix(p.pillar), format, day: fix(p.day || (redo && redo.day)), time: String(p.time || (redo && redo.time) || '10:00').slice(0, 5), caption: fix(p.caption), photos, reel: format === 'reel' ? fix(p.reel) : undefined, image: fix(p.image) };
    });
    if (!written.length) throw new Error('No posts came back');

    const now = (await store.get(key, { type: 'json' })) || before;
    let posts;
    if (redo) posts = (now.posts || []).map(p => p.id === redo.id ? written[0] : p);
    else posts = others.concat(written);
    await store.setJSON(key, Object.assign({}, now, { status: 'ready', posts, scheduled: b.scheduled || now.scheduled || {}, usedStrategy: !!brief, campaigns: campaigns.map(c => c.name),
      photosLeft: Math.max(0, fresh.length - written.reduce((s, p) => s + p.photos.length, 0)), at: new Date().toISOString(), error: null }));
  } catch (e) {
    const now = (await store.get(key, { type: 'json' })) || before;
    if (b.redo && now.posts) await store.setJSON(key, Object.assign({}, now, { posts: now.posts.map(p => p.id === b.redo ? Object.assign({}, p, { rewriting: false, redoError: 'Another version could not be written just now' }) : p) }));
    else await store.setJSON(key, { status: 'failed', error: String(e.message || e).slice(0, 200) });
  }
};
