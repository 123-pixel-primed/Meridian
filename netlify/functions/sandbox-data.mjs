// Reads the Meridian Sandbox from GHL and returns plain data for the client dashboard (/app).
// Needs two Netlify environment variables, never committed to the repo:
//   GHL_SANDBOX_TOKEN        Private Integration token for the Meridian Sandbox sub-account
//   GHL_SANDBOX_LOCATION_ID  The sub-account's location ID
// Read-only: this function never creates, changes or sends anything in GHL.

const API = 'https://services.leadconnectorhq.com';
const DAY = 86400000;

async function ghl(path, params, version, token) {
  const url = new URL(API + path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, Version: version, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(path + ' returned ' + res.status);
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
  const out = { connected: true, fetchedAt: new Date().toISOString(), location: null, calendars: [], events: [], contacts: [], conversations: [], transactions: [], errors };
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
    const r = await ghl('/payments/transactions', { altId: loc, altType: 'location', limit: '100' }, '2021-07-28', token);
    out.transactions = (r.data || r.transactions || []).map(t => ({
      amount: Number(t.amount) || 0,
      currency: t.currency || 'AUD',
      date: ms(t.createdAt),
      source: t.entitySourceName || t.entitySourceType || 'Booking',
      live: t.liveMode !== false,
      status: t.status || ''
    }));
  });

  return Response.json(out, { headers: { 'Cache-Control': 'private, max-age=60' } });
};
