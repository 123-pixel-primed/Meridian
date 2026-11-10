// Writes a client's Growth Blueprint. Runs in the background (up to 15 minutes) because it reads their
// website, runs a speed test, reads their account and then asks Claude to assess it all.
// Started by blueprint.mjs with an internal key. The result is saved in the 'blueprints' store.
import { getStore } from '@netlify/blobs';
import { internalKey } from '../lib/internal.mjs';
import { tokenFor } from '../lib/ghl-access.mjs';
import { ghl } from '../lib/ghl.mjs';

const MODEL = 'claude-opus-5-5';
const UA = 'Mozilla/5.0 (compatible; MeridianBlueprint/1.0; +https://meridian.pixelprimed.com)';

const SECTIONS = ['Reviews and Google profile', 'Guest journeys and email', 'Loyalty and return visits', 'Website and booking flow',
  'Found by AI assistants', 'Search and local visibility', 'Paid ads', 'Market position', 'Systems and data'];

const RULES = 'Write in plain, warm, confident English. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". ' +
  'No jargon and no software or platform names. Keep everything constructive and opportunity-led: describe what to do next, never criticise. ' +
  'Never invent numbers, reviews, quotes or facts that are not in the evidence. If the evidence does not cover something, say what you would check rather than guessing.';

async function get(url, ms = 9000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, redirect: 'follow', signal: ctl.signal });
    return { ok: r.ok, status: r.status, url: r.url, type: r.headers.get('content-type') || '', text: r.ok ? (await r.text()).slice(0, 1500000) : '' };
  } catch (e) { return { ok: false, status: 0, text: '' }; } finally { clearTimeout(t); }
}

