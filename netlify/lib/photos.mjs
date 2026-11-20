// A client's brand photo library for posts: a short description of each photo (so the writer can pick the right one)
// and when each was last used on their grid (so photos are not repeated). Kept in the 'content' store at <client>/photos.
import { getStore } from '@netlify/blobs';

export const brandImages = rec => (rec.files || []).filter(f => /^brand_image_\d+$/.test(f)).sort((a, b) => +a.split('_')[2] - +b.split('_')[2]);

export async function photoLibrary(cid, rec, describe = true) {
  const content = getStore({ name: 'content', consistency: 'strong' }), files = getStore({ name: 'client-files', consistency: 'strong' });
  const lib = (await content.get(cid + '/photos', { type: 'json' })) || { notes: {}, used: {} };
  const images = brandImages(rec);
  const todo = describe && process.env.ANTHROPIC_API_KEY ? images.filter(f => !lib.notes[f]).slice(0, 24) : [];
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(todo.slice(i, i + 4).map(async f => {
      try {
        const r = await files.getWithMetadata(cid + '/' + f, { type: 'arrayBuffer' });
        const type = (r && r.metadata && r.metadata.type) || '';
        if (!r || !/^image\/(png|jpeg|webp|gif)$/.test(type) || r.data.byteLength > 4.5 * 1024 * 1024) { lib.notes[f] = 'Brand photo'; return; }
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
          headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 120, messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: type, data: Buffer.from(r.data).toString('base64') } },
            { type: 'text', text: 'Describe this brand photo in one line of under 20 words for a social media planner: what it shows, the mood, and whether it is portrait, square or landscape.' }] }] }) });
        const j = await res.json();
        lib.notes[f] = res.ok ? (j.content || []).map(c => c.text || '').join('').trim().slice(0, 160) : 'Brand photo';
      } catch (e) { lib.notes[f] = 'Brand photo'; }
    }));
  }
  if (todo.length) await content.setJSON(cid + '/photos', lib);
  return { lib, images };
}

// Photos in the order they should be used: never used first, then the ones used longest ago.
export function photoOrder(images, used, exclude = []) {
  return images.filter(f => exclude.indexOf(f) < 0).sort((a, b) => (used[a] || '').localeCompare(used[b] || '') || (+a.split('_')[2] - +b.split('_')[2]));
}

export async function markUsed(cid, photos) {
  const content = getStore({ name: 'content', consistency: 'strong' });
  const lib = (await content.get(cid + '/photos', { type: 'json' })) || { notes: {}, used: {} };
  const now = new Date().toISOString();
  photos.forEach(f => { lib.used[f] = now; });
  await content.setJSON(cid + '/photos', lib);
}
