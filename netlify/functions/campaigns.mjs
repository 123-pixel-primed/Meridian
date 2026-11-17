// A client's campaign calendar: added by hand, imported from a spreadsheet or synced from a Google Sheet link.
// GET    ?client=id                      the calendar (syncs the Google Sheet in Business details when it is new or a day old)
// POST   ?client=id {campaign}           add or update one campaign
// POST   ?client=id {csv}                import rows from a spreadsheet (converted to CSV in the browser)
// POST   ?client=id {sheet}              import from a Google Sheet link and keep it for later syncs
// DELETE ?client=id&id=campaignId        remove one
import { getStore } from '@netlify/blobs';
import { readSession, canSee, unauthorised } from '../lib/session.mjs';

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const iso = (y, m, d) => { const x = new Date(Date.UTC(y, m, d)); return isNaN(x) || x.getUTCDate() !== d ? null : x.toISOString().slice(0, 10); };
// Dates as people type them: 2026-12-01, 1/12/2026 (day first), 1 Dec 2026, December 1 2026, or a spreadsheet serial number.
function parseDate(v) {
  const s = String(v || '').trim(); if (!s) return null;
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return iso(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/))) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]);
  if ((m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?,?\s+(\d{4})$/i)) && MONTHS[m[2].slice(0, 4).toLowerCase()] != null) return iso(+m[3], MONTHS[m[2].slice(0, 4).toLowerCase()], +m[1]);
  if ((m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?,?\s+(\d{4})$/i)) && MONTHS[m[2].slice(0, 3).toLowerCase()] != null) return iso(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  if ((m = s.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i)) && MONTHS[m[1].slice(0, 3).toLowerCase()] != null) return iso(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  if (/^\d{5}(\.\d+)?$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 86400000); return d.toISOString().slice(0, 10); }
  return null;
}

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  const t = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim()));
}

const COLS = {
  name: /^(campaign|campaign name|name|title|promotion|event|theme)$/,
  start: /^(start|start date|date|from|launch|launch date|begins|go live)$/,
  end: /^(end|end date|to|until|finish|finishes|ends)$/,
  offer: /^(offer|promotion details|promo|discount|deal|offer details)$/,
  channels: /^(channel|channels|where|platforms?)$/,
  notes: /^(notes?|description|details|message|key message|brief|comments?)$/
};
// Finds the header row and maps its columns, then turns each row into a campaign.
function rowsToCampaigns(rows) {
  let h = -1, map = {};
  for (let i = 0; i < Math.min(rows.length, 10) && h < 0; i++) {
    const m = {};
    rows[i].forEach((c, k) => { const v = String(c).trim().toLowerCase(); for (const key in COLS) if (m[key] == null && COLS[key].test(v)) m[key] = k; });
    if (m.name != null && m.start != null) { h = i; map = m; }
  }
  if (h < 0) return { campaigns: [], error: 'Add a header row with at least "Campaign" and "Start date" columns.' };
  const out = [], skipped = [];
  rows.slice(h + 1).forEach((r, i) => {
    const name = String(r[map.name] || '').trim(); if (!name) return;
    const start = parseDate(r[map.start]), end = map.end != null ? parseDate(r[map.end]) : null;
    if (!start) { skipped.push(h + i + 2); return; }
    out.push({ name: name.slice(0, 120), start, end: end && end >= start ? end : start, offer: map.offer != null ? String(r[map.offer] || '').trim().slice(0, 300) : '',
      channels: map.channels != null ? String(r[map.channels] || '').trim().slice(0, 120) : '', notes: map.notes != null ? String(r[map.notes] || '').trim().slice(0, 600) : '' });
  });
  return { campaigns: out.slice(0, 300), skipped };
}

