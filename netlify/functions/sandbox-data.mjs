// Reads the Meridian Sandbox from GHL and returns plain data for the client dashboard (/app).
// Needs two Netlify environment variables, never committed to the repo:
//   GHL_SANDBOX_TOKEN        Private Integration token for the Meridian Sandbox sub-account
//   GHL_SANDBOX_LOCATION_ID  The sub-account's location ID
// Read-only: this function never creates, changes or sends anything in GHL.

import { readGA, readGSC } from '../lib/ga.mjs';

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

export default async () => {
  const token = process.env.GHL_SANDBOX_TOKEN;
  const loc = process.env.GHL_SANDBOX_LOCATION_ID;
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
      source: c.source || ''
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
      currency: t.currency || 'AUD',
      date: ms(t.createdAt),
      source: t.entitySourceName || t.entitySourceType || 'Booking',
      live: t.liveMode !== false,
      status: t.status || ''
    }));
  });

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

  await safe('website', async () => { out.web = await readGA(); });
  await safe('search', async () => { out.search = await readGSC(); });

  // Cache at Netlify's edge for 2 minutes so page loads share one set of GHL requests.
  return Response.json(out, { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=120, stale-while-revalidate=600' } });
};
