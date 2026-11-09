// Turns onboarding answers into the settings that build a client's dashboard:
// brand, goals, plan, voice guide, imagery brief and first drafts of the
// prospecting series. Drafts are a starting point; the client approves or edits each one.

const TIERS = { core: 'Core', growth: 'Growth', scale: 'Scale' };

function clean(s, max = 600) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max); }
function num(v) { const n = Number(String(v || '').replace(/[^0-9.]/g, '')); return isFinite(n) && n > 0 ? n : null; }
function list(v) { return (Array.isArray(v) ? v : v ? [v] : []).map(x => clean(x, 80)).filter(Boolean); }
function sentence(s) { s = clean(s); if (!s) return ''; s = s[0].toUpperCase() + s.slice(1); return /[.?]$/.test(s) ? s : s + '.'; }
function phrase(s) { s = clean(s, 160).replace(/[.?]+$/, ''); return s ? s[0].toLowerCase() + s.slice(1) : ''; }
function hex(v) { const m = String(v || '').trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i); if (!m) return null; let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join(''); return '#' + h.toLowerCase(); }
// Contrast against white, so a brand colour is only used for buttons and charts when text on it stays readable.
function readableOnWhite(h) {
  if (!h) return false;
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return 1.05 / (L + 0.05) >= 3;
}

