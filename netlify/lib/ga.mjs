// Reads Google Analytics 4 figures for the dashboard's Website panel.
// Needs GA_SERVICE_ACCOUNT_JSON (service account key, a Netlify secret) and GA_PROPERTY_ID.
// Read-only scope: analytics.readonly. Nothing is changed in Google Analytics.
import { createSign } from 'node:crypto';

function b64url(s) { return Buffer.from(s).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }

async function accessToken(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: scope || 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  }));
  const signer = createSign('RSA-SHA256'); signer.update(head + '.' + claim);
  const jwt = head + '.' + claim + '.' + signer.sign(sa.private_key, 'base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
  });
  if (!res.ok) throw new Error('Google sign-in returned ' + res.status);
  return (await res.json()).access_token;
}

async function report(prop, token, body) {
  const res = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/' + prop + ':runReport', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) {
    let m = ''; try { m = String((await res.json()).error.message).slice(0, 160); } catch (e) {}
    throw new Error('Analytics returned ' + res.status + (m ? ' (' + m + ')' : ''));
  }
  return res.json();
}

const LAST = { startDate: '30daysAgo', endDate: 'yesterday' };
const PREV = { startDate: '60daysAgo', endDate: '31daysAgo' };
const rows = r => (r.rows || []).map(x => ({ d: (x.dimensionValues || []).map(v => v.value), m: (x.metricValues || []).map(v => Number(v.value)) }));

export async function readGA() {
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON, prop = process.env.GA_PROPERTY_ID;
  if (!raw || !prop) return null;
  const token = await accessToken(JSON.parse(raw));
  const metrics = [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'averageSessionDuration' }, { name: 'engagementRate' }];
  const [tot, pages, sources, devices, cities] = await Promise.all([
    report(prop, token, { dateRanges: [LAST, PREV], metrics }),
    report(prop, token, { dateRanges: [LAST], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 5 }),
    report(prop, token, { dateRanges: [LAST], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 5 }),
    report(prop, token, { dateRanges: [LAST], dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }] }),
    report(prop, token, { dateRanges: [LAST], dimensions: [{ name: 'city' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 3 })
  ]);
  // With two date ranges GA adds a dateRange dimension: date_range_0 is the last 30 days.
  const t = rows(tot), pick = k => (t.find(x => x.d[0] === k) || { m: [0, 0, 0, 0] }).m;
  const dev = rows(devices), devTotal = dev.reduce((a, x) => a + x.m[0], 0) || 1;
  const city = rows(cities), cityTotal = city.reduce((a, x) => a + x.m[0], 0);
  return {
    now: pick('date_range_0'), before: pick('date_range_1'),
    pages: rows(pages).map(x => ({ l: x.d[0] === '/' ? 'Home page' : x.d[0], v: x.m[0] })),
    sources: rows(sources).map(x => ({ l: x.d[0], v: x.m[0] })),
    mobile: Math.round(100 * (dev.find(x => x.d[0] === 'mobile') || { m: [0] }).m[0] / devTotal),
    topCity: city[0] ? { name: city[0].d[0], share: Math.round(100 * city[0].m[0] / (dev.reduce((a, x) => a + x.m[0], 0) || 1)) } : null,
    cityTotal
  };
}

// Google Search Console: top search terms and totals for the last 28 days.
// Uses the same service account; needs the Search Console API enabled and the
// service account added as a Restricted user on the property. Read-only.
const GSC = 'https://www.googleapis.com/webmasters/v3';
function day(offset) { const d = new Date(Date.now() - offset * 86400000); return d.toISOString().slice(0, 10); }

async function gscQuery(site, token, body) {
  const res = await fetch(GSC + '/sites/' + encodeURIComponent(site) + '/searchAnalytics/query', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) {
    let m = ''; try { m = String((await res.json()).error.message).slice(0, 160); } catch (e) {}
    throw new Error('Search Console returned ' + res.status + (m ? ' (' + m + ')' : ''));
  }
  return res.json();
}

export async function readGSC() {
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const token = await accessToken(JSON.parse(raw), 'https://www.googleapis.com/auth/webmasters.readonly');
  const list = await fetch(GSC + '/sites', { headers: { Authorization: 'Bearer ' + token } });
  if (!list.ok) {
    let m = ''; try { m = String((await list.json()).error.message).slice(0, 160); } catch (e) {}
    throw new Error('Search Console returned ' + list.status + (m ? ' (' + m + ')' : ''));
  }
  const sites = ((await list.json()).siteEntry || []).filter(x => x.permissionLevel !== 'siteUnverifiedUser');
  const want = process.env.GSC_SITE;
  const site = (want && sites.find(x => x.siteUrl === want)) || sites.find(x => x.siteUrl.startsWith('sc-domain:')) || sites[0];
  if (!site) return { connected: false };
  // Search Console data lags about 2 days.
  const cur = { startDate: day(30), endDate: day(3) }, prev = { startDate: day(58), endDate: day(31) };
  const [terms, tot, totPrev] = await Promise.all([
    gscQuery(site.siteUrl, token, Object.assign({ dimensions: ['query'], rowLimit: 5 }, cur)),
    gscQuery(site.siteUrl, token, cur),
    gscQuery(site.siteUrl, token, prev)
  ]);
  const t = (r => (r.rows && r.rows[0]) || { clicks: 0, impressions: 0, position: 0 });
  return {
    connected: true, site: site.siteUrl,
    now: t(tot), before: t(totPrev),
    terms: (terms.rows || []).map(r => ({ term: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: Math.round(r.position * 10) / 10 }))
  };
}
