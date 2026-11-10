// Connects the Meridian Marketplace app to the Pixel Primed agency, once.
// GHL sends the agency here after "Install" with ?code=..., which is exchanged for an agency token.
// That token can then open any sub-account where the app is installed (see ../lib/ghl-access.mjs).
// Needs Netlify environment variables GHL_APP_CLIENT_ID and GHL_APP_CLIENT_SECRET.
import { getStore } from '@netlify/blobs';

const API = 'https://services.leadconnectorhq.com';

export default async (req) => {
  const url = new URL(req.url);
  const site = process.env.URL || url.origin;
  const code = url.searchParams.get('code');
  if (!code) return Response.redirect(site + '/clients/?app=missing', 302);
  const id = process.env.GHL_APP_CLIENT_ID, secret = process.env.GHL_APP_CLIENT_SECRET;
  if (!id || !secret) return Response.redirect(site + '/clients/?app=keys', 302);

  const res = await fetch(API + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'authorization_code', code, user_type: 'Company', redirect_uri: site + '/connect/callback' }).toString()
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    console.log('GHL app connect failed', res.status, JSON.stringify(j).slice(0, 300));
    return Response.redirect(site + '/clients/?app=failed', 302);
  }
  await getStore({ name: 'ghl-app', consistency: 'strong' }).setJSON('agency', {
    access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (Number(j.expires_in) || 86000) * 1000,
    companyId: j.companyId || null, userType: j.userType || null, scope: j.scope || '', connectedAt: new Date().toISOString()
  });
  return Response.redirect(site + '/clients/?app=connected', 302);
};
