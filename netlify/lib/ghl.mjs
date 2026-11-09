// Shared GHL helpers for Meridian functions.
const API = 'https://services.leadconnectorhq.com';

export async function ghl(path, token, opts = {}) {
  const res = await fetch(API + path, {
    method: opts.method || 'GET',
    headers: { Authorization: 'Bearer ' + token, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    let m = ''; try { m = String((await res.json()).message || '').slice(0, 160); } catch (e) {}
    throw new Error(path.split('?')[0] + ' returned ' + res.status + (m ? ' (' + m + ')' : ''));
  }
  return res.json();
}

export const issues = { assignee: null };

// The GHL user who receives Meridian tasks. Set TASK_ASSIGNEE_EMAIL in Netlify to choose someone else.
// The result is cached in the given store under _assignee.
export async function assignee(store, token, loc) {
  const saved = await store.get('_assignee', { type: 'json' });
  if (saved && saved.id) return saved.id;
  try {
    const r = await ghl('/users/?locationId=' + loc, token);
    const users = r.users || [];
    const wanted = [process.env.TASK_ASSIGNEE_EMAIL, 'contact@pixelprimed.com', 'jemimarmiller@gmail.com'].filter(Boolean).map(e => e.toLowerCase());
    let u = null;
    for (const w of wanted) { u = users.find(x => String(x.email || '').toLowerCase() === w); if (u) break; }
    if (u) { await store.setJSON('_assignee', { id: u.id, email: u.email }); return u.id; }
    issues.assignee = 'No GHL user found with ' + wanted.join(' or ') + ' (' + users.length + ' users in this account)';
  } catch (e) { issues.assignee = String(e.message || e); }
  return null;
}
