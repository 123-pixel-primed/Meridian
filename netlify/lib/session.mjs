// Signed sign-in sessions for the Meridian dashboard.
// The signing key is derived from the GHL token already stored in Netlify, so no extra secret is needed.
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const COOKIE = 'mer_s';
const DAYS = 30;

function key() {
  const base = process.env.SESSION_SECRET || process.env.GHL_SANDBOX_TOKEN || '';
  return createHash('sha256').update('meridian-session:' + base).digest();
}
const b64 = s => Buffer.from(s).toString('base64url');
const sign = data => createHmac('sha256', key()).update(data).digest('base64url');

// Pixel Primed staff can open any client dashboard and the sandbox.
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || 'contact@pixelprimed.com,jemimarmiller@gmail.com').toLowerCase().split(',').map(s => s.trim());
  return list.includes(String(email || '').toLowerCase());
}

export function makeCookie(sess) {
  const body = { email: sess.email, cid: sess.cid || null, admin: !!sess.admin, exp: Date.now() + DAYS * 86400000 };
  const data = b64(JSON.stringify(body));
  return COOKIE + '=' + data + '.' + sign(data) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DAYS * 86400;
}
export function clearCookie() { return COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'; }

export function readSession(req) {
  const raw = (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  if (!raw) return null;
  const [data, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!data || !sig) return null;
  const want = Buffer.from(sign(data)), got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(data, 'base64url').toString());
    return s.exp > Date.now() ? s : null;
  } catch (e) { return null; }
}

// Can this session see this client's dashboard?
export function canSee(sess, cid) { return !!sess && (sess.admin || (cid && sess.cid === cid)); }

export const unauthorised = () => Response.json({ error: 'signin', message: 'Please sign in' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