/* ---------- Tone of voice ---------- */
// Each tone sets how drafts read. Words are kept plain: no exclamation marks, no hype.
const TONES = {
  'Luxurious and exclusive': {
    key: 'luxe',
    summary: 'Calm, unhurried and quietly confident. Fewer words, chosen carefully. Never pushy and never discount-led.',
    do: ['Short sentences with space around them', 'Talk about time, detail and care rather than price', 'Invite rather than ask and let people come to you'],
    avoid: ['Discounts, deals and countdowns', 'Exclamation marks and emojis', 'Words like cheap, bargain or hurry'],
    greet: 'Hi', close: 'With warm regards,',
    hook: 'I wanted to introduce {biz}, a {type} in {city}, to a few people nearby.',
    detail: 'The difference is in the detail: unhurried time, considered rituals and a space that feels entirely yours.',
    scarcity: 'We have a small number of openings this month and I wanted you to hear about them first.',
    first: 'Your first visit begins with a short conversation about what you would like from your time with us. From there everything is arranged around you, so there is nothing to rush and nothing to decide on the day.',
    last: 'This is my final note, as I would rather not crowd your inbox. Should the timing suit you later, our booking page is always open.',
    welcome: ['Welcome to {biz}', 'Thank you for joining us. Before your visit, here is what to expect, so you can arrive and simply settle in.'],
    ig: ['Thank you for the follow. We are a {type} in {city}. Should you ever wish to visit, we would be delighted to arrange a time.', 'Simply sharing that we have a few openings this month. {offerCap} is a lovely place to begin.', 'I noticed you had a look at our booking page. If there is anything you would like to know before you book, I am happy to help.'],
    li: ['Hello [First name], we are both in {city}. I look after {biz} and host a small number of private sessions for local teams. It would be lovely to connect.', 'Thank you for connecting. We offer private recovery sessions for small teams, a considered thank you at the end of a busy quarter. I can share the details whenever useful.']
  },
  'Warm and nurturing': {
    key: 'warm',
    summary: 'Friendly, caring and personal, like a note from someone who remembers you. Reassuring without being sweet.',
    do: ['Write the way you would talk to a guest at reception', 'Focus on how people feel before, during and after', 'Use first names and say "we" and "you"'],
    avoid: ['Clinical or technical language', 'Pressure or urgency', 'Exclamation marks and emojis'],
    greet: 'Hi', close: 'Take care,',
    hook: 'I wanted to say hello, as we are just around the corner and love welcoming new faces.',
    detail: 'Our hope is simple: that you leave feeling properly looked after.',
    scarcity: 'We have a few spaces this month and I would love to save one for you if the timing feels right.',
    first: 'On your first visit we will sit down together for a few minutes, chat about how you are feeling and shape your time around that. All you need to bring is yourself.',
    last: 'This is my last note for now, I do not want to fill your inbox. Whenever you feel ready, we will be here.',
    welcome: ['We are so glad you found us', 'Thank you for joining {biz}. Here is a little about what to expect, so your first visit feels easy from the moment you arrive.'],
    ig: ['Thank you so much for the follow. We are a small {type} in {city} and love meeting people nearby. Whenever you would like some time for yourself, we would love to look after you.', 'Just letting you know we have a few spaces this month. {offerCap} is a lovely way to start.', 'Saw you had a look at our booking page. Can I help with anything before you book?'],
    li: ['Hi [First name], we are both based in {city}. I run {biz} and look after a few local teams with wellbeing sessions. Thought it would be nice to connect.', 'Thank you for connecting. We host wellbeing sessions for local teams, a kind way to say thank you. Happy to send details whenever it is useful.']
  },
  'Clinical and professional': {
    key: 'clinical',
    summary: 'Clear, precise and evidence-led. Explain what happens and why, then let results speak.',
    do: ['Lead with what the treatment does and who it suits', 'Use accurate terms and explain them simply', 'Be specific about process, timing and aftercare'],
    avoid: ['Vague promises or guaranteed outcomes', 'Overly casual language', 'Exclamation marks and emojis'],
    greet: 'Hi', close: 'Kind regards,',
    hook: 'I am reaching out to a small number of people in {city}, as we have opened appointments for new clients.',
    detail: 'Every plan starts with an assessment, so treatment is based on what your skin or body needs rather than a set menu.',
    scarcity: 'We have limited new client appointments this month and wanted to let you know while they are available.',
    first: 'Your first appointment starts with a consultation and assessment. We explain what we recommend and why, plus the results to expect over time, before any treatment begins.',
    last: 'This is my last email on this. If you would like to book a consultation later, our booking page is always available.',
    welcome: ['Your first visit to {biz}', 'Thank you for choosing {biz}. Here is what your first appointment involves and how to prepare.'],
    ig: ['Thank you for following. We are a {type} in {city} and every treatment starts with an assessment. If you have questions about what might suit you, feel free to ask.', 'We have a few new client appointments this month. {offerCap} is where most people start.', 'I noticed you visited our booking page. If you have questions about which treatment suits you, I can help.'],
    li: ['Hi [First name], we are both in {city}. I run {biz} and we work with local teams on health and recovery. It would be good to connect.', 'Thank you for connecting. We offer on-site and in-clinic sessions for teams focused on recovery and wellbeing. I can send an outline if it is relevant.']
  },
  'Energetic and active': {
    key: 'active',
    summary: 'Upbeat, direct and motivating. Short lines, active words and a clear next step.',
    do: ['Keep sentences short and moving', 'Use action words like move, reset, recover and book', 'Make the next step obvious'],
    avoid: ['Long explanations', 'Passive or formal phrasing', 'Exclamation marks in every line'],
    greet: 'Hey', close: 'See you soon,',
    hook: 'Quick hello from {biz}. We are local to {city} and opening spots for new people this month.',
    detail: 'Come in to recover, reset and get moving again. Then make it part of your week.',
    scarcity: 'A few spots are open this month. Grab one while they are there.',
    first: 'First visit is easy. Arrive, we take you through how it works, then you get straight into it. Book a time that suits and we will handle the rest.',
    last: 'Last one from me. Whenever you are ready to book, the link is below.',
    welcome: ['Welcome to {biz}', 'You are in. Here is everything you need for your first visit, so you can walk in and get started.'],
    ig: ['Thanks for the follow. We are a {type} in {city}. Keen to get you in for a session whenever you are ready.', 'A few spots open this month. {offerCap} is the best place to start.', 'Saw you checking out our booking page. Any questions? Happy to help you lock in a time.'],
    li: ['Hi [First name], we are both in {city}. I run {biz} and work with local teams on recovery and energy. Keen to connect.', 'Thanks for connecting. We run recovery sessions for teams, a good reset at the end of a big quarter. Happy to send details.']
  }
};