const strip = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function pageFacts(html, url) {
  const all = (re) => Array.from(html.matchAll(re)).map(m => strip(m[1])).filter(Boolean);
  const text = strip(html);
  const ld = Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)).map(m => { try { return JSON.parse(m[1]); } catch (e) { return null; } }).filter(Boolean);
  const types = [];
  ld.forEach(j => [].concat(j['@graph'] || j).forEach(x => types.push([].concat(x['@type'] || '').join('/'))));
  const imgs = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map(m => m[0]);
  return {
    url, title: strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''),
    description: ((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || [])[1] || '').slice(0, 300),
    h1: all(/<h1[^>]*>([\s\S]*?)<\/h1>/gi).slice(0, 3), h2: all(/<h2[^>]*>([\s\S]*?)<\/h2>/gi).slice(0, 12),
    words: text.split(' ').length, prices: (text.match(/\$\s?\d{2,4}/g) || []).slice(0, 8),
    bookingLinks: (html.match(/book(ing)?[^"'<>]{0,40}["']|fresha|mindbody|timely|cliniko|square\.site|setmore|acuity|simplybook|leadconnector/gi) || []).length,
    faq: /faq|frequently asked/i.test(text), reviewsMentioned: /review|testimonial|★|stars?/i.test(text),
    schema: Array.from(new Set(types)).slice(0, 10), images: imgs.length, imagesWithoutAlt: imgs.filter(i => !/\salt=["'][^"']+/i.test(i)).length,
    excerpt: text.slice(0, 2500)
  };
}

async function readSite(site) {
  if (!site) return null;
  let base; try { base = new URL(/^https?:/i.test(site) ? site : 'https://' + site); } catch (e) { return null; }
  const home = await get(base.toString());
  if (!home.ok || !/html/i.test(home.type)) return { reachable: false };
  const out = { reachable: true, home: pageFacts(home.text, home.url), pages: [] };
  const links = Array.from(new Set(Array.from(home.text.matchAll(/href=["']([^"'#]+)["']/gi)).map(m => { try { return new URL(m[1], home.url).toString(); } catch (e) { return null; } })
    .filter(u => u && new URL(u).hostname === new URL(home.url).hostname && /(treatment|service|menu|price|about|faq|membership|gift|book)/i.test(u))));
  for (const u of links.slice(0, 4)) { const p = await get(u, 7000); if (p.ok && /html/i.test(p.type)) out.pages.push(pageFacts(p.text, p.url)); }
  const origin = new URL(home.url).origin;
  const [robots, llms, sitemap] = await Promise.all([get(origin + '/robots.txt', 5000), get(origin + '/llms.txt', 5000), get(origin + '/sitemap.xml', 5000)]);
  out.robotsTxt = robots.ok; out.llmsTxt = llms.ok && !/html/i.test(llms.type); out.sitemap = sitemap.ok;
  out.blocksAI = robots.ok && /user-agent:\s*(gptbot|claudebot|perplexitybot|google-extended)[\s\S]{0,80}disallow:\s*\//i.test(robots.text);
  return out;
}

async function speed(site) {
  const k = process.env.PSI_API_KEY; if (!k || !site) return null;
  const u = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=seo&category=accessibility&url=' + encodeURIComponent(/^https?:/.test(site) ? site : 'https://' + site) + '&key=' + k;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 70000);
  try {
    const r = await fetch(u, { headers: { Referer: 'https://meridian.pixelprimed.com/' }, signal: ctl.signal });
    if (!r.ok) return { error: 'speed test returned ' + r.status };
    const j = await r.json(), L = j.lighthouseResult || {}, c = L.categories || {}, a = L.audits || {};
    const pct = x => x && x.score != null ? Math.round(x.score * 100) : null;
    return { performance: pct(c.performance), seo: pct(c.seo), accessibility: pct(c.accessibility),
      largestPaint: a['largest-contentful-paint'] && a['largest-contentful-paint'].displayValue, layoutShift: a['cumulative-layout-shift'] && a['cumulative-layout-shift'].displayValue };
  } catch (e) { return { error: 'speed test did not finish' }; } finally { clearTimeout(t); }
}

async function account(loc) {
  if (!loc) return null;
  let token; try { token = await tokenFor(loc); } catch (e) { return { error: 'account not readable yet' }; }
  const out = {};
  try { const c = await ghl('/contacts/?locationId=' + loc + '&limit=1', token); out.contacts = (c.meta && c.meta.total) || (c.contacts || []).length; } catch (e) { out.contactsError = e.message; }
  try {
    const t = await ghl('/payments/transactions?altId=' + loc + '&altType=location&limit=100', token);
    const since = Date.now() - 90 * 86400000, rows = (t.data || []).filter(x => new Date(x.createdAt).getTime() >= since && !/test/i.test(String(x.liveMode === false ? 'test' : '')));
    out.payments90d = rows.length; out.revenue90d = Math.round(rows.reduce((s, x) => s + (Number(x.amount) || 0), 0));
  } catch (e) { out.paymentsError = e.message; }
  try { const c = await ghl('/calendars/?locationId=' + loc, token); out.calendars = (c.calendars || []).length; } catch (e) {}
  return out;
}

export default async (req) => {
  let b = {}; try { b = await req.json(); } catch (e) {}
  if (b.key !== internalKey()) return new Response('no', { status: 401 });
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '');
  const store = getStore({ name: 'blueprints', consistency: 'strong' });
  const prev = (await store.get(cid, { type: 'json' })) || {};
  const save = (o) => store.setJSON(cid, Object.assign({}, prev, o));
  try {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    if (!rec) return;
    const A = rec.answers || {};
    const site = A.website || '';
    const [web, psi, acct] = await Promise.all([readSite(site), speed(site), account(rec.locationId)]);
    const answers = Object.fromEntries(Object.entries(A).filter(([k, v]) => v && !/email|phone|file|password|company_website/i.test(k)).map(([k, v]) => [k, String(Array.isArray(v) ? v.join(', ') : v).slice(0, 400)]));
    const evidence = { business: answers, website: web, speed: psi, account: acct, previous: prev.current ? { date: prev.current.date, score: prev.current.score, sections: prev.current.sections } : null };

    const prompt = 'You are the senior strategist behind Meridian by Pixel Primed, a growth platform for wellness and hospitality businesses. ' +
      'Write this business’s Growth Blueprint from the evidence below: their onboarding answers, a read of their website, a mobile speed test and their account figures. ' +
      'Score each of these nine areas from 0 to 100 on how well the business is set up to win and keep guests, using only the evidence: ' + SECTIONS.join('; ') + '. ' +
      'A score must be backed by what you saw. Where evidence is thin, score it as a starting point and say in "why" what you would check. ' +
      (prev.current ? 'There is a previous Blueprint. Compare with it in the summary and keep scores consistent where nothing has changed. ' : '') +
      '\n\nEvidence:\n' + JSON.stringify(evidence).slice(0, 60000) +
      '\n\nReply with JSON only, shaped: {"score": number, "summary": "3 to 4 sentences", "sections": [{"l": area name exactly as listed, "score": number, "why": "one sentence on what you saw"}], ' +
      '"strengths": ["up to 3 short lines"], "opportunities": [{"t": "action in under 12 words", "i": "why it matters, one sentence", "area": area name, "impact": "high|medium"}] (5 to 7, ranked by likely effect on bookings), ' +
      '"quickWins": ["3 things doable this week"], "plan": [{"month": "Month 1", "focus": "short", "actions": ["2 to 4 actions"]}, Month 2, Month 3], ' +
      '"telling": [{"h": "insight headline", "p": "two sentences"}] (3 insights a business owner would find genuinely useful)}. Rules: ' + RULES;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 6000, system: 'You are an expert lifecycle marketing strategist for wellness and hospitality brands. ' + RULES, messages: [{ role: 'user', content: prompt }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed ' + r.status);
    const txt = (j.content || []).map(c => c.text || '').join('');
    const bp = JSON.parse((txt.match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const fix = s => String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_]/g, '').trim();
    const clean = x => typeof x === 'string' ? fix(x) : Array.isArray(x) ? x.map(clean) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, clean(v)])) : x;
    const current = Object.assign(clean(bp), { date: new Date().toISOString(), evidence: { website: !!(web && web.reachable), speed: psi && !psi.error ? psi : null, account: acct && !acct.error ? acct : null } });
    await save({ status: 'ready', error: null, baseline: prev.baseline || current, current, history: [].concat(prev.history || [], [{ date: current.date, score: current.score }]).slice(-24) });
  } catch (e) {
    await save({ status: 'failed', error: String(e.message || e).slice(0, 300) });
  }
};
