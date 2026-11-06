/* Sample data for the public demo. Lumière Day Spa is a fictional business. */
window.MERIDIAN_DATA = {
  sample: true,
  venue: { name: 'Lumière Day Spa', place: 'Burleigh Heads' },
  period: 'Last 30 days',
  approvalsCount: 4,

  goals: {
    revenue: { actual: 41200, target: 48000 },
    newGuests: { actual: 64, target: 80 },
    rebookRate: { actual: 58, target: 60 }
  },

  stats: [
    { n: '3.4x', l: 'Return on ad spend', d: '+0.6 on last month', needs: 'ads' },
    { n: '58%', l: 'Guests who rebook', d: '+3 points on last month' },
    { n: '486', l: 'Bookings', d: '+9% on last month' },
    { n: '4.8', l: 'Google rating, 126 reviews', d: '+14 reviews this month' },
    { n: '72', l: 'Website score out of 100', d: '+6 since last month', needs: 'website' },
    { n: '68', l: 'Growth Blueprint score', d: '+14 since you joined' }
  ],

  revenueBySource: [
    { l: 'Returning guests', v: 24100 },
    { l: 'Instagram', v: 5200 },
    { l: 'Google search', v: 4300 },
    { l: 'Gift vouchers', v: 2900 },
    { l: 'Paid ads', v: 2900 },
    { l: 'Partner referrals', v: 1800 }
  ],

  weeklyBookings: {
    labels: ['Sep 14', 'Sep 21', 'Sep 28', 'Oct 5', 'Oct 12', 'Oct 19', 'Oct 26', 'Nov 2'],
    values: [98, 104, 101, 112, 109, 118, 121, 126],
    target: 120
  },

  activity: [
    { t: 'Aftercare messages sent', v: '212' },
    { t: 'Messages to new guests', v: '146', needs: 'guests' },
    { t: 'Review requests sent', v: '98' },
    { t: 'Rebooking reminders', v: '74' },
    { t: 'Contacts added to your list', v: '131' },
    { t: 'Questions answered for you', v: '204' }
  ],

  recommendation: {
    t: 'Move $200 of ad budget to Instagram',
    p: 'Instagram is bringing in new guests at $14 each. Google search ads cost $31 for each new guest this month. Moving $200 is likely to add 6 to 8 first visits in December.'
  },

  approvals: [
    { type: 'Social post', title: 'The slow Sunday ritual', when: 'Posts Thu 12 Nov', img: '../demo/images/postvisit-1-water.jpg' },
    { type: 'Review reply', title: 'Reply to a 5 star review about the bathhouse', when: 'Drafted today' },
    { type: 'Blog', title: 'What to expect at your first bathhouse visit', when: 'Publishes Mon 16 Nov', img: '../demo/images/rebooking-3-entrance.jpg' }
  ],

  plan: {
    goal: 'Reach $48,000 a month in revenue by February',
    channels: [
      { l: 'Returning guest journeys', budget: 0, expected: 140, actual: 131 },
      { l: 'Instagram', budget: 300, expected: 22, actual: 24 },
      { l: 'Google search ads', budget: 500, expected: 16, actual: 11 },
      { l: 'Partner referrals', budget: 0, expected: 10, actual: 8 },
      { l: 'Corporate wellness', budget: 0, expected: 6, actual: 4 },
      { l: 'AI assistant ads', budget: 150, expected: 5, actual: 4 }
    ]
  },

  newGuests: {
    funnel: [
      { l: 'Reached', v: 420 },
      { l: 'Replied', v: 96 },
      { l: 'Visited booking page', v: 71 },
      { l: 'Booked a first visit', v: 38 }
    ],
    bySource: [
      { l: 'Instagram', v: 24 },
      { l: 'Google search', v: 15 },
      { l: 'Partner referrals', v: 8 },
      { l: 'Corporate wellness', v: 6 },
      { l: 'Gift voucher recipients', v: 7 },
      { l: 'AI assistant ads', v: 4 }
    ],
    recent: [
      { name: 'Amelia R.', src: 'Instagram', first: 'Signature massage', val: '$185' },
      { name: 'Jordan T.', src: 'Partner referral', first: 'Bathhouse session', val: '$79' },
      { name: 'Priya S.', src: 'Google search', first: 'Hydrating facial', val: '$165' },
      { name: 'Coastline Physio team', src: 'Corporate wellness', first: 'Team recovery morning', val: '$1,240' }
    ]
  },

  bookings: {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    treatments: [62, 58, 70, 74, 86, 94, 88],
    bathhouse: [48, 44, 55, 60, 72, 92, 90],
    today: [
      { time: '9:00', what: 'Bathhouse session, 6 guests', who: 'Sessions room' },
      { time: '10:30', what: 'Signature massage', who: 'Treatment room 2' },
      { time: '11:00', what: 'Bathhouse and massage ritual, 2 guests', who: 'Bathhouse then room 1' },
      { time: '13:15', what: 'Hydrating facial', who: 'Treatment room 3' }
    ],
    vouchers: { outstanding: '$8,450', sold: '$3,120', redeemed: '$2,640' },
    memberships: { active: 64, newThisMonth: 7 }
  },

  returning: {
    rebookRate: { labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], values: [41, 44, 47, 49, 52, 55, 57, 58], target: 60 },
    journeys: [
      { l: 'Welcome', on: true, m: '92% open the first message' },
      { l: 'Aftercare', on: true, m: 'Sent 24 hours after every visit' },
      { l: 'Rebooking', on: true, m: '31% rebook within 6 weeks' },
      { l: 'Win back', on: true, m: '18 lapsed guests returned' },
      { l: 'Membership', on: true, m: '7 new members this month' },
      { l: 'Loyalty', on: true, m: '212 guests earning points' },
      { l: 'Review request', on: true, m: 'Timed to each treatment' }
    ],
    tiers: [
      { l: 'First visit', v: 148 },
      { l: 'Regular', v: 212 },
      { l: 'Member', v: 64 },
      { l: 'Inner circle', v: 21 }
    ]
  },

  reviews: {
    rating: 4.8, total: 126, thisMonth: 14,
    stars: [{ l: '5 stars', v: 104 }, { l: '4 stars', v: 15 }, { l: '3 stars', v: 4 }, { l: '2 stars', v: 2 }, { l: '1 star', v: 1 }],
    monthly: { labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], values: [5, 6, 8, 10, 12, 14] },
    latest: [
      { stars: 5, text: 'Sample review: the bathhouse ritual was the calmest two hours of my month.', reply: 'Drafted' },
      { stars: 4, text: 'Sample review: lovely facial, the waiting area was busy on Saturday.', reply: 'Drafted' }
    ]
  },

  content: [
    { type: 'Social post', title: 'The slow Sunday ritual', when: 'Thu 12 Nov', img: '../demo/images/postvisit-1-water.jpg' },
    { type: 'Social post', title: 'Behind the oil blend', when: 'Sat 14 Nov', img: '../demo/images/rebooking-2-composing.jpg' },
    { type: 'Blog', title: 'What to expect at your first bathhouse visit', when: 'Mon 16 Nov', img: '../demo/images/rebooking-3-entrance.jpg' },
    { type: 'Email', title: 'December gift vouchers are here', when: 'Tue 17 Nov', img: '../demo/images/review-1-ritual-objects.jpg' },
    { type: 'FAQ', title: 'Can I book the bathhouse and a massage together?', when: 'Ready now', img: '../demo/images/postvisit-4-bowls.jpg' }
  ],

  ads: {
    channels: [
      { l: 'Instagram and Facebook', spend: 300, guests: 21, rev: 4700 },
      { l: 'Google search', spend: 500, guests: 16, rev: 3500 },
      { l: 'AI assistant ads', spend: 150, guests: 4, rev: 900 }
    ]
  },

  website: {
    score: 72,
    parts: [
      { l: 'Found by AI assistants', v: 58 },
      { l: 'Content', v: 74 },
      { l: 'Technical health', v: 81 },
      { l: 'Search listing details', v: 66 },
      { l: 'Page speed', v: 77 },
      { l: 'Reviews and reputation', v: 88 }
    ],
    fixes: [
      { t: 'Add answers to the 8 questions guests ask most', i: 'Higher chance of being recommended by AI assistants' },
      { t: 'List each treatment with its price on its own page', i: 'More bookings from search' },
      { t: 'Compress the 12 largest images on the home page', i: 'Home page loads about 2 seconds faster' }
    ],
    history: { labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], values: [54, 57, 61, 63, 66, 72] }
  },

  partners: [
    { name: 'Stillwater Float Studio', where: 'Mermaid Beach', fit: 87, why: 'Same guests at a different point in their week. Their 840 subscribers are mostly women 32 to 55 who value recovery.', idea: 'Swap a feature in each other’s monthly email' },
    { name: 'Coastline Pilates', where: 'Burleigh Heads', fit: 84, why: 'Members book 3 classes a week and ask staff where to recover after.', idea: 'A member offer for a first bathhouse visit' },
    { name: 'Harbour Skin Clinic', where: 'Palm Beach', fit: 79, why: 'Clinical skin results paired with your relaxation treatments, with no overlap.', idea: 'Refer between facials and clinical treatments' }
  ]
};

