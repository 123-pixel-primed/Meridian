// Plain text from an uploaded strategy or style guide, so Meridian can read it.
// HTML and text are read directly; Word and PowerPoint files are unzipped and their text pulled out.
// PDFs return null: they are passed to the writer as a document instead.
import { inflateRawSync } from 'node:zlib';

function stripHtml(s) {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|br)\s*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, '’')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}

// Reads the entries of a zip file (Word and PowerPoint files are zips).
function unzip(buf, want) {
  const b = Buffer.from(buf), out = {};
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return out;
  let p = b.readUInt32LE(eocd + 16); const n = b.readUInt16LE(eocd + 10);
  for (let k = 0; k < n && p + 46 <= b.length; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) break;
    const method = b.readUInt16LE(p + 10), size = b.readUInt32LE(p + 20), nameLen = b.readUInt16LE(p + 28), extra = b.readUInt16LE(p + 30), comment = b.readUInt16LE(p + 32), local = b.readUInt32LE(p + 42);
    const name = b.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extra + comment;
    if (!want.test(name)) continue;
    const lName = b.readUInt16LE(local + 26), lExtra = b.readUInt16LE(local + 28), start = local + 30 + lName + lExtra;
    const raw = b.subarray(start, start + size);
    try { out[name] = (method === 8 ? inflateRawSync(raw) : raw).toString('utf8'); } catch (e) {}
  }
  return out;
}

// Only the visible text runs (w:t in Word, a:t in PowerPoint), one paragraph per line.
function runs(xml, ns) {
  return xml.split(new RegExp('</' + ns + ':p>')).map(p => (p.match(new RegExp('<' + ns + ':t(?:\\s[^>]*)?>([^<]*)</' + ns + ':t>', 'g')) || []).map(t => t.replace(/<[^>]+>/g, '')).join(''))
    .map(t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim()).filter(Boolean).join('\n');
}

export function extractText(buf, type) {
  const t = extractRaw(buf, type);
  // Slides made of pictures have no text to read.
  return t && t.replace(/Slide \d+:/g, '').replace(/\s+/g, '').length > 40 ? t : null;
}
function extractRaw(buf, type) {
  try {
    if (/text\/html/.test(type)) return stripHtml(Buffer.from(buf).toString('utf8'));
    if (/^text\//.test(type)) return Buffer.from(buf).toString('utf8').trim();
    if (/wordprocessingml/.test(type)) {
      const x = unzip(buf, /^word\/document\.xml$/)['word/document.xml'] || '';
      return runs(x, 'w');
    }
    if (/presentationml/.test(type)) {
      const files = unzip(buf, /^ppt\/slides\/slide\d+\.xml$/);
      return Object.keys(files).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0])
        .map((k, i) => 'Slide ' + (i + 1) + ':\n' + runs(files[k], 'a')).join('\n\n');
    }
  } catch (e) {}
  return null;
}
