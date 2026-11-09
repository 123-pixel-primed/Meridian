// Finds the right GHL token for a client's own account (location).
// 1. The sandbox uses GHL_SANDBOX_TOKEN.
// 2. Other accounts: the agency Private Integration (GHL_AGENCY_TOKEN, GHL_COMPANY_ID) asks GHL for a
//    short-lived token for that location. GHL's docs disagree on whether agency Private Integrations may do
//    this, so the result is checked and reported.
// 3. Fallback: a sub-account Private Integration token saved for that client by Pixel Primed staff.
import { getStore } from '@netlify/blobs';

const API = 'https://services.leadconnectorhq.com';

export function sandboxLocation() { return process.env.GHL_SANDBOX_LOCATION_ID; }

// The agency (company) ID, from GHL_COMPANY_ID or read once from the sandbox account.
let companyCache = null;
export async function companyId() {
  if (process.env.GHL_COMPANY_ID) return process.env.GHL_COMPANY_ID;
  if (companyCache) return companyCache;
  const res = await fetch(API + '/locations/' + process.env.GHL_SANDBOX_LOCATION_ID, {
    headers: { Authorization: 'Bearer ' + process.env.GHL_SANDBOX_TOKEN, Version: '2021-07-28', Accept: 'application/json' }
  });
  if (!res.ok) return null;
  const j = await res.json();
  companyCache = (j.location || j).companyId || null;
  return companyCache;
}

export async function tokenFor(locationId) {
  if (!locationId) throw new Error('No account linked yet');
  if (locationId === process.env.GHL_SANDBOX_LOCATION_ID) return process.env.GHL_SANDBOX_TOKEN;
  const store = getStore({ name: 'loc-tokens', consistency: 'strong' });
  const cached = await store.get(locationId, { type: 'json' });
  if (cached && cached.token && (!cached.exp || cached.exp > Date.now() + 60000)) return cached.token;

  const agency = process.env.GHL_AGENCY_TOKEN, company = agency ? await companyId() : null;
  if (agency && company) {
    const res = await fetch(API + '/oauth/locationToken', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + agency, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ companyId: company, locationId }).toString()
    });
    if (res.ok) {
      const j = await res.json();
      if (j.access_token) {
        await store.setJSON(locationId, { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000, via: 'agency' });
        return j.access_token;
      }
    }
    let msg = ''; try { msg = (await res.text()).slice(0, 160); } catch (e) {}
    if (!cached || !cached.pit) throw new Error('Agency connection could not open this account (' + res.status + ' ' + msg + ')');
  }
  if (cached && cached.pit) return cached.token;
  throw new Error('This account is not connected yet');
}

// Staff can save a sub-account Private Integration token for a client as a fallback.
export async function savePit(locationId, token) {
  await getStore({ name: 'loc-tokens', consistency: 'strong' }).setJSON(locationId, { token, pit: true, exp: 0, via: 'pit' });
}

// Agency view: list sub-accounts so a client can be matched to their account.
export async function listLocations() {
  const agency = process.env.GHL_AGENCY_TOKEN;
  if (!agency) throw new Error('Agency connection not set up');
  const company = await companyId();
  if (!company) throw new Error('Could not find the agency ID');
  const res = await fetch(API + '/locations/search?limit=100&companyId=' + encodeURIComponent(company), {
    headers: { Authorization: 'Bearer ' + agency, Version: '2021-07-28', Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('Listing accounts returned ' + res.status + ' ' + (await res.text()).slice(0, 160));
  const j = await res.json();
  return (j.locations || []).map(l => ({ id: l.id, name: l.name, email: (l.email || '').toLowerCase(), city: l.city || '' }));
}