/* Journey emails shown in the demo. Lumière brand copy from the original demo. */
window.MERIDIAN_DATA.journeyEmails = [
 {
  "name": "Welcome",
  "trigger": "When someone joins your list",
  "emails": [
   {
    "when": "Immediate",
    "subject": "An invitation into Lumière",
    "headline": "There is a world beyond the everyday.",
    "img": "../demo/images/review-1-ritual-objects.jpg"
   },
   {
    "when": "Day 3",
    "subject": "Your first ritual, reserved",
    "headline": "Begin with something chosen for you.",
    "img": "../demo/images/rebooking-2-composing.jpg"
   },
   {
    "when": "Day 7",
    "subject": "The luxury of being known",
    "headline": "The rarest luxury is being known.",
    "img": "../demo/images/postvisit-5-colonnade.jpg"
   },
   {
    "when": "Day 14",
    "subject": "In the words of our guests",
    "headline": "Some experiences are difficult to put into words.",
    "img": "../demo/images/review-3-guest-reflecting.jpg"
   }
  ]
 },
 {
  "name": "Aftercare",
  "trigger": "After every visit",
  "emails": [
   {
    "when": "3hrs post-visit",
    "subject": "The care continues",
    "headline": "Your ritual continues beyond our doors.",
    "img": "../demo/images/postvisit-1-water.jpg"
   },
   {
    "when": "Day 1",
    "subject": "How are you feeling today?",
    "headline": "How has the feeling stayed with you?",
    "img": "../demo/images/postvisit-2-garden.jpg"
   },
   {
    "when": "Day 2 (if positive)",
    "subject": "A reflection, if you wish",
    "headline": "Some experiences stay with us.",
    "img": "../demo/images/postvisit-3-card.jpg"
   },
   {
    "when": "Day 5",
    "subject": "A ritual for the days between",
    "headline": "The space between matters too.",
    "img": "../demo/images/postvisit-4-bowls.jpg"
   },
   {
    "when": "Day 30",
    "subject": "A thought for what comes next",
    "headline": "Care becomes more powerful when it has continuity.",
    "img": "../demo/images/postvisit-5-colonnade.jpg"
   },
   {
    "when": "Week 6",
    "subject": "Your next ritual is ready to be considered",
    "headline": "A natural moment to return.",
    "img": "../demo/images/postvisit-6-curtain.jpg"
   },
   {
    "when": "Week 8 (final)",
    "subject": "An invitation, kept for you",
    "headline": "We know where to begin.",
    "img": "../demo/images/postvisit-7-entryway.jpg"
   }
  ]
 },
 {
  "name": "Rebooking",
  "trigger": "From 6 weeks after a visit",
  "emails": [
   {
    "when": "Day 45",
    "subject": "The right moment to continue",
    "headline": "The best results are rarely created in a single moment.",
    "img": "../demo/images/rebooking-1-resting.jpg"
   },
   {
    "when": "Day 52",
    "subject": "Your care, remembered",
    "headline": "Nothing about your care is off the shelf.",
    "img": "../demo/images/rebooking-2-composing.jpg"
   },
   {
    "when": "Day 60",
    "subject": "Your return to Lumière",
    "headline": "Return to the feeling of Lumière.",
    "img": "../demo/images/rebooking-3-entrance.jpg"
   }
  ]
 },
 {
  "name": "Win back",
  "trigger": "90 days without a visit",
  "emails": [
   {
    "when": "Day 90",
    "subject": "Do you remember how Lumière felt?",
    "headline": "Some feelings are worth returning to.",
    "img": "../demo/images/rebooking-1-resting.jpg"
   },
   {
    "when": "Day 104",
    "subject": "Something new has been composed",
    "headline": "The Lumière experience continues to evolve.",
    "img": "../demo/images/review-2-reflection-card.jpg"
   },
   {
    "when": "Day 118",
    "subject": "A private welcome back",
    "headline": "The door remains open.",
    "img": "../demo/images/postvisit-7-entryway.jpg"
   }
  ]
 },
 {
  "name": "Loyalty",
  "trigger": "At visit milestones",
  "emails": [
   {
    "when": "3rd visit",
    "subject": "You have become part of Lumière",
    "headline": "You are no longer simply visiting Lumière.",
    "img": "../demo/images/postvisit-2-garden.jpg"
   },
   {
    "when": "5th visit",
    "subject": "Something more, reserved for you",
    "headline": "Loyalty should be felt, not counted.",
    "img": "../demo/images/postvisit-4-bowls.jpg"
   },
   {
    "when": "Anniversary",
    "subject": "A year of Lumière",
    "headline": "Some time is worth marking.",
    "img": "../demo/images/postvisit-6-curtain.jpg"
   }
  ]
 }
];