/* ---------- Imagery ---------- */
const IMAGERY = {
  'Soft natural light': { look: 'Daylight through windows, soft shadows, gentle warm tones. Calm and airy.', avoid: ['Harsh flash or overhead lighting', 'Heavy filters', 'Busy, cluttered backgrounds'] },
  'Moody and atmospheric': { look: 'Low light, deep shadows, candlelight and steam. Rich, warm tones with a sense of quiet.', avoid: ['Bright, flat lighting', 'Clinical white rooms', 'Stock-style smiling portraits'] },
  'Bright and clean': { look: 'Even, bright light, crisp whites and clear detail. Fresh and uncluttered.', avoid: ['Dark or murky shots', 'Strong colour casts', 'Clutter in frame'] },
  'Earthy and textured': { look: 'Natural materials up close: stone, timber, linen, plants and water. Warm, grounded tones.', avoid: ['Plastic or synthetic props', 'Cold blue tones', 'Glossy studio looks'] },
  'Minimal and editorial': { look: 'Considered framing, lots of space, one subject per shot. Muted palette with a single accent.', avoid: ['Collages and text over images', 'Crowded scenes', 'Bright saturated colour'] }
};
const SHOTS = {
  'Massage, bathhouse, sauna or float': ['Steam rising off water or stone', 'Hands and oil during a massage, face not shown', 'Folded towels and robes ready for a guest'],
  'Facials, skin or LED': ['Products on a tray before a treatment', 'Close crop of hands applying a mask', 'The treatment room, lights low and ready'],
  'Injectables, laser or peels': ['A clean consultation space', 'Practitioner in conversation with a client', 'Detail of aftercare products'],
  'IV, NAD+ or hyperbaric': ['The lounge or chamber set up and waiting', 'A guest relaxing with a book during a session', 'Calm detail of the space, no needles in frame'],
  'Classes': ['Wide shot of the studio before class', 'Movement mid-flow, soft focus on faces', 'Mats, blocks and props laid out'],
  'Retreats': ['The view from the property at first light', 'A shared table set for a meal', 'Quiet moments: journaling, a walk, a swim'],
  'Accommodation': ['A made bed in morning light', 'Bathroom details and amenities', 'The outlook from the room'],
  'Products': ['The product in hand, in use', 'Ingredients or textures up close', 'A styled flat lay in your brand colours']
};

function fill(s, v) { return s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m)); }

