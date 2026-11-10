// A key only Meridian's own functions know, for one function to start another.
import { createHash } from 'node:crypto';
export const internalKey = () => createHash('sha256').update('meridian-internal:' + (process.env.SESSION_SECRET || process.env.GHL_SANDBOX_TOKEN || '')).digest('hex');