window.MERIDIAN_DATA.venue.headerImage = '../demo/images/postvisit-5-colonnade.jpg';
window.MERIDIAN_DATA.inbox = [
 { name: 'Sophie M.', channel: 'WhatsApp', time: '9:12', status: 'Needs a reply', text: 'Hi, do you have space for two in the bathhouse on Saturday morning?', draft: 'Hi Sophie, we have two places at 9:30 or 11:00 on Saturday. Would you like me to hold one for you?' },
 { name: 'Daniel K.', channel: 'SMS', time: '8:47', status: 'Needs a reply', text: 'Can I move my massage from Thursday to Friday?', draft: 'Hi Daniel, Friday at 2:00 or 4:30 is free with Mia. Which suits you best?' },
 { name: 'Ella W.', channel: 'Instagram', time: 'Yesterday', status: 'Answered', text: 'Do you sell gift vouchers online?', draft: '' },
 { name: 'Coastline Physio', channel: 'Email', time: 'Yesterday', status: 'Answered', text: 'Following up on the team recovery morning for 12 staff.', draft: '' },
 { name: 'Grace L.', channel: 'Website chat', time: 'Mon', status: 'Answered', text: 'Is the bathhouse suitable during pregnancy?', draft: '' }
];

/* Plan the client is on: core, growth or scale. The demo lets visitors switch. */
window.MERIDIAN_DATA.tier = 'growth';

