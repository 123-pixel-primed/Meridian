// Writes a client's posts for the week in their voice. Started by social.mjs; saved in the 'content' store.
import { getStore } from '@netlify/blobs';
import { internalKey } from '../lib/internal.mjs';
import { guideBrief, upcomingCampaigns } from '../lib/guide.mjs';

const RULES = 'Write in plain, warm English in the business’s own voice. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". ' +
  'No hype, no invented facts, prices, reviews or guest quotes. Use only offers and details given. Keep hashtags to five or fewer.';

export default async (req) => {
  let b = {}; try { b = await req.json(); } catch (e) {}
  if (b.key !== internalKey()) return new Response('no', { status: 401 });
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, ''), week = String(b.week || '');
  const store = getStore({ name: 'content', consistency: 'strong' });
  try {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const bp = await getStore({ name: 'blueprints', consistency: 'strong' }).get(cid, { type: 'json' });
    const A = (rec && rec.answers) || {}, P = (rec && rec.profile) || {};
    const about = { business: A.business_name, type: A.business_type, city: A.city, offers: P.offers, signature: P.heroOffer, goals: P.goals, voice: P.voice, imagery: P.imagery && { style: P.imagery.style, look: P.imagery.look, shots: P.imagery.shots },
      blueprint: bp && bp.current ? { opportunities: (bp.current.opportunities || []).slice(0, 4), plan: (bp.current.plan || [])[0] } : null, season: new Date().toLocaleDateString('en-AU', { month: 'long' }) + ' in ' + (A.country || 'Australia') };
    // Their own strategy and campaigns lead; the rest fills the gaps.
    let brief = null; try { brief = await guideBrief(cid); } catch (e) { about.strategyNote = 'Strategy could not be read'; }
    const campaigns = await upcomingCampaigns(cid).catch(() => []);
    const keep = (b.keep || []).slice(0, 3), want = Math.max(1, 3 - keep.length);
    const guide = (brief ? '\n\nTheir content strategy and style guide. Follow it closely: use its pillars, formats, tone, calls to action and hashtags.\n' + brief.slice(0, 9000) : '') +
      (campaigns.length ? '\n\nTheir campaigns in the coming weeks. Where one is running or about to start, at least one post supports it, using only the details given:\n' + JSON.stringify(campaigns).slice(0, 3000) : '') +
      (keep.length ? '\n\nThese posts are already scheduled this week, so cover different ground: ' + JSON.stringify(keep.map(k => k.title)) : '');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 4000, system: 'You are the social media writer for a wellness or hospitality business. ' + RULES,
        messages: [{ role: 'user', content: 'Business: ' + JSON.stringify(about).slice(0, 12000) + guide + '\n\nWrite this week’s ' + (want === 3 ? 'three' : want === 2 ? 'two' : 'one') + ' Instagram post' + (want === 1 ? '' : 's') + ' that would bring in bookings, each with a different purpose (for example an offer, a behind-the-scenes or education post, and a guest experience post). Reply with JSON only: {"posts": [{"title": "short internal title", "day": "Tuesday", "time": "10:00", "caption": "the full caption", "image": "one line describing the photo to use"}]}. ' + RULES }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed');
    const out = JSON.parse(((j.content || []).map(c => c.text || '').join('').match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const fix = s => String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_]/g, '').trim();
    const round = b.round ? '-r' + b.round : '';
    const posts = keep.concat((out.posts || []).slice(0, want).map((p, i) => ({ id: week + round + '-' + i, title: fix(p.title), day: fix(p.day), time: String(p.time || '10:00').slice(0, 5), caption: fix(p.caption), image: fix(p.image) })));
    await store.setJSON(cid + '/' + week, { status: 'ready', posts, scheduled: b.scheduled || {}, usedStrategy: !!brief, campaigns: campaigns.map(c => c.name), at: new Date().toISOString() });
  } catch (e) {
    await store.setJSON(cid + '/' + week, { status: 'failed', error: String(e.message || e).slice(0, 200) });
  }
};