export function buildProfile(a) {
  const plan = TIERS[a.plan] ? a.plan : 'growth';
  const biz = clean(a.business_name, 80) || 'your business';
  const city = clean(a.city, 60) || 'your area';
  const owner = clean(a.owner_name, 40);
  const tone = TONES[a.tone] ? a.tone : 'Warm and nurturing';
  const T = TONES[tone];
  const offer = phrase(a.hero_offer);
  const offerCap = offer ? offer[0].toUpperCase() + offer.slice(1) : 'A first visit';
  const type = /bath|spa|sauna/i.test(a.business_type || '') ? 'bathhouse and spa' : /clinic|skin|medi/i.test(a.business_type || '') ? 'clinic' : /studio|yoga|pilates/i.test(a.business_type || '') ? 'studio' : /retreat/i.test(a.business_type || '') ? 'retreat' : 'wellness space';
  const signoff = clean(a.signoff, 80) || [owner, biz].filter(Boolean).join(', ');
  const v = { biz, city, offer, offerCap, type };
  const diff = sentence(a.different) || fill(T.detail, v);

  const greet = T.greet + ' [First name],\n\n';
  const end = '\n\n' + T.close + '\n' + signoff;
  const email = [
    { when: 'First message', s: fill({ luxe: 'A quiet invitation from {biz}', warm: 'A hello from {biz}', clinical: 'New client appointments at {biz}', active: 'Spots open at {biz}' }[T.key], v),
      b: greet + fill(T.hook, v) + '\n\n' + diff + (offer ? '\n\n' + fill({ luxe: 'If you would like somewhere to begin, I would suggest {offer}.', warm: 'If you would like somewhere to start, {offer} is a lovely first visit.', clinical: 'Most new clients start with {offer}.', active: 'Best place to start: {offer}.' }[T.key], v) : '') + end },
    { when: '3 days later', s: fill({ luxe: 'What sets {biz} apart', warm: 'Why people come back to {biz}', clinical: 'How we approach treatment', active: 'Why people keep coming back' }[T.key], v),
      b: greet + { luxe: 'A brief follow up in case my last note arrived at a busy moment.', warm: 'Just following up in case my last note got lost.', clinical: 'Following up on my last email.', active: 'Following up in case my last one got buried.' }[T.key] + '\n\n' + fill(T.detail, v) + end },
    { when: '6 days later', s: { luxe: 'A few places this month', warm: 'A space saved for you', clinical: 'Limited appointments this month', active: 'A few spots left this month' }[T.key],
      b: greet + fill(T.scarcity, v) + end },
    { when: '10 days later', s: { luxe: 'What to expect on your first visit', warm: 'What your first visit looks like', clinical: 'What happens at your first appointment', active: 'Your first visit, in a nutshell' }[T.key],
      b: greet + fill(T.first, v) + end },
    { when: '14 days later', s: { luxe: 'A final note', warm: 'One last note from me', clinical: 'Last email from me', active: 'Last one from me' }[T.key],
      b: greet + fill(T.last, v) + end }
  ].map((e, i) => Object.assign(e, { status: 'Waiting for you', r: '' }));

  const igWhen = ['As soon as they follow back', 'If no reply after 3 days', 'If they visit the booking page but do not book'];
  const liWhen = ['With the connection request', 'When they accept'];

  // Words the client asked to avoid are flagged on any draft that uses them.
  const avoidWords = clean(a.words_avoid, 300).split(/[,\n]/).map(w => w.trim().toLowerCase()).filter(w => w.length > 1);
  const flagged = [];
  email.forEach((e, i) => avoidWords.forEach(w => { if ((e.s + ' ' + e.b).toLowerCase().includes(w)) flagged.push('Email ' + (i + 1) + ' uses "' + w + '"'); }));

  const imgStyle = IMAGERY[a.imagery_style] ? a.imagery_style : 'Soft natural light';
  const people = clean(a.imagery_people, 60) || 'A mix of both';
  const offers = list(a.offers);
  let shots = [];
  offers.forEach(o => (SHOTS[o] || []).forEach(s => { if (shots.length < 6 && shots.indexOf(s) < 0) shots.push(s); }));
  if (!shots.length) shots = ['Your space, ready and empty, in your best light', 'Hands and details mid-treatment', 'The arrival: entrance, reception or first view'];
  if (/only/i.test(people)) shots = shots.map(s => s.replace(/, face not shown|, soft focus on faces/, ''));

  const primary = hex(a.colour_primary), accent = hex(a.colour_accent);

  return {
    plan, planName: TIERS[plan], billing: a.billing === 'yearly' ? 'yearly' : 'monthly',
    venue: { name: biz, place: city, owner, website: clean(a.website, 200) || null, type: clean(a.business_type, 80) },
    brand: { primary, accent, usePrimary: readableOnWhite(primary) },
    goals: {
      revenue: num(a.revenue_goal), current: num(a.current_revenue), newGuests: num(a.new_guest_goal),
      avgVisit: num(a.avg_visit), rebookRate: num(a.rebook_goal), adBudget: clean(a.ad_budget, 40) || null,
      priorities: list(a.priorities)
    },
    offers, heroOffer: clean(a.hero_offer, 300),
    voice: {
      tone, summary: T.summary, do: T.do, avoid: T.avoid,
      own: clean(a.voice_words, 400), love: clean(a.words_love, 300), avoidWords: clean(a.words_avoid, 300),
      sample: clean(a.voice_sample, 1200), signoff, flagged,
      welcome: { subject: fill(T.welcome[0], v), b: greet + fill(T.welcome[1], v) + end }
    },
    imagery: {
      style: imgStyle, look: IMAGERY[imgStyle].look, avoid: IMAGERY[imgStyle].avoid, people,
      palette: [primary, accent].filter(Boolean), inspiration: clean(a.imagery_inspo, 400), shots
    },
    outreach: {
      email,
      instagram: T.ig.map((b, i) => ({ when: igWhen[i], b: fill(b, v) })),
      linkedin: T.li.map((b, i) => ({ when: liWhen[i], b: fill(b, v) }))
    }
  };
}