window.MERIDIAN_DATA.audit = {
  joined: 'August 2026',
  baseline: 54,
  now: 68,
  sections: [
    { l: 'Reviews and Google profile', base: 62, now: 84 },
    { l: 'Guest journeys and email', base: 38, now: 76 },
    { l: 'Loyalty and return visits', base: 45, now: 66 },
    { l: 'Website and booking flow', base: 58, now: 71 },
    { l: 'Found by AI assistants', base: 41, now: 58 },
    { l: 'Search and local visibility', base: 60, now: 69 },
    { l: 'Paid ads', base: 50, now: 63 },
    { l: 'Market position', base: 66, now: 70 },
    { l: 'Systems and data', base: 52, now: 74 }
  ],
  next: [
    { t: 'Add treatment pages with prices and booking buttons', i: 'Biggest gap in website and booking flow' },
    { t: 'Answer the 8 questions guests ask most', i: 'Lifts your AI assistant score' },
    { t: 'Invite regulars to membership after their fourth visit', i: 'Lifts loyalty and return visits' }
  ]
};

/* ---------- Restored from the original demo, rewritten for the new dashboard ---------- */
var M = window.MERIDIAN_DATA;
M.venue.owner = 'Amélie';
M.planPrice = { core: 390, growth: 790, scale: 1290 };

