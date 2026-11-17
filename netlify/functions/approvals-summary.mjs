// Each morning: one email to the Pixel Primed team listing everything clients approved or asked to change in the last day.
// Sent to SUMMARY_EMAIL (default contact@pixelprimed.com) through the sandbox account.
import { getStore } from '@netlify/blobs';
import { ghl } from '../lib/ghl.mjs';

export const config = { schedule: '0 22 * * *' }; // 6am in Bali and Perth, 8 or 9am on the east coast

const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

export default async () => {
  const store = getStore({ name: 'approvals', consistency: 'strong' });
  const since = Date.now() - 24 * 3600 * 1000;
  const { blobs } = await store.list();
  const recs = (await Promise.all(blobs.filter(b => !b.key.startsWith('_')).map(b => store.get(b.key, { type: 'json' }).then(r => r && Object.assign(r, { scope: b.key.split('|')[0] })))))
    .filter(r => r && new Date(r.approvedAt).getTime() >= since);
  if (!recs.length) return new Response('Nothing new');
  const by = {};
  recs.forEach(r => { const k = r.client || (r.scope === '_sandbox' || !r.scope.includes('-') ? 'Sandbox' : r.scope); (by[k] = by[k] || []).push(r); });
  const p = 'font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#22322C;margin:0 0 12px 0;';
  const html = '<div style="background:#FFFFFF;padding:32px 24px;max-width:600px"><div style="font-family:Georgia,serif;font-size:22px;letter-spacing:5px;color:#22322C;margin-bottom:24px">MERIDIAN</div>' +
    '<p style="' + p + '">Here is what clients approved or asked to change in the last day. Each one is also a task in GHL.</p>' +
    Object.keys(by).map(k => '<p style="' + p + 'margin-top:22px;font-weight:600">' + esc(k) + '</p>' + by[k].map(r =>
      '<p style="' + p + '">' + (r.kind === 'edit' ? 'Change requested: ' : 'Approved: ') + esc(r.title) + (r.page ? ' <span style="color:#5C6660">(' + esc(r.page) + ' page)</span>' : '') +
      (r.kind === 'edit' && r.text ? '<br><span style="color:#5C6660">' + esc(r.text).slice(0, 400).replace(/\n/g, '<br>') + '</span>' : '') + '</p>').join('')).join('') +
    '<p style="' + p + 'margin-top:22px"><a href="https://meridian.pixelprimed.com/clients/" style="color:#4A7570">Open the Clients page</a></p></div>';
  const token = process.env.GHL_SANDBOX_TOKEN, loc = process.env.GHL_SANDBOX_LOCATION_ID;
  const c = await ghl('/contacts/upsert', token, { method: 'POST', body: { locationId: loc, email: process.env.SUMMARY_EMAIL || 'contact@pixelprimed.com' } });
  await ghl('/conversations/messages', token, { method: 'POST', body: { type: 'Email', contactId: c.contact.id, subject: 'Meridian: ' + recs.length + ' client approval' + (recs.length === 1 ? '' : 's') + ' to action', html } });
  return new Response('Sent ' + recs.length);
};
