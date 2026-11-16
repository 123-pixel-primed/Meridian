// Signed public links to a client's uploaded images, so social networks can fetch them when a post publishes.
import { createHmac } from 'node:crypto';
const key = () => 'meridian-media:' + (process.env.SESSION_SECRET || process.env.GHL_SANDBOX_TOKEN || '');
export const signMedia = (cid, file) => createHmac('sha256', key()).update(cid + '/' + file).digest('base64url').slice(0, 32);
export const mediaUrl = (origin, cid, file) => origin + '/.netlify/functions/media?c=' + encodeURIComponent(cid) + '&f=' + encodeURIComponent(file) + '&s=' + signMedia(cid, file);