M.weeklyInsight = {
  date: 'Mon 2 Nov',
  core: {
    t: 'Wednesday messages are bringing guests back 34% more often than Tuesday ones',
    p: 'Guests who received a come-back message on a Wednesday morning booked at 18%, compared with 14% on Tuesdays. Meridian has moved your next send to Wednesday 10.30am. 84 guests reach 90 days since their last visit in the next 11 days, which is the best moment to invite them back.',
    a: 'Check the come-back message before Wednesday'
  },
  growth: {
    t: 'Instagram is bringing new guests at almost twice the rate of email',
    p: 'Messages to people who follow you back on Instagram lead to a booking 1.9 times more often than first emails. Meridian has lifted next week’s Instagram messages from 32 to 42 and paused LinkedIn while it is reviewed. Women 32 to 42 in Burleigh Heads and Palm Beach are booking at 3.2 times your average.',
    a: 'Approve next week’s Instagram messages'
  }
};

M.setup = [
  { t: 'Your ideal guest confirmed', d: 'Women 35 to 55, Gold Coast and northern NSW' },
  { t: 'Booking, payments and vouchers live', d: 'All treatments, packages and gift vouchers' },
  { t: 'Guest journeys running', d: '6 journeys live, 612 guests on your list' },
  { t: 'Google profile connected', d: '126 reviews, replies drafted for you' },
  { t: 'Messages to new guests approved', d: 'Email, Instagram and LinkedIn', needs: 'guests' }
];

M.status = [
  { t: 'Guest journeys', d: '6 running' },
  { t: 'Review requests', d: 'Timed by treatment' },
  { t: 'Messages to new guests', d: '105 a week', needs: 'guests' },
  { t: 'Instagram messages', d: 'Running', needs: 'guests' },
  { t: 'Content calendar', d: '5 articles this month', needs: 'content' },
  { t: 'Ads', d: '3 channels', needs: 'ads' }
];

M.notifications = [
  { t: 'Sarah M. replied to your email', d: '“This sounds amazing, how do I book?” A reply is drafted for you.', when: '2h ago', go: 'guests', needs: 'guests' },
  { t: 'New 5 star review from Emma C.', d: '“The most considered facial I have ever had.” A reply is drafted.', when: '4h ago', go: 'reviews' },
  { t: 'Article ready for you', d: '“Best day spas in Burleigh Heads: a local guide” is ready to publish.', when: 'Yesterday', go: 'content', needs: 'content' },
  { t: '8 guests close to 45 days since their visit', d: 'A personal note now brings them back 3.4 times more often than the automatic one.', when: 'Yesterday', go: 'returning' },
  { t: 'Weekly check complete', d: 'Everything is running. Your list grew by 14 this week.', when: 'Monday', go: 'overview' }
];

M.attributed = { core: 1560, growth: 3400, scale: 5900 };

