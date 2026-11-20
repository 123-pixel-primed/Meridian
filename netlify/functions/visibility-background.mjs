// Runs the AI visibility check for one client. Started by visibility.mjs.
// 1. Writes the questions guests would ask an AI assistant (once, then kept so months compare).
// 2. Asks each question of an AI assistant that searches the web, from the client's city, and records who it recommends.
// 3. Writes three things that would help the business be recommended more often.
import { getStore } from '@netlify/blobs';
import { internalKey } from '../lib/internal.mjs';
// What the questions are based on. When any of it changes in Business details, the questions are written again.
const qsig = (A = {}, P = {}) => JSON.stringify([A.business_name, A.business_type, A.city, P.offers || A.services, P.audience]).slice(0, 4000);

const RULES = 'Plain English. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". No jargon.';
async function claude(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'AI request failed');
  return j;
}
const textOf = j => (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const GENERIC = /^(the|and|day|spa|spas|wellness|studio|clinic|retreat|retreats|house|bathhouse|bath|centre|center|co|company|health|beauty|skin|by|of)$/;

// True when a name in an answer is this business: the full name, or its distinctive words, or the website.
function isUs(text, name, domain) {
  const t = norm(text), n = norm(name);
  if (n && t.indexOf(n) >= 0) return true;
  const words = n.split(' ').filter(w => w.length > 2 && !GENERIC.test(w));
  if (words.length && words.every(w => (' ' + t + ' ').indexOf(' ' + w + ' ') >= 0)) return true;
  return !!(domain && String(text || '').toLowerCase().indexOf(domain) >= 0);
}

export default async (req) => {
  let b = {}; try { b = await req.json(); } catch (e) {}
  if (b.key !== internalKey()) return new Response('no', { status: 401 });
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '');
  const store = getStore({ name: 'visibility', consistency: 'strong' });
  const V = (await store.get(cid, { type: 'json' })) || { runs: [] };
  try {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const A = (rec && rec.answers) || {}, P = (rec && rec.profile) || {};
    const name = A.business_name || '', city = A.city || '', country = A.country || 'Australia';
    const domain = String(A.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!name || !city) throw new Error('Business name and city are needed first');

    const sig = qsig(A, P);
    if (!V.questions || !V.questions.length || b.newQuestions || V.qsig !== sig) {
      V.qsig = sig;
      const j = await claude({ model: 'claude-sonnet-5-5', max_tokens: 1200, messages: [{ role: 'user', content:
        'A ' + (A.business_type || 'wellness business') + ' in ' + city + ', ' + country + '. What they offer: ' + JSON.stringify(P.offers || A.services || '').slice(0, 1500) + '. Who they want to reach: ' + JSON.stringify(P.audience || {}).slice(0, 800) +
        '\nWrite 8 questions a potential guest or customer would type into an AI assistant when looking for somewhere like this, without naming the business. Fit them to what this business actually offers. For a venue, mix: best in the area, a specific treatment or experience nearby, an occasion such as a gift or a date, a need such as recovery or switching off, and one comparison question. For a service to other businesses, ask the way a business owner would look for that service. Include the city or suburb in each. Reply with a JSON array of strings only.' }] });
      V.questions = JSON.parse((textOf(j).match(/\[[\s\S]*\]/) || ['[]'])[0]).map(String).slice(0, 8);
      if (!V.questions.length) throw new Error('No questions were written');
    }

    const ask = async (q) => {
      const j = await claude({ model: 'claude-sonnet-5-5', max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3, user_location: { type: 'approximate', city, country: { Australia: 'AU', 'New Zealand': 'NZ', Indonesia: 'ID', Singapore: 'SG', 'United States': 'US' }[country] || undefined } }],
        messages: [{ role: 'user', content: q + '\n\nAnswer as you would for anyone asking, recommending specific places. Then on the last line write RECOMMENDED: followed by a JSON array of the business names you recommended, best first.' }] });
      const text = textOf(j);
      const m = text.match(/RECOMMENDED:\s*(\[[\s\S]*?\])\s*$/);
      let list = []; try { list = m ? JSON.parse(m[1]).map(String) : []; } catch (e) {}
      const answer = text.replace(/RECOMMENDED:[\s\S]*$/, '').replace(/\*\*|__|`/g, '').replace(/^#+\s*/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      // Cut at the end of a line or sentence, never mid-word.
      let excerpt = answer;
      if (excerpt.length > 900) { const cut = excerpt.slice(0, 900), at = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. ')); excerpt = cut.slice(0, at > 400 ? at + 1 : 900).trim() + ' \u2026'; }
      const idx = list.findIndex(n => isUs(n, name, domain));
      const named = idx >= 0 || isUs(answer, name, domain);
      const sources = [];
      (j.content || []).forEach(c => (c.citations || []).forEach(x => { try { const h = new URL(x.url).hostname.replace(/^www\./, ''); if (sources.indexOf(h) < 0) sources.push(h); } catch (e) {} }));
      return { q, named, position: idx >= 0 ? idx + 1 : null, others: list.filter(n => !isUs(n, name, domain)).slice(0, 5), excerpt, sources: sources.slice(0, 6) };
    };
    const results = [];
    for (let i = 0; i < V.questions.length; i += 4) results.push(...await Promise.all(V.questions.slice(i, i + 4).map(q => ask(q).catch(e => ({ q, error: String(e.message || e).slice(0, 160) })))));
    const ok = results.filter(r => !r.error);
    if (!ok.length) throw new Error(results[0] && results[0].error || 'No answers came back');

    // Who is named most often instead, and where those answers come from.
    const tally = (arr) => { const c = {}; arr.forEach(x => { c[x] = (c[x] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, k]) => ({ name: n, count: k })); };
    const rivals = tally(ok.flatMap(r => r.others)), sites = tally(ok.flatMap(r => r.sources));
    const pos = ok.filter(r => r.position).map(r => r.position);

    let actions = [];
    try {
      const j = await claude({ model: 'claude-sonnet-5-5', max_tokens: 900, system: RULES, messages: [{ role: 'user', content:
        name + ' (' + (domain || 'no website given') + ') was recommended in ' + ok.filter(r => r.named).length + ' of ' + ok.length + ' AI assistant answers to questions like: ' + JSON.stringify(ok.map(r => ({ q: r.q, named: r.named }))) +
        '. Named most often instead: ' + JSON.stringify(rivals) + '. Sites the answers drew on: ' + JSON.stringify(sites) +
        '\nGive three specific, practical things this business could do in the next month to be recommended more often, such as pages to add to their website, listings or review sites to be on, or wording that matches how guests ask. Constructive and opportunity-led. Reply with a JSON array of {"title": "short action", "why": "one sentence"} only.' }] });
      actions = JSON.parse((textOf(j).match(/\[[\s\S]*\]/) || ['[]'])[0]).slice(0, 3);
    } catch (e) {}

    V.runs = [{ at: new Date().toISOString(), total: ok.length, named: ok.filter(r => r.named).length, avgPosition: pos.length ? Math.round(10 * pos.reduce((a, b) => a + b, 0) / pos.length) / 10 : null,
      results, rivals, sites, actions }].concat(V.runs || []).slice(0, 12);
    V.status = 'ready'; V.error = null;
  } catch (e) { V.status = 'failed'; V.error = String(e.message || e).slice(0, 240); }
  await store.setJSON(cid, V);
};
