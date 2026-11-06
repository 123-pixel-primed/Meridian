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
    { n: '3.4x', l: 'Return on ad spend', d: '+0.6 on last month' },
    { n: '486', l: 'Bookings', d: '+9% on last month' },
    { n: '4.8', l: 'Google rating, 126 reviews', d: '+14 reviews this month' },
    { n: '72', l: 'Website score out of 100', d: '+6 since last month' }
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
    { t: 'Messages to new guests', v: '146' },
    { t: 'Review requests sent', v: '98' },
    { t: 'Rebooking reminders', v: '74' },
    { t: 'Contacts added to your list', v: '131' }
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
