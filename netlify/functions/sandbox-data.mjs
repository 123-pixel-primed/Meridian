// Reads the Meridian Sandbox from GHL and returns plain data for the client dashboard (/app).
// Needs two Netlify environment variables, never committed to the repo:
//   GHL_SANDBOX_TOKEN        Private Integration token for the Meridian Sandbox sub-account
//   GHL_SANDBOX_LOCATION_ID  The sub-account's location ID
// Read-only: this function never creates, changes or sends anything in GHL.

import { readGA, readGSC } from '../lib/ga.mjs';
import { readSession, unauthorised, canSee } from '../lib/session.mjs';
import { getStore } from '@netlify/blobs';
import { tokenFor, listLocations } from '../lib/ghl-access.mjs';

const API = 'https://services.leadconnectorhq.com';
const DAY = 86400000;

async function ghl(path, params, version, token, body) {
  const url = new URL(API + path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  // POST is only used for read-style queries (social statistics); nothing is created or changed.
  // GHL limits how many requests an app can make in a short window. On "too many requests", wait and retry.
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: Object.assign({ Authorization: 'Bearer ' + token, Version: version, Accept: 'application/json' }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status !== 429) break;
    await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
  }
  if (!res.ok) {
    let msg = '';
    try { const b = await res.json(); msg = String(b.message || b.error || '').slice(0, 160); } catch (e) {}
    throw new Error(path + ' returned ' + res.status + (msg ? ' (' + msg + ')' : ''));
  }
  return res.json();
}

function ms(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

// Where did each guest first come from? GHL records the first touch on the contact
// (attributionSource or the first entry in attributions), with the contact's source as a fallback.
function channelOf(c) {
  const first = c.attributionSource || (Array.isArray(c.attributions) && (c.attributions.find(a => a.isFirst) || c.attributions[0])) || {};
  const bits = [first.sessionSource, first.utmSource, first.utmMedium, first.medium, first.referrer, first.url, first.utmCampaign, c.source]
    .filter(Boolean).join(' ').toLowerCase();
  if (!bits.trim()) return 'Not recorded';
  if (/chatgpt|openai|perplexity|gemini|copilot|claude|bard/.test(bits)) return 'AI assistants';
  if (/(cpc|ppc|paid|ads?\b|adwords|gclid|fbclid|meta ads|facebook ads)/.test(bits)) return /google|gclid|adwords/.test(bits) ? 'Google ads' : 'Paid social';
  if (/instagram|facebook|\bfb\b|\big\b|social/.test(bits)) return 'Instagram and Facebook';
  if (/google|bing|organic|search/.test(bits)) return 'Google search';
  if (/email|newsletter|klaviyo|mailchimp/.test(bits)) return 'Email';
  if (/sms|text message/.test(bits)) return 'Text messages';
  if (/referr|partner|voucher|gift/.test(bits)) return /voucher|gift/.test(bits) ? 'Gift vouchers' : 'Partner referrals';
  if (/outreach|prospect|linkedin/.test(bits)) return 'Meridian outreach';
  if (/booking|widget|calendar|form|website|direct/.test(bits)) return 'Website and direct';
  return 'Other';
}

// A guest's first booking and first payment count for the channel that brought them;
// anything after that counts as a returning guest.
function attribute(contacts, events, transactions) {
  const ch = new Map(contacts.map(c => [c.id, c.channel]));
  const rows = {};
  const row = l => rows[l] || (rows[l] = { l, guests: 0, bookings: 0, revenue: 0 });
  const seenB = new Set(), seenP = new Set(), guests = new Set();
  events.filter(e => e.contactId && !/cancel|noshow|no_show|invalid/i.test(e.status)).sort((a, b) => a.start - b.start).forEach(e => {
    const first = !seenB.has(e.contactId); seenB.add(e.contactId);
    const r = row(first ? (ch.get(e.contactId) || 'Not recorded') : 'Returning guests');
    r.bookings++;
    if (first && !guests.has(e.contactId)) { guests.add(e.contactId); r.guests++; }
  });
  // Test-mode payments count only when there are no live ones (the sandbox), so real accounts never mix them in.
  const anyLive = transactions.some(t => t.live);
  transactions.filter(t => (t.live || !anyLive) && !/fail|refund|void/i.test(t.status)).sort((a, b) => a.date - b.date).forEach(t => {
    const first = t.contactId && !seenP.has(t.contactId); if (t.contactId) seenP.add(t.contactId);
    row(!t.contactId ? 'Not recorded' : first ? (ch.get(t.contactId) || 'Not recorded') : 'Returning guests').revenue += t.amount;
  });
  const list = Object.values(rows).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);
  const known = list.filter(r => r.l !== 'Not recorded').reduce((n, r) => n + r.bookings, 0);
  const total = list.reduce((n, r) => n + r.bookings, 0);
  return { channels: list, traced: total ? Math.round(known / total * 100) : 0, testPayments: !anyLive && transactions.length > 0 };
}

