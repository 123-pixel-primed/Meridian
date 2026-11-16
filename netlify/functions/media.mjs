// Serves one uploaded image to anyone holding its signed link (used by social networks at publish time).
import { getStore } from '@netlify/blobs';
import { signMedia } from '../lib/media-sign.mjs';
export default async (req) => {
  const u = new URL(req.url), c = u.searchParams.get('c') || '', f = u.searchParams.get('f') || '', s = u.searchParams.get('s') || '';
  if (!/^[a-z0-9-]+$/.test(c) || !/^[a-z0-9_.-]+$/i.test(f) || s !== signMedia(c, f)) return new Response('Not found', { status: 404 });
  const r = await getStore({ name: 'client-files', consistency: 'strong' }).getWithMetadata(c + '/' + f, { type: 'arrayBuffer' });
  if (!r || !/^image\//.test((r.metadata || {}).type || '')) return new Response('Not found', { status: 404 });
  return new Response(r.data, { headers: { 'Content-Type': r.metadata.type, 'Cache-Control': 'public, max-age=86400' } });
};
