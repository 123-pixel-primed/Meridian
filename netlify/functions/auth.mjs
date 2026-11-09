// Email sign-in for the Meridian dashboard. No passwords: the client gets a one-time link by email.
// POST {email}        sends a sign-in link if the email belongs to a client (or Pixel Primed staff)
// GET  ?token=...     checks the link, signs the person in and opens their dashboard
// GET  ?me=1          who is signed in
// POST {logout:true}  signs out
// Sending the email needs the "Edit Conversation Messages" scope on the GHL private integration.
import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import { ghl } from '../lib/ghl.mjs';
import { makeCookie, clearCookie, readSession, isAdminEmail } from '../lib/session.mjs';

const LINK_MINUTES = 20;
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e || '');

function emailHtml(link) {
  const p = 'font-family:Inter,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#22322C;margin:0 0 16px 0;';
  return '<div style="background:#FFFFFF;padding:32px 24px;max-width:560px">' +
    '<div style="font-family:Georgia,serif;font-size:22px;letter-spacing:5px;color:#22322C;margin-bottom:28px">MERIDIAN</div>' +
    '<p style="' + p + '">Here is your link to sign in to your Meridian dashboard. It works once and expires in ' + LINK_MINUTES + ' minutes.</p>' +
    '<p style="margin:24px 0"><a href="' + link + '" style="background:#5F8F88;color:#FFFFFF;text-decoration:none;padding:13px 26px;font-family:Inter,Arial,sans-serif;font-size:14px;letter-spacing:1px;display:inline-block">Sign in to Meridian</a></p>' +
    '<p style="' + p + 'font-size:13px;color:#5C6660">If you did not ask to sign in, you can ignore this email.</p>' +
    '<p style="' + p + '">The Pixel Primed Meridian Team</p></div>';
}

async function sendLink(email, link) {
  const token = process.env.GHL_SANDBOX_TOKEN, loc = process.env.GHL_SANDBOX_LOCATION_ID;
  if (!token || !loc) throw new Error('Email is not connected');
  const c = await ghl('/contacts/upsert', token, { method: 'POST', body: { locationId: loc, email } });
  const cid = c.contact && c.contact.id;
  if (!cid) throw new Error('No contact');
  await ghl('/conversations/messages', token, { method: 'POST', body: { type: 'Email', contactId: cid, subject: 'Your Meridian sign-in link', html: emailHtml(link) } });
}

export default async (req) => {
  const url = new URL(req.url);
  const tokens = getStore({ name: 'login-tokens', consistency: 'strong' });
  const index = getStore({ name: 'client-index', consistency: 'strong' });
  const site = process.env.URL || url.origin;

  if (req.method === 'GET' && url.searchParams.get('me')) {
    const s = readSession(req);
    return Response.json(s ? { email: s.email, cid: s.cid, admin: s.admin } : { signedIn: false }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'GET' && url.searchParams.get('token')) {
    const t = url.searchParams.get('token').replace(/[^A-Za-z0-9_-]/g, '');
    const rec = t && await tokens.get(t, { type: 'json' });
    if (t) await tokens.delete(t);
    if (!rec || rec.exp < Date.now()) return Response.redirect(site + '/login/?expired=1', 302);
    const dest = rec.admin ? '/clients/' : rec.cid ? '/app/?client=' + encodeURIComponent(rec.cid) : '/app/';
    return new Response(null, { status: 302, headers: { Location: dest, 'Set-Cookie': makeCookie(rec), 'Cache-Control': 'no-store' } });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let body; try { body = await req.json(); } catch (e) { return Response.json({ error: 'Bad request' }, { status: 400 }); }

  if (body.logout) return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearCookie() } });

  const email = String(body.email || '').trim().toLowerCase();
  if (!validEmail(email)) return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  // The same answer whether or not the email has an account, so nobody can test which emails are clients.
  const done = Response.json({ ok: true });
  const admin = isAdminEmail(email);
  const cid = await index.get(email);
  if (!admin && !cid) return done;
  const t = randomBytes(24).toString('base64url');
  await tokens.setJSON(t, { email, cid: cid || null, admin, exp: Date.now() + LINK_MINUTES * 60000 });
  try { await sendLink(email, site + '/.netlify/functions/auth?token=' + t); }
  catch (e) { console.log('sign-in email failed', String(e.message || e)); return Response.json({ error: 'We could not send the email just now. Please try again shortly.' }, { status: 502 }); }
  return done;
};