M.insights = {
  ownership: { own: 1228, rented: 2480, start: 10, target: 60, note: 'Up from 10% when you joined. Every guest who joins your list moves this toward 60%, which at the current pace you reach by month 8.' },
  behaviour: [
    { l: 'Average first visit', v: '$185', d: 'Most book the 90 minute ritual first' },
    { l: 'Rebook within 60 days', v: '60%', d: 'Reminder sent at day 45' },
    { l: 'Average days to rebook', v: '52', d: 'Down from 61 in August' },
    { l: 'Add an extra treatment by visit 3', v: '40%', d: 'Décolletage is the most popular' },
    { l: 'Leave a Google review', v: '80%', d: 'After the timed review request' },
    { l: 'Value of a guest over 12 months', v: '$740', d: 'At the current rebooking pace' }
  ],
  ages: [ { l: '25 to 34', v: 28 }, { l: '35 to 44', v: 41 }, { l: '45 to 54', v: 22 }, { l: '55 and over', v: 9 } ],
  places: [ { l: 'Burleigh Heads', v: 34 }, { l: 'Palm Beach', v: 22 }, { l: 'Miami', v: 18 }, { l: 'Coolangatta', v: 12 }, { l: 'Other', v: 14 } ],
  bestFit: 'Your best new guest is a woman aged 32 to 42 in Burleigh Heads or Palm Beach who opens the first email within a day. She books at 3.2 times your average.',
  words: [
    { l: '“Biologique Recherche”', open: 55, lift: 34 },
    { l: '“Skin assessed, not script based”', open: 51, lift: 24 },
    { l: '“Waitlist for new guests”', open: 48, lift: 17 },
    { l: '“We keep our list small”', open: 44, lift: 7 },
    { l: '“90 minute” (a specific length)', open: 43, lift: 5 },
    { l: 'General “luxury spa” wording', open: 26, lift: -37 }
  ],
  wordsNote: 'Meridian has updated emails 4 and 5 to lead with Biologique Recherche and removed the “luxury spa” wording.',
  channels: [
    { l: 'Instagram messages', reached: 32, warm: 3, rate: 9.4, note: 'Best rate. People already follow you before the message arrives.' },
    { l: 'Email', reached: 63, warm: 5, rate: 7.9, note: 'Most reach. Best for people new to your name.' },
    { l: 'LinkedIn', reached: 10, warm: 0, rate: 0, note: 'Paused. Better suited to corporate wellness than individual guests.' }
  ],
  telling: [
    { h: 'Who to reach', p: 'Women 32 to 42 in Burleigh Heads and Palm Beach book at 3.2 times your average. Meridian is focusing new messages on these suburbs, likely adding 2 to 3 bookings a month.' },
    { h: 'What to say', p: 'Name Biologique Recherche and say “skin assessed, not script based”. Both are already in your updated messages.' },
    { h: 'Where to focus', p: 'Instagram is your strongest channel right now. The 47 warm replies are worth about $8,700 if they book at your average first visit.' }
  ]
};

