// Written suggestions for the Optimise page, in the client's own voice.
// POST { client, items: [{ key, area, title, why, change }] } returns { versions: { key: { label, text } } }.
// GET ?status=1 (staff) reports whether the AI key is set.
// Results are kept for the month so each client's page costs one request a month.
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';

const MODEL = 'claude-sonnet-5-5';

const RULES = [
  'Write in plain, warm English for a wellness or hospitality business.',
  'Never use em dashes, italics or exclamation marks.',
  'Never put a comma before the word "and".',
  'No jargon, no hype, no made-up reviews, guest quotes or numbers.',
  'Do not name any software, platform or tool.',
  'Keep every piece short enough to use as written.'
].join(' ');

function clean(s) {
  return String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_]/g, '').trim();
}

export default async (req) => {
  const sess = readSession(req);
  if (!sess) return unauthorised();
  const url = new URL(req.url);
  const key = process.env.ANTHROPIC_API_KEY;

  if (req.method === 'GET' && url.searchParams.get('status')) {
    if (!sess.admin) return unauthorised();
    return Response.json({ ai: !!key }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (req.method !== 'POST') return Response.json({ error: 'Method' }, { status: 405 });

  let b = {}; try { b = await req.json(); } catch (e) {}
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  if (cid ? !canSee(sess, cid) : !sess.admin) return unauthorised();

  // A client asked for a change to one message: write the new version for them to check.
  if (b.rewrite) {
    if (!key) return Response.json({ error: 'not set up' }, { status: 503 });
    const text = String(b.rewrite.text || '').slice(0, 4000), ask = String(b.rewrite.request || '').slice(0, 1000);
    let voice = {};
    if (cid) { const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' }); if (rec && rec.profile && rec.profile.voice) voice = { summary: rec.profile.voice.summary, love: rec.profile.voice.love, avoid: rec.profile.voice.avoidWords, signoff: rec.profile.voice.signoff }; }
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 1200, system: 'You edit marketing messages for small wellness and hospitality businesses. ' + RULES + ' Reply with the revised message only.',
          messages: [{ role: 'user', content: 'Their voice: ' + JSON.stringify(voice) + '\n\nCurrent message:\n' + text + '\n\nWhat they want changed:\n' + ask + '\n\nRewrite the message with that change. Keep everything else that works.' }] }) });
      const j = await r.json();
      if (!r.ok) return Response.json({ error: (j.error && j.error.message) || 'failed' }, { status: 502 });
      return Response.json({ text: clean((j.content || []).map(c => c.text || '').join('')) });
    } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 502 }); }
  }
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 6).map(x => ({
    key: String(x.key || '').slice(0, 60), area: String(x.area || '').slice(0, 60), title: String(x.title || '').slice(0, 120),
    why: String(x.why || '').slice(0, 300), change: String(x.change || '').slice(0, 400)
  })).filter(x => x.key);
  if (!items.length) return Response.json({ versions: {} });
  if (!key) return Response.json({ versions: {}, ai: false });

  const month = new Date().toISOString().slice(0, 7);
  const hash = createHash('sha1').update(JSON.stringify(items)).digest('hex').slice(0, 12);
  const cache = getStore({ name: 'ai-wording', consistency: 'strong' });
  const ck = (cid || '_sandbox') + '/' + month + '/' + hash;
  const hit = await cache.get(ck, { type: 'json' });
  if (hit) return Response.json({ versions: hit, cached: true });

  let venue = 'the business', voice = {};
  if (cid) {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    if (rec && rec.profile) {
      const P = rec.profile;
      venue = [P.venue && P.venue.name, P.venue && P.venue.type, P.venue && P.venue.place].filter(Boolean).join(', ');
      voice = { summary: P.voice && P.voice.summary, own: P.voice && P.voice.own, love: P.voice && P.voice.love, avoid: P.voice && P.voice.avoidWords, sample: P.voice && P.voice.sample, signoff: P.voice && P.voice.signoff, offer: P.heroOffer };
    }
  }

  const prompt = 'Business: ' + venue + '\nTheir voice: ' + JSON.stringify(voice) +
    '\n\nFor each suggestion below, write the actual new version we would test or send. For a subject line, give one subject line. For an email or journey, give a subject line and a short email of 60 to 90 words. For an opening, give the first two sentences. For tracking or channel changes, give one short line the owner could post or use.' +
    '\n\nSuggestions:\n' + JSON.stringify(items) +
    '\n\nReply with JSON only, shaped {"<key>": {"label": "Subject line|Email|Opening|Post", "text": "..."}}. Rules: ' + RULES;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: 'You write marketing copy for small wellness and hospitality businesses. ' + RULES, messages: [{ role: 'user', content: prompt }] })
    });
    const j = await r.json();
    if (!r.ok) return Response.json({ versions: {}, error: (j.error && j.error.message) || ('AI request failed ' + r.status) }, { status: 502 });
    const txt = (j.content || []).map(c => c.text || '').join('');
    const m = txt.match(/\{[\s\S]*\}/);
    const raw = m ? JSON.parse(m[0]) : {};
    const out = {};
    items.forEach(x => { const v = raw[x.key]; if (v && v.text) out[x.key] = { label: clean(v.label).slice(0, 30) || 'Version to test', text: clean(v.text).slice(0, 1200) }; });
    await cache.setJSON(ck, out);
    return Response.json({ versions: out });
  } catch (e) {
    return Response.json({ versions: {}, error: String(e.message || e) }, { status: 502 });
  }
};
