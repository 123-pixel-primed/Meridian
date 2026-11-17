// The writing brief built from a client's own style guide and content strategy.
// Rebuilt whenever either file changes, then used by everything Meridian writes for them.
import { getStore } from '@netlify/blobs';
import { extractText } from './textfile.mjs';

const FIELDS = [['content_strategy', 'Content strategy'], ['style_guide', 'Brand style guide']];

export async function guideBrief(cid) {
  const clients = getStore({ name: 'clients', consistency: 'strong' });
  const rec = await clients.get(cid, { type: 'json' });
  if (!rec) return null;
  const have = FIELDS.filter(([f]) => (rec.files || []).indexOf(f) >= 0);
  if (!have.length) return null;
  if (rec.guideBrief && (!rec.guideAt || rec.guideBrief.at >= rec.guideAt)) return rec.guideBrief.text || null;
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const files = getStore({ name: 'client-files', consistency: 'strong' });
  const content = [], used = [], unread = [];
  for (const [f, label] of have) {
    const r = await files.getWithMetadata(cid + '/' + f, { type: 'arrayBuffer' });
    if (!r) continue;
    const type = (r.metadata && r.metadata.type) || '';
    const text = extractText(r.data, type);
    if (text) { content.push({ type: 'text', text: label + ':\n' + text.slice(0, 60000) }); used.push(label); }
    else if (type === 'application/pdf') { content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(r.data).toString('base64') }, title: label }); used.push(label); }
    else if (/^image\/(png|jpeg|webp)$/.test(type)) { content.push({ type: 'image', source: { type: 'base64', media_type: type, data: Buffer.from(r.data).toString('base64') } }); used.push(label); }
    else unread.push(label);
  }
  if (!content.length) {
    const fresh = await clients.get(cid, { type: 'json' }) || rec;
    fresh.guideBrief = { at: new Date().toISOString(), text: '', from: [], unread };
    await clients.setJSON(cid, fresh);
    return null;
  }
  content.push({ type: 'text', text: 'These are documents from ' + ((rec.answers || {}).business_name || 'a wellness business') + '. Turn them into a writing brief that a copywriter will follow every week. ' +
    'Cover, where the documents say so: who the content is for, the content pillars or themes, the posting rhythm and formats, tone and words to use or avoid, calls to action, hashtags, visual direction and anything the brand must never do. ' +
    'Keep their own wording for names, pillars and phrases. Leave out anything the documents do not say. Plain text, under 900 words, no preamble.' });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 2000, messages: [{ role: 'user', content }] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Could not read the strategy');
  const text = (j.content || []).map(c => c.text || '').join('').trim();
  const fresh = await clients.get(cid, { type: 'json' }) || rec;
  fresh.guideBrief = { at: new Date().toISOString(), text, from: used, unread };
  await clients.setJSON(cid, fresh);
  return text;
}

// Campaigns starting or running in the coming weeks, for the writers to plan around.
export async function upcomingCampaigns(cid, days = 28) {
  const list = (await getStore({ name: 'campaigns', consistency: 'strong' }).get(cid, { type: 'json' })) || { campaigns: [] };
  const now = new Date(), until = new Date(now.getTime() + days * 86400000), today = now.toISOString().slice(0, 10);
  return (list.campaigns || []).filter(c => (c.end || c.start) >= today && c.start <= until.toISOString().slice(0, 10))
    .map(c => ({ name: c.name, start: c.start, end: c.end || c.start, offer: c.offer || undefined, channels: c.channels || undefined, notes: c.notes || undefined }));
}
