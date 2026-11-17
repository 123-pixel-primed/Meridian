// Writes a client's guest journey emails in their voice. Started by journeys.mjs; saved in the 'journeys' store.
import { getStore } from '@netlify/blobs';
import { internalKey } from '../lib/internal.mjs';
import { journeySet } from '../lib/journey-sets.mjs';

const RULES = 'Write in plain, warm English in the business’s own voice. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". ' +
  'No hype and no invented facts, prices, reviews or guest quotes. Use only the offers and details given; where a detail is missing, write around it. Sign off with their sign-off.';

export default async (req) => {
  let b = {}; try { b = await req.json(); } catch (e) {}
  if (b.key !== internalKey()) return new Response('no', { status: 401 });
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '');
  const store = getStore({ name: 'journeys', consistency: 'strong' });
  const prev = (await store.get(cid, { type: 'json' })) || {};
  try {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const A = (rec && rec.answers) || {}, P = (rec && rec.profile) || {};
    const { kind, set } = journeySet(A.business_type);
    const about = { business: A.business_name, type: A.business_type, city: A.city, offers: P.offers, signature: P.heroOffer, firstVisit: A.first_visit_notes, aftercare: A.aftercare_notes, booking: A.booking_url || A.booking_link, voice: P.voice };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 9000, system: 'You write lifecycle emails for a wellness, hospitality or product business. ' + RULES,
        messages: [{ role: 'user', content: 'Business: ' + JSON.stringify(about).slice(0, 10000) + '\n\nWrite every email in these journeys: ' + JSON.stringify(set) +
          '\n\nReply with JSON only: {"journeys": [{"key": "...", "emails": [{"when": "the timing given", "subject": "under 50 characters", "headline": "under 9 words", "body": "70 to 120 words, short paragraphs separated by blank lines", "cta": "button text, 2 to 3 words"}]}]}, in the same order as given. ' + RULES }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed');
    const out = JSON.parse(((j.content || []).map(c => c.text || '').join('').match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const fix = s => String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_#]/g, '').trim();
    const journeys = set.map(s => {
      const w = (out.journeys || []).find(x => x.key === s.key) || { emails: [] };
      return { key: s.key, name: s.name, trigger: s.trigger, emails: (w.emails || []).map((e, i) => ({ id: s.key + '-' + i, when: fix(e.when || s.emails[i]), subject: fix(e.subject), headline: fix(e.headline), body: fix(e.body), cta: fix(e.cta) || 'Book now' })) };
    });
    await store.setJSON(cid, { status: 'ready', kind, journeys, at: new Date().toISOString(), approved: prev.approved || {} });
  } catch (e) {
    await store.setJSON(cid, Object.assign({}, prev, { status: prev.journeys ? 'ready' : 'failed', error: String(e.message || e).slice(0, 200) }));
  }
};
