// Hands the dashboard the PageSpeed Insights key so the browser can run the ~20 second test itself.
// The key must be restricted in Google Cloud to the PageSpeed Insights API and to meridian.pixelprimed.com,
// so it is only usable for speed tests from this site. Set it as PSI_API_KEY in Netlify.
export default async () => Response.json({ key: process.env.PSI_API_KEY || null }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