M.outreach = {
  stats: [ { n: '1,365', l: 'People reached', d: '105 a week' }, { n: '88', l: 'Interested', d: '+24% on last month' }, { n: '20', l: 'Ready to book', d: 'Replied or visited booking page' }, { n: '38', l: 'First visits booked', d: '+9 on last month' } ],
  email: [
    { s: 'Your skin deserves more than a quick facial', status: 'Approved', when: 'First message', b: 'Hi Sarah,\n\nI noticed you are based in Burleigh and wanted to reach out, as we have just opened a waitlist for new guests at Lumière.\n\nEvery treatment starts with a skin assessment, not a menu. We use Biologique Recherche, a clinical French protocol most Australian spas do not carry. Our 90 minute ritual is shaped around what your skin needs that day.\n\nIf that sounds like what you have been looking for, I would love to hold a spot for you.', r: '41% opened, 68 warm replies' },
    { s: 'What makes Biologique Recherche different', status: 'Approved', when: '3 days later', b: 'Hi Sarah,\n\nFollowing up in case my last note got buried.\n\nOur guests keep coming back because the results build on each other. Most people notice a difference after their first treatment. After three, it is hard to ignore.\n\nWe have two openings this month. Would either suit you?', r: '12% replied' },
    { s: 'A note before the waitlist closes', status: 'Approved', when: '6 days later', b: 'Hi Sarah,\n\nI am closing the waitlist at the end of this week. We keep our books small so every guest gets the same attention.\n\nIf you have been considering it, I can hold your spot until Friday.', r: '8% booked' },
    { s: 'What our guests say after their first visit', status: 'Waiting for you', when: '10 days later', b: 'Hi Sarah,\n\nLast month a new guest told us she had tried six day spas in two years looking for something that worked for her skin. She booked her third visit before she left her first.\n\nThat is what we want for every guest. If you are still curious, I would love to show you.', r: '' },
    { s: 'Last note from me', status: 'Waiting for you', when: '14 days later', b: 'Hi Sarah,\n\nThis is my last note, I do not want to crowd your inbox.\n\nIf the timing is not right, I understand completely. Our booking page is always open whenever it is.\n\nThank you for reading.', r: '' }
  ],
  instagram: [
    { when: 'As soon as they follow back', b: 'Hi Sarah, thank you for the follow. We are a small day spa in Burleigh using Biologique Recherche, if you have ever been curious about it. We keep our guest list small so it stays personal. Would love to have you in whenever the timing is right.' },
    { when: 'If no reply after 3 days', b: 'No pressure, just sharing that we have two openings this month. Our 90 minute ritual is a lovely place to start. Happy to answer any questions.' },
    { when: 'If they visit the booking page but do not book', b: 'Noticed you had a look at our booking page. Is there anything I can help with? We can hold a time for you before it opens to the waitlist.' }
  ],
  igStats: [ { n: '2,140', l: 'Followers reached' }, { n: '47', l: 'Joined your list' }, { n: '2.2%', l: 'Message to booking' } ],
  linkedin: [
    { when: 'With the connection request', b: 'Hi Amelia, I noticed we are both Gold Coast based. I run a small day spa in Burleigh and look after a few local teams with recovery mornings. Thought it would be nice to connect.' },
    { when: 'When they accept', b: 'Thank you for connecting. We host small recovery mornings for local teams, a lovely end of quarter thank you. Happy to send details if it is ever useful.' }
  ],
  channels: [
    { l: 'Email', d: '63 in progress, 105 going out next week', on: true },
    { l: 'Instagram messages', d: '32 in progress, 42 going out next week', on: true },
    { l: 'LinkedIn', d: 'Paused while Meridian reviews results', on: false }
  ],
  ready: [
    { n: 'Sarah M.', w: 'Palm Beach', s: 'Replied: “How do I book?”', c: 'Email', when: 'Today' },
    { n: 'Coastal Health team', w: 'Burleigh Heads', s: 'Asked for a recovery morning quote for 12', c: 'LinkedIn', when: 'Today' },
    { n: '@skin.by.elise', w: 'Miami', s: 'Visited the booking page 3 times', c: 'Instagram', when: 'Yesterday' },
    { n: 'Rachel H.', w: 'Burleigh Heads', s: 'Clicked “Hold my spot”', c: 'Email', when: '2 days ago' },
    { n: '@goldie.wellness', w: 'Currumbin', s: 'Replied: “I would love to know more”', c: 'Instagram', when: '3 days ago' }
  ],
  next: [
    { n: '@coastal.wellness.gc', w: 'Palm Beach', c: 'Instagram', m: 'Follow-back message 1' },
    { n: 'r.hamilton', w: 'Burleigh Heads', c: 'Email', m: 'First message' },
    { n: '@skin.by.elise', w: 'Miami', c: 'Instagram', m: 'Follow-back message 2' },
    { n: 'c.oaten', w: 'Coolangatta', c: 'Email', m: 'First message' }
  ],
  nextMore: 157,
  follows: [ { l: 'Followed', v: 74 }, { l: 'Followed back', v: 42 }, { l: 'In conversation', v: 38 }, { l: 'Replied', v: 6 }, { l: 'Booked', v: 3 } ]
};

M.aiSearch = {
  stats: [ { n: '3', l: 'Times AI assistants named you this month' }, { n: '2', l: 'AI assistants recommending you' }, { n: '#4', l: 'Google position for “day spa Burleigh”' } ],
  question: 'What is the best day spa in Burleigh Heads?',
  answer: 'Lumière Day Spa in Burleigh Heads is often recommended for its Biologique Recherche treatments, a clinical French skincare system not widely available in Australia. Treatments start with a skin assessment rather than a fixed menu, which suits guests looking for visible results.'
};

M.articles = [
  { t: 'What is Biologique Recherche and why is it different?', when: 'Published 4 Oct', status: 'Published', kw: ['biologique recherche australia', 'clinical facial burleigh'], views: 840, clicks: 62, pos: 8 },
  { t: 'Day spa or skin clinic: which suits your skin goals?', when: 'Published 11 Oct', status: 'Published', kw: ['day spa vs skin clinic', 'best facial gold coast'], views: 520, clicks: 38, pos: 12 },
  { t: 'The 28 day skin cycle and why timing matters', when: 'Published 18 Oct', status: 'Published', kw: ['how often should i get a facial'], views: 310, clicks: 19, pos: 14 },
  { t: 'Best day spas in Burleigh Heads: a local guide', when: 'Ready to publish', status: 'Waiting for you', kw: ['best day spa burleigh heads', 'day spa gold coast'], note: 'Written to rank for local “best day spa” searches and to be quoted by AI assistants.' },
  { t: 'Skin assessed, not script based: how Lumière is different', when: 'Ready to publish', status: 'Waiting for you', kw: ['bespoke facial gold coast'], note: 'Gives AI assistants a clear description of what makes you different. It also links to the Biologique Recherche article.' }
];

