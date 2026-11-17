// Replies from the Messages page, sent from the client's own account on the channel the guest used.
// POST { client, contactId, type, message }  send
// POST { client, suggest: { name, text, channel } }  a suggested reply in their voice
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';
import { tokenFor } from '../lib/ghl-access.mjs';
import { ghl } from '../lib/ghl.mjs';

const TYPES = { TYPE_SMS: 'SMS', TYPE_EMAIL: 'Email', TYPE_WHATSAPP: 'WhatsApp', TYPE_INSTAGRAM: 'IG', TYPE_FACEBOOK: 'FB', TYPE_WEBCHAT: 'Live_Chat', TYPE_LIVE_CHAT: 'Live_Chat', TYPE_GMB: 'GMB' };
const clean = s => String(s || '').replace(/—|–/g, ',').replace(/!/g, '.').replace(/,\s+and\b/g, ' and').replace(/[*_#]/g, '').trim();

export default async (req) => {
  const sess = readSession(req);
  if (!sess || req.method !== 'POST') return unauthorised();
  let b = {}; try { b = await req.json(); } catch (e) {}
  const cid = String(b.client || '').replace(/[^a-z0-9-]/g, '');
  if (!cid || !canSee(sess, cid)) return unauthorised();
  const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
  if (!rec || !rec.locationId) return Response.json({ error: 'Your account is not connected yet' }, { status: 409 });

  if (b.suggest) {
    const key = process.env.ANTHROPIC_API_KEY; if (!key) return Response.json({ error: 'Not set up' }, { status: 503 });
    const P = rec.profile || {}, A = rec.answers || {};
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 800, system: 'You reply to guest messages for ' + (A.business_name || 'a wellness business') + '. Their voice: ' + JSON.stringify(P.voice || {}).slice(0, 3000) + '. Offers: ' + JSON.stringify(P.offers || []).slice(0, 2000) +
        '. Booking link: ' + (A.booking_url || 'not given') + '. Write a short, warm reply in their voice. Never use em dashes, italics or exclamation marks, and never put a comma before "and". Never invent prices, times or availability: if the guest asks for something not given, say you will check and come back to them. Reply with the message only.',
        messages: [{ role: 'user', content: 'Guest ' + (b.suggest.name || '') + ' wrote on ' + (b.suggest.channel || 'a message') + ': ' + String(b.suggest.text || '(no text)').slice(0, 2000) }] }) });
    const j = await r.json();
    if (!r.ok) return Response.json({ error: (j.error && j.error.message) || 'Could not write a reply' }, { status: 502 });
    return Response.json({ text: clean((j.content || []).map(c => c.text || '').join('')) });
  }

  const message = String(b.message || '').slice(0, 4000), contactId = String(b.contactId || '').replace(/[^A-Za-z0-9]/g, '');
  if (!message || !contactId) return Response.json({ error: 'Nothing to send' }, { status: 400 });
  const type = TYPES[String(b.type || '').toUpperCase()] || 'SMS';
  try {
    const token = await tokenFor(rec.locationId);
    const body = type === 'Email' ? { type, contactId, subject: 'Re: your message to ' + ((rec.answers || {}).business_name || 'us'), html: message.replace(/[<>]/g, '').replace(/\n/g, '<br>') } : { type, contactId, message };
    const r = await ghl('/conversations/messages', token, { method: 'POST', body });
    return Response.json({ ok: true, id: r.messageId || r.id || null });
  } catch (e) { return Response.json({ error: 'It could not be sent: ' + String(e.message || e).slice(0, 160) }, { status: 502 }); }
};
