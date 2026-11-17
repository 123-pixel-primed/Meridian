// A client's Klaviyo journeys (flows) and how each performed over the last 30 days.
// The client pastes a read-only private key from their own Klaviyo account. It is kept in a private store and never sent back to the browser.
// GET    ?client=id            connection status, flows and results (results cached for six hours: Klaviyo allows few report calls)
// POST   ?client=id {key}      check and save the key
// DELETE ?client=id            disconnect
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';

const REV = '2026-10-15';
async function kv(path, key, opts = {}) {
  const r = await fetch('https://a.klaviyo.com/api/' + path, { method: opts.method || 'GET',
    headers: { Authorization: 'Klaviyo-API-Key ' + key, revision: REV, accept: 'application/vnd.api+json', 'content-type': 'application/vnd.api+json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(((j.errors || [])[0] || {}).detail || ('Klaviyo said ' + r.status)); e.status = r.status; throw e; }
  return j;
}

async function load(key) {
  const flows = [];
  let next = 'flows/?fields[flow]=name,status,trigger_type,updated,archived&page[size]=50';
  for (let i = 0; i < 4 && next; i++) {
    const j = await kv(next, key);
    (j.data || []).forEach(f => { if (!f.attributes.archived) flows.push({ id: f.id, name: f.attributes.name, status: f.attributes.status, trigger: f.attributes.trigger_type, updated: f.attributes.updated }); });
    next = j.links && j.links.next ? j.links.next.replace('https://a.klaviyo.com/api/', '') : null;
  }
  // Revenue is counted against "Placed Order" where the account has it; otherwise only sends, opens and clicks are shown.
  let metric = null, revenue = false;
  try {
    const m = await kv('metrics/?fields[metric]=name', key);
    const all = m.data || [], po = all.find(x => /^placed order$/i.test(x.attributes.name));
    metric = (po || all[0] || {}).id || null; revenue = !!po;
  } catch (e) {}
  let report = null, reportError = null;
  if (metric && flows.length) {
    try {
      const r = await kv('flow-values-reports/', key, { method: 'POST', body: { data: { type: 'flow-values-report', attributes: {
        statistics: ['recipients', 'delivered', 'opens_unique', 'clicks_unique', 'conversions', 'conversion_value'], timeframe: { key: 'last_30_days' }, conversion_metric_id: metric } } } });
      report = {};
      ((r.data && r.data.attributes && r.data.attributes.results) || []).forEach(x => {
        const id = x.groupings && x.groupings.flow_id; if (!id) return;
        const s = x.statistics || {}, t = report[id] || (report[id] = { recipients: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0 });
        t.recipients += s.recipients || 0; t.delivered += s.delivered || 0; t.opens += s.opens_unique || 0; t.clicks += s.clicks_unique || 0; t.conversions += s.conversions || 0; t.revenue += s.conversion_value || 0;
      });
    } catch (e) { reportError = e.status === 429 ? 'Results are refreshed a few times a day. Check back shortly.' : 'Results could not be loaded just now.'; }
  }
  const out = flows.map(f => {
    const s = report && report[f.id];
    return Object.assign(f, s ? { sent: s.recipients, openRate: s.delivered ? Math.round(1000 * s.opens / s.delivered) / 10 : null, clickRate: s.delivered ? Math.round(1000 * s.clicks / s.delivered) / 10 : null,
      conversions: s.conversions, revenue: revenue ? Math.round(s.revenue) : null } : {});
  }).sort((a, b) => (b.sent || 0) - (a.sent || 0) || (a.status === 'live' ? -1 : 1));
  return { flows: out, revenue, reportError, at: new Date().toISOString() };
}

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const secrets = getStore({ name: 'secrets', consistency: 'strong' }), cache = getStore({ name: 'klaviyo', consistency: 'strong' });
  const sec = (await secrets.get(cid, { type: 'json' })) || {};

  if (req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) {}
    const key = String(b.key || '').trim();
    if (!/^pk_[A-Za-z0-9]{20,}$/.test(key)) return Response.json({ error: 'That is not a private API key. It starts with pk_. The six-character public key or site ID cannot read journeys.' }, { status: 400 });
    let acct = '';
    try { const a = await kv('accounts/', key); acct = (((a.data || [])[0] || {}).attributes || {}).contact_information ? a.data[0].attributes.contact_information.organization_name || '' : ''; }
    catch (e) { return Response.json({ error: e.status === 401 || e.status === 403 ? 'Klaviyo did not accept that key. Check it has read access to Accounts, Flows and Metrics.' : 'Klaviyo could not be reached. Please try again.' }, { status: 400 }); }
    await secrets.setJSON(cid, Object.assign({}, sec, { klaviyo: key, klaviyoAccount: acct, klaviyoAt: new Date().toISOString() }));
    await cache.delete(cid);
    return Response.json({ connected: true, account: acct });
  }
  if (req.method === 'DELETE') {
    delete sec.klaviyo; delete sec.klaviyoAccount;
    await secrets.setJSON(cid, sec); await cache.delete(cid);
    return Response.json({ connected: false });
  }
  if (!sec.klaviyo) return Response.json({ connected: false }, { headers: { 'Cache-Control': 'no-store' } });
  let data = await cache.get(cid, { type: 'json' });
  if (!data || Date.now() - new Date(data.at).getTime() > 6 * 3600000 || (url.searchParams.get('refresh') && sess.admin)) {
    try { data = await load(sec.klaviyo); await cache.setJSON(cid, data); }
    catch (e) { if (!data) return Response.json({ connected: true, account: sec.klaviyoAccount, error: e.status === 401 || e.status === 403 ? 'The Klaviyo key no longer works. Add a new one.' : 'Klaviyo could not be reached just now.' }); }
  }
  return Response.json(Object.assign({ connected: true, account: sec.klaviyoAccount }, data), { headers: { 'Cache-Control': 'no-store' } });
};