// A Google Sheet link becomes its CSV export. The sheet must be viewable by anyone with the link.
function sheetCsvUrl(link) {
  const m = String(link || '').match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/); if (!m) return null;
  const g = String(link).match(/[#&?]gid=(\d+)/);
  return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/export?format=csv' + (g ? '&gid=' + g[1] : '');
}
async function fromSheet(link) {
  const u = sheetCsvUrl(link); if (!u) return { campaigns: [], error: 'That does not look like a Google Sheet link.' };
  const r = await fetch(u, { redirect: 'follow' });
  const t = await r.text();
  if (!r.ok || /^\s*<!doctype html|<html/i.test(t)) return { campaigns: [], error: 'The sheet could not be opened. In Google Sheets choose Share, then "Anyone with the link can view".' };
  return rowsToCampaigns(parseCsv(t));
}

const id = () => Math.random().toString(36).slice(2, 10);
// Imported campaigns replace earlier imports from the same source; ones added by hand stay.
function merge(list, incoming, source) {
  const kept = (list.campaigns || []).filter(c => c.source !== source);
  return kept.concat(incoming.map(c => Object.assign({ id: id(), source }, c))).sort((a, b) => a.start.localeCompare(b.start));
}

export default async (req) => {
  const sess = readSession(req);
  const url = new URL(req.url), cid = String(url.searchParams.get('client') || '').replace(/[^a-z0-9-]/g, '');
  if (!sess || !cid || !canSee(sess, cid)) return unauthorised();
  const store = getStore({ name: 'campaigns', consistency: 'strong' });
  let list = (await store.get(cid, { type: 'json' })) || { campaigns: [] };

  if (req.method === 'GET') {
    const rec = await getStore({ name: 'clients', consistency: 'strong' }).get(cid, { type: 'json' });
    const link = (list.sheet && list.sheet.link) || (rec && rec.answers && rec.answers.campaign_sheet) || '';
    const stale = link && (!list.sheet || list.sheet.link !== link || Date.now() - new Date(list.sheet.at).getTime() > 86400000 || url.searchParams.get('sync'));
    if (stale) {
      try {
        const res = await fromSheet(link);
        list.sheet = { link, at: new Date().toISOString(), error: res.error || null, count: res.campaigns.length };
        if (!res.error) list.campaigns = merge(list, res.campaigns, 'sheet');
      } catch (e) { list.sheet = { link, at: new Date().toISOString(), error: 'The sheet could not be reached just now.' }; }
      await store.setJSON(cid, list);
    }
    return Response.json(list, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) {}
    if (b.campaign) {
      const c = b.campaign, start = parseDate(c.start), end = parseDate(c.end);
      if (!String(c.name || '').trim() || !start) return Response.json({ error: 'Add a name and a start date' }, { status: 400 });
      const item = { id: c.id && list.campaigns.find(x => x.id === c.id) ? c.id : id(), source: 'manual', name: String(c.name).trim().slice(0, 120), start, end: end && end >= start ? end : start,
        offer: String(c.offer || '').slice(0, 300), channels: String(c.channels || '').slice(0, 120), notes: String(c.notes || '').slice(0, 600) };
      list.campaigns = list.campaigns.filter(x => x.id !== item.id).concat(item).sort((a, b) => a.start.localeCompare(b.start));
      await store.setJSON(cid, list);
      return Response.json(list);
    }
    if (b.csv || b.sheet) {
      const res = b.csv ? rowsToCampaigns(parseCsv(String(b.csv).slice(0, 2000000))) : await fromSheet(b.sheet);
      if (res.error) return Response.json({ error: res.error }, { status: 400 });
      if (!res.campaigns.length) return Response.json({ error: 'No campaigns with a name and a start date were found.' }, { status: 400 });
      list.campaigns = merge(list, res.campaigns, b.csv ? 'upload' : 'sheet');
      if (b.sheet) list.sheet = { link: String(b.sheet).slice(0, 500), at: new Date().toISOString(), error: null, count: res.campaigns.length };
      await store.setJSON(cid, list);
      return Response.json(Object.assign({}, list, { imported: res.campaigns.length, skipped: res.skipped || [] }));
    }
    return Response.json({ error: 'Nothing to save' }, { status: 400 });
  }

  if (req.method === 'DELETE') {
    const cId = url.searchParams.get('id');
    list.campaigns = list.campaigns.filter(c => c.id !== cId);
    await store.setJSON(cid, list);
    return Response.json(list);
  }
  return Response.json({ error: 'Method' }, { status: 405 });
};