M.nextMonth = [
  { t: 'Choosing a facial when you have sensitive skin', d: 'Tue 1 Dec' },
  { t: 'Why your skin changes in summer and what helps', d: 'Tue 8 Dec' },
  { t: 'What to expect at your first Lumière visit', d: 'Tue 15 Dec' },
  { t: 'Gift vouchers on the Gold Coast: what to look for', d: 'Tue 22 Dec' }
];

M.partnerDetail = [
  { kind: 'Shared referrals', traits: ['Women 32 to 55 investing in recovery', 'Results over relaxation', 'Spend $150 to $220 a visit', 'Book 4 to 8 weeks ahead'], outcome: 'One email to their 840 subscribers is likely to bring 4 to 7 first visits at no cost.' },
  { kind: 'Member offer', traits: ['Active women 28 to 50', 'Train 3 times a week', 'Already ask where to recover', 'Live within 10 minutes'], outcome: 'A member offer is likely to bring 6 to 10 first visits in the first month.' },
  { kind: 'Two way referrals', traits: ['Skin focused, results led', 'Spend over $300 a visit', 'High rebooking, low price sensitivity', 'Value clinical expertise'], outcome: 'Referring between clinical and spa treatments is likely to bring 8 to 12 introductions over 90 days.' }
];

M.webVisits = {
  stats: [ { n: '1,028', l: 'Visits', d: '+34% on last month' }, { n: '764', l: 'People', d: '+28% on last month' }, { n: '2:41', l: 'Average time on site', d: 'Typical is 1:50' }, { n: '4.2%', l: 'Booking page visitors who book', d: '+0.8 points' } ],
  pages: [ { l: '/book-now', v: 394 }, { l: '/facial-treatments', v: 261 }, { l: '/bathhouse', v: 188 }, { l: 'Home page', v: 147 } ],
  sources: [ { l: 'Google search', v: 438 }, { l: 'Direct', v: 274 }, { l: 'Instagram', v: 168 }, { l: 'Meridian messages', v: 102 }, { l: 'AI assistants', v: 46 } ],
  mobile: 68, local: 73
};

M.chat = {
  hello: 'Hi Amélie, I am Meridian AI. Ask me how to use your dashboard, or for ideas, like which day to run an offer or how to lift a number.',
  prompts: ['How do I fill quiet Tuesdays?', 'What is my rebooking rate?', 'How do I change a message before it sends?', 'Which channel brings the best new guests?'],
  answers: {
    'How do I fill quiet Tuesdays?': 'Tuesdays are about 12% below your weekly average. Three ideas worth testing:<ol><li>Add a Tuesday-only extra, like a complimentary scalp treatment, to your rebooking and come-back messages.</li><li>Send rebooking reminders on Monday evening, when people plan their week.</li><li>Invite guests who have not visited in 90 days to a calmer Tuesday visit.</li></ol>Would you like me to draft any of these?',
    'What is my rebooking rate?': 'Your rebooking rate is 58% for the last 30 days, up 3 points on last month. Your goal is 60%. The 8 guests now close to 45 days since their visit are the quickest way to close the gap.',
    'How do I change a message before it sends?': 'Open the screen the message belongs to, for example New guests for first messages or Returning guests for journeys, then select Edit. Nothing sends until you approve it.',
    'Which channel brings the best new guests?': 'Instagram messages, at 9.4% of people reached becoming interested, compared with 7.9% for email. Meridian has moved more of next week’s messages to Instagram.'
  },
  coreOnly: 'That is part of the Growth plan. On Core I can help with bookings, returning guests, reviews and your Growth Blueprint.',
  fallback: 'In your live account I answer from your own numbers. In this demo, try one of the suggested questions.'
};
