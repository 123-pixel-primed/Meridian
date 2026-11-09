// Reads a business's public website so the onboarding form can pre-fill what it can.
// GET ?url=example.com  ->  { found: {...}, pages: [...] }
// Only public http(s) sites are fetched. Every value is a suggestion the client can change.

const UA = 'Mozilla/5.0 (compatible; MeridianOnboarding/1.0; +https://meridian.pixelprimed.com)';
const MAX = 1500000;

function normalise(input) {
  let s = String(input || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u; try { u = new URL(s); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const h = u.hostname.toLowerCase();
  // Public hostnames only.
  if (!h.includes('.') || /^(localhost|.*\.local|.*\.internal)$/.test(h) || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':')) return null;
  return u;
}

async function get(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: ctl.signal });
    if (!r.ok || !/html/i.test(r.headers.get('content-type') || '')) return null;
    const text = await r.text();
    return { html: text.slice(0, MAX), url: r.url };
  } catch (e) { return null; } finally { clearTimeout(t); }
}

const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim();
function meta(html, key) {
  const re = new RegExp('<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]*>', 'i');
  const tag = (html.match(re) || [])[0];
  return tag ? decode((tag.match(/content=["']([^"']*)["']/i) || [])[1]) : '';
}

const PLATFORMS = [
  ['Shopify', /cdn\.shopify\.com|Shopify\.theme/i], ['Squarespace', /squarespace\.com|static1\.squarespace/i],
  ['Wix', /wixstatic\.com|wix\.com/i], ['Webflow', /webflow\.(com|io)|data-wf-site/i], ['WordPress', /wp-content|wp-includes/i]
];
const BOOKING = [
  ['Fresha', /fresha\.com/i], ['Mindbody', /mindbodyonline\.com|mindbody\.io/i], ['Timely', /gettimely\.com/i],
  ['Zenoti', /zenoti\.com/i], ['Phorest', /phorest\.com/i], ['Jane App', /janeapp\.com/i], ['Cliniko', /cliniko\.com/i], ['Momence', /momence\.com/i]
];
const TYPES = [
  ['Day spa and bathhouse', /bath ?house/i, /day spa/i], ['Bathhouse', /bath ?house|bathing|onsen|hammam/i],
  ['Float and recovery centre', /float(ation)? (tank|therapy|centre|center)|cryo|infrared sauna|recovery centre/i],
  ['Recovery and IV clinic', /\bIV (drip|therapy)|NAD\+|hyperbaric/i], ['Medical aesthetics', /injectables?|anti-wrinkle|dermal filler|cosmetic doctor/i],
  ['Beauty and skin clinic', /skin clinic|facials?|LED therapy|dermal therap/i], ['Yoga or pilates studio', /reformer|pilates|yoga studio/i],
  ['Wellness retreat', /wellness retreat|retreats?\b/i], ['Day spa', /day spa|massage/i]
];
const COUNTRIES = [['Australia', /\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b\s*\d{4}|Australia|\.com\.au/i], ['New Zealand', /New Zealand|\.co\.nz/i],
  ['Indonesia', /Indonesia|Bali\b/i], ['Singapore', /Singapore/i], ['United States', /United States|USA\b|, (CA|NY|TX|FL) \d{5}/i]];

function jsonLd(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1].trim()); (Array.isArray(j) ? j : j['@graph'] || [j]).forEach(x => out.push(x)); } catch (e) {}
  }
  return out;
}

function extract(html, base, found) {
  const set = (k, v) => { if (v && !found[k]) found[k] = String(v).trim().slice(0, 300); };
  const ld = jsonLd(html);
  const biz = ld.find(x => /Business|Spa|Organization|HealthAndBeauty|Store|Hotel|Place/i.test([].concat(x['@type'] || '').join(' '))) || {};
  const addr = biz.address || {};
  set('business_name', biz.name || meta(html, 'og:site_name') || decode((html.match(/<title[^>]*>([^<]*)/i) || [])[1]).split(/\s[|\-–·]\s/)[0]);
  set('phone', biz.telephone || decode(((html.match(/href=["']tel:([^"']+)/i) || [])[1] || '').replace(/%20/g, ' ')));
  const mail = (html.match(/href=["']mailto:([^"'?]+)/i) || [])[1];
  if (mail && !/example|sentry|wixpress/i.test(mail)) set('contact_email', decode(mail));
  set('city', addr.addressLocality);
  const desc = biz.description || meta(html, 'og:description') || meta(html, 'description');
  set('description', desc);
  const ig = (html.match(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{2,30})/i) || [])[1];
  if (ig && !/^(p|explore|reel|accounts)$/i.test(ig)) set('instagram', '@' + ig);
  const fb = (html.match(/https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9_.\-]{2,60})/i) || [])[1];
  if (fb && !/^(sharer|plugins|tr|dialog)/i.test(fb)) set('facebook', 'facebook.com/' + fb);
  const li = (html.match(/https?:\/\/(?:[a-z]+\.)?linkedin\.com\/(company|in)\/([A-Za-z0-9_\-]{2,80})/i) || []);
  if (li[2]) set('linkedin', 'linkedin.com/' + li[1] + '/' + li[2]);
  set('ga4', (html.match(/\bG-[A-Z0-9]{6,12}\b/) || [])[0]);
  if (/fbq\(|connect\.facebook\.net\/[^"']*fbevents|googletagmanager\.com\/gtag|GTM-[A-Z0-9]{5,}/.test(html)) set('pixels', 'Installed');
  for (const [name, re] of PLATFORMS) if (re.test(html)) { set('site_platform', name); break; }
  for (const [name, re] of BOOKING) {
    if (re.test(html)) {
      set('booking_platform', name);
      const link = (html.match(new RegExp('https?://[^"\'\\s<>]*' + re.source.split('|')[0].replace(/\\\./g, '\\.') + '[^"\'\\s<>]*', 'i')) || [])[0];
      if (link) set('booking_url', decode(link));
      break;
    }
  }
  const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).slice(0, 200000);
  for (const t of TYPES) if (t.slice(1).every(re => re.test(text))) { set('business_type', t[0]); break; }
  if (addr.addressCountry) set('country', /^AU|Australia/i.test(addr.addressCountry) ? 'Australia' : /^NZ|New Zealand/i.test(addr.addressCountry) ? 'New Zealand' : '');
  for (const [name, re] of COUNTRIES) if (re.test(text + ' ' + base)) { set('country', name); break; }
  const theme = meta(html, 'theme-color');
  if (/^#[0-9a-f]{6}$/i.test(theme) && !/^#(ffffff|000000)$/i.test(theme)) set('colour_primary', theme);
  // A contact page often has the phone, email and address.
  const contact = (html.match(/href=["']([^"']*contact[^"']*)["']/i) || [])[1];
  return contact ? new URL(contact, base).toString() : null;
}

export default async (req) => {
  const u = normalise(new URL(req.url).searchParams.get('url'));
  if (!u) return Response.json({ error: 'Enter a website address like yourbusiness.com' }, { status: 400 });
  const found = {}, pages = [];
  const home = await get(u.toString());
  if (!home) return Response.json({ error: 'We could not open that website. You can fill in the details yourself.' }, { status: 200 });
  pages.push(home.url);
  found.website = home.url.replace(/\/$/, '');
  const contactUrl = extract(home.html, home.url, found);
  if (contactUrl && normalise(contactUrl) && new URL(contactUrl).hostname === new URL(home.url).hostname && (!found.phone || !found.city)) {
    const c = await get(contactUrl);
    if (c) { pages.push(c.url); extract(c.html, c.url, found); }
  }
  return Response.json({ found, pages }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
};