export default async (req) => {
  // Staff can read the sandbox or any client; a client can only read their own account.
  const sess = readSession(req);
  const cid = new URL(req.url).searchParams.get('client');
  if (!sess) return unauthorised();
  if (!cid && !sess.admin) return unauthorised();
  if (cid && !canSee(sess, cid)) return unauthorised();
  let loc = process.env.GHL_SANDBOX_LOCATION_ID, token = process.env.GHL_SANDBOX_TOKEN, isSandbox = true;
  if (cid) {
    const cstore = getStore({ name: 'clients', consistency: 'strong' });
    const rec = await cstore.get(cid, { type: 'json' });
    // Not linked yet: find their account by email (or business name) and remember it.
    if (rec && !rec.locationId) {
      try {
        const a = rec.answers || {}, em = String(a.email || '').trim().toLowerCase(), nm = String(a.business_name || '').trim().toLowerCase();
        const locs = await listLocations();
        const m = locs.find(l => em && l.email === em) || locs.find(l => nm && String(l.name || '').trim().toLowerCase() === nm && l.id !== process.env.GHL_SANDBOX_LOCATION_ID);
        if (m) { rec.locationId = m.id; await cstore.setJSON(cid, rec); }
      } catch (e) {}
    }
    if (!rec || !rec.locationId) return Response.json({ connected: false, reason: 'Your account is being connected.' }, { headers: { 'Cache-Control': 'no-store' } });
    loc = rec.locationId; isSandbox = loc === process.env.GHL_SANDBOX_LOCATION_ID;
    try { token = await tokenFor(loc); } catch (e) { return Response.json({ connected: false, reason: 'Your account is being connected.', detail: sess.admin ? String(e.message || e) : undefined }, { headers: { 'Cache-Control': 'no-store' } }); }
  }
  if (!token || !loc) {
    return Response.json({ connected: false, reason: 'The sandbox connection is not set up yet.' }, { status: 200 });
  }

  const errors = [];
  const out = { connected: true, fetchedAt: new Date().toISOString(), location: null, calendars: [], events: [], contacts: [], conversations: [], transactions: [], social: { accounts: [], stats: null }, errors };
  const safe = async (label, fn) => { try { await fn(); } catch (e) { errors.push(label + ': ' + e.message); } };

  await safe('location', async () => {
    const r = await ghl('/locations/' + loc, {}, '2021-07-28', token);
    const l = r.location || r;
    out.location = { name: l.name || 'Meridian Sandbox', city: l.city || '', state: l.state || '', timezone: l.timezone || 'Australia/Brisbane' };
  });

  await safe('calendars', async () => {
    const r = await ghl('/calendars/', { locationId: loc }, '2021-04-15', token);
    out.calendars = (r.calendars || []).map(c => ({
      id: c.id,
      name: c.name,
      type: c.calendarType || 'event',
      seats: c.appoinmentPerSlot || c.appointmentPerSlot || c.seatsPerSlot || 1,
      active: c.isActive !== false
    }));
  });

  const now = Date.now();
  const start = now - 56 * DAY, end = now + 21 * DAY;
  await Promise.all(out.calendars.map(c => safe('events ' + c.name, async () => {
    const r = await ghl('/calendars/events', { locationId: loc, calendarId: c.id, startTime: String(start), endTime: String(end) }, '2021-04-15', token);
    (r.events || []).forEach(e => out.events.push({
      id: e.id,
      calendarId: e.calendarId || c.id,
      title: e.title || c.name,
      start: ms(e.startTime),
      end: ms(e.endTime),
      status: e.appointmentStatus || e.status || 'confirmed',
      contactId: e.contactId || null
    }));
  })));

  // Treatments booked through GHL Services (v2) live in their own bookings list, not on calendars.
  await safe('service bookings', async () => {
    // GHL allows at most 31 days per request, so ask in 30-day windows.
    const windows = [];
    for (let a = start; a < end; a += 30 * DAY) windows.push([a, Math.min(a + 30 * DAY, end)]);
    const pages = await Promise.all(windows.map(([a, b]) => ghl('/calendars/services/bookings', { locationId: loc, startTime: String(a), endTime: String(b) }, 'v3', token)));
    const seen = new Set();
    pages.flatMap(r => r.bookings || []).filter(b => !b.deleted && !seen.has(b.bookingId) && seen.add(b.bookingId)).forEach(b => out.events.push({
      id: b.bookingId,
      calendarId: 'services',
      title: b.title || 'Treatment',
      start: ms(b.startTime),
      end: ms(b.endTime),
      status: b.status || 'confirmed',
      contactId: b.contactId || null,
      service: true
    }));
  });

  await safe('contacts', async () => {
    const r = await ghl('/contacts/', { locationId: loc, limit: '100' }, '2021-07-28', token);
    out.contacts = (r.contacts || []).map(c => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.contactName || c.email || 'Guest',
      added: ms(c.dateAdded),
      source: c.source || '',
      channel: channelOf(c)
    }));
  });

  await safe('conversations', async () => {
    const r = await ghl('/conversations/search', { locationId: loc, limit: '20' }, '2021-04-15', token);
    out.conversations = (r.conversations || []).map(c => ({
      name: c.fullName || c.contactName || c.email || 'Guest',
      type: c.lastMessageType || c.type || '',
      text: c.lastMessageBody || '',
      date: ms(c.lastMessageDate || c.dateUpdated),
      unread: c.unreadCount || 0,
      inbound: c.lastMessageDirection ? c.lastMessageDirection === 'inbound' : (c.unreadCount || 0) > 0
    }));
  });

  await safe('payments', async () => {
    const r = await ghl('/payments/transactions', { altId: loc, altType: 'location', locationId: loc, limit: '100' }, '2021-07-28', token);
    out.transactions = (r.data || r.transactions || []).map(t => ({
      amount: Number(t.amount) || 0,
      contactId: t.contactId || (t.contactSnapshot && t.contactSnapshot.id) || null,
      currency: t.currency || 'AUD',
      date: ms(t.createdAt),
      source: t.entitySourceName || t.entitySourceType || 'Booking',
      live: t.liveMode !== false,
      status: t.status || ''
    }));
  });

  out.attribution = attribute(out.contacts, out.events, out.transactions);

  await safe('social', async () => {
    const r = await ghl('/social-media-posting/' + loc + '/accounts', {}, '2021-07-28', token);
    const accts = (r.results && r.results.accounts) || [];
    out.social.accounts = accts.map(a => ({ platform: a.platform, name: a.name, profileId: a.profileId, type: a.type, expired: !!a.isExpired }));
    const ids = accts.map(a => a.profileId).filter(Boolean);
    if (ids.length) {
      const st = await ghl('/social-media-posting/statistics', { locationId: loc }, '2021-07-28', token, { profileIds: ids });
      out.social.stats = st.results || st;
    }
  });

  if (isSandbox) {
    await safe('website', async () => { out.web = await readGA(); });
    await safe('search', async () => { out.search = await readGSC(); });
  }

  // Cache at Netlify's edge for 2 minutes so page loads share one set of GHL requests.
  return Response.json(out, { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=120, stale-while-revalidate=600', 'Netlify-Vary': 'cookie=mer_s' } });
};
