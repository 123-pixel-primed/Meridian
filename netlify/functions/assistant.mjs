// Meridian AI: answers a client's questions from their own dashboard figures, profile and Blueprint.
// POST { client, messages: [{ role, text }], snapshot } returns { text }.
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';

const MODEL = 'claude-sonnet-5-5';
const RULES = 'Write in plain, warm, confident English. Never use em dashes, italics or exclamation marks. Never put a comma before the word "and". ' +
  'No jargon and no software or platform names. Keep answers short: two to five sentences, or a short numbered list when steps help. ' +
  'Only use figures that appear in the data you are given. If the data does not answer the question, say so plainly and say what would. Never invent numbers, reviews or guest details.';
const GUIDE = 'Dashboard pages: Overview (summary and weekly insight), Messages (one inbox), Insights (what is happening and What we would change), Bookings, Returning guests (journeys and messages), Reviews, ' +
  'Growth Blueprint (scores, opportunities and the three-month plan), Plan and goals (Change goals button), New guests (outreach channels and monthly allowance), Content (posts, emails, brand voice and imagery), Website, Partners, Ads (Scale). ' +
  'Every message and change waits for the owner to approve it. Edit changes wording, Request a change rewrites it in their voice, Business details (bottom left) updates their onboarding answers. Plans: Core, Growth, Scale.';

export default async (req) => {
  const sess = readSession(req);
  if (!sess) return unauthorised();
  if (req.method !== 'POST') return Response.json({ error: 'Method' }, { status: 405 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'not set up' }, { status: 503 });
  let b = {}; try { b = await req.json(); } catch (e) {}
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '');
  if (cid ? !canSee(sess, cid) : !sess.admin) return unauthorised();

  let about = {};
  if (cid) {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const P = (rec && rec.profile) || {}, A = (rec && rec.answers) || {};
    const bp = await getStore({ name: 'blueprints', consistency: 'strong' }).get(cid, { type: 'json' });
    about = { business: A.business_name, type: A.business_type, city: A.city, plan: A.plan, offers: P.offers, goals: P.goals, voice: P.voice && P.voice.summary,
      blueprint: bp && bp.current ? { score: bp.current.score, summary: bp.current.summary, opportunities: bp.current.opportunities, plan: bp.current.plan } : null };
  }
  const history = (Array.isArray(b.messages) ? b.messages : []).slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.text || '').slice(0, 2000) })).filter(m => m.content);
  if (!history.length || history[history.length - 1].role !== 'user') return Response.json({ error: 'No question' }, { status: 400 });
  const snapshot = JSON.stringify(b.snapshot || {}).slice(0, 20000);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 700,
        system: 'You are Meridian AI, the growth adviser inside Meridian by Pixel Primed for a wellness or hospitality business. You give practical advice on winning and keeping guests, and help the owner use their dashboard. ' +
          RULES + '\n\n' + GUIDE + '\n\nAbout this business: ' + JSON.stringify(about) + '\n\nTheir dashboard figures right now: ' + snapshot +
          '\n\nIf they ask for something that needs a person (a change to their account, a new campaign, a connection), tell them to use Request a change or say you will pass it to the Pixel Primed team.',
        messages: history })
    });
    const j = await r.json();
    if (!r.ok) return Response.json({ error: (j.error && j.error.message) || 'failed' }, { status: 502 });
    const text = (j.content || []).map(c => c.text || '').join('').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_#]/g, '').trim();
    return Response.json({ text });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 502 }); }
};
