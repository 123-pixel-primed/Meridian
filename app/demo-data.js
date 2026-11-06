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
