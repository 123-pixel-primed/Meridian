// Writes a client's brand plan with Amplify, Connect and Compound parts. Started by brand.mjs; saved in the 'brand' store.
import { getStore } from '@netlify/blobs';
import { internalKey } from '../lib/internal.mjs';
import { guideBrief, upcomingCampaigns } from '../lib/guide.mjs';

const RULES = 'Plain, warm English. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". No jargon, no hype, no invented facts, prices, awards, reviews or guest quotes. ' +
  'Use only what the business has told us or what their documents and website review say. Where something is missing, suggest it as something to create rather than stating it exists.';

export default async (req) => {
  let b = {}; try { b = await req.json(); } catch (e) {}
  if (b.key !== internalKey()) return new Response('no', { status: 401 });
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '');
  const store = getStore({ name: 'brand', consistency: 'strong' });
  const prev = (await store.get(cid, { type: 'json' })) || {};
  try {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const bp = await getStore({ name: 'blueprints', consistency: 'strong' }).get(cid, { type: 'json' });
    const A = (rec && rec.answers) || {}, P = (rec && rec.profile) || {};
    let brief = null; try { brief = await guideBrief(cid); } catch (e) {}
    const about = { business: A.business_name, type: A.business_type, city: A.city, different: A.different || A.description, offers: P.offers, signature: P.heroOffer, audience: P.audience, voice: P.voice && { tone: P.voice.tone, summary: P.voice.summary },
      imagery: P.imagery && { style: P.imagery.style, look: P.imagery.look }, colours: [A.colour_primary, A.colour_accent].filter(Boolean), goals: P.goals,
      blueprint: bp && bp.current ? { summary: bp.current.summary, strengths: bp.current.strengths, opportunities: (bp.current.opportunities || []).slice(0, 5) } : null,
      campaigns: await upcomingCampaigns(cid, 90).catch(() => []) };
    const ask = 'Business: ' + JSON.stringify(about).slice(0, 14000) + (brief ? '\n\nTheir own strategy and style guide:\n' + brief.slice(0, 8000) : '') +
      '\n\nBuild their brand plan in three parts. Amplify: build distinctive memory, so people think of this business first. Connect: turn what a guest needs right now into the right experience. Compound: turn a first visit into a lasting relationship.' +
      '\nReply with JSON only: {"promise": "the one idea the brand should own, under 15 words",' +
      ' "assets": [{"name": "a distinctive asset they have or should build, such as a colour, phrase, ritual, sound, scent or signature moment", "has": true or false, "why": "one sentence"}] (4 to 6),' +
      ' "consistency": ["one practical way to show these assets everywhere"] (3),' +
      ' "needs": [{"need": "the need in the guest\'s own words, for example I need to switch off", "occasion": "when it happens", "offer": "the offer that answers it, from their offers", "message": "one line they could say to that guest"}] (4 to 6),' +
      ' "guide": {"question": "What do you need today?", "options": [{"label": "short answer a guest would tap", "offer": "the offer it leads to"}]} (4 options),' +
      ' "themes": [{"occasion": "a season, date or moment in the next three months", "idea": "one content idea for it"}] (4),' +
      ' "compound": [{"stage": "after the first visit, before the second visit, ongoing or a milestone", "idea": "one way to deepen the relationship"}] (4)}. ' + RULES;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 4000, system: 'You are a brand strategist for wellness and hospitality businesses. ' + RULES, messages: [{ role: 'user', content: ask }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed');
    const out = JSON.parse(((j.content || []).map(c => c.text || '').join('').match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const fix = s => String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_]/g, '').trim();
    const deep = v => Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'boolean' ? x : deep(x)])) : fix(v);
    const plan = deep(out);
    if (!plan.assets || !plan.needs) throw new Error('The plan came back incomplete');
    await store.setJSON(cid, Object.assign({}, prev, { status: 'ready', plan, at: new Date().toISOString(), error: null }));
  } catch (e) {
    await store.setJSON(cid, Object.assign({}, prev, { status: prev.plan ? 'ready' : 'failed', error: String(e.message || e).slice(0, 200) }));
  }
};
