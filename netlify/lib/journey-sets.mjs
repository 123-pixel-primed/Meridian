// The guest journeys each kind of business gets. Meridian writes the emails for each one in the client's voice.
const SERVICE = [
  { key: 'welcome', name: 'Welcome', trigger: 'When a guest books for the first time', emails: ['Straight away: booking confirmed and what to expect', 'Two days before: how to prepare and arrive'] },
  { key: 'aftercare', name: 'Aftercare', trigger: 'After every visit', emails: ['Three hours after: thank you and aftercare', 'Next day: a review request'] },
  { key: 'rebooking', name: 'Rebooking', trigger: 'After a visit, when they have not booked again', emails: ['Three weeks after: time for your next visit', 'Five weeks after: a gentle reminder with something to look forward to'] },
  { key: 'winback', name: 'Win back', trigger: 'Guests who have not visited for two months', emails: ['Two months after: we would love to see you again', 'Three months after: a reason to return this month'] }
];
const SETS = {
  retreat: [
    { key: 'enquiry', name: 'Enquiry', trigger: 'When someone asks about a retreat', emails: ['Straight away: what the retreat is like and who it suits', 'Three days after: answers to common questions', 'One week after: places are filling, how to secure yours'] },
    { key: 'prepare', name: 'Before the retreat', trigger: 'When a place is booked', emails: ['Straight away: you are in, what happens next', 'Two weeks before: what to bring and how to arrive'] },
    { key: 'after', name: 'After the retreat', trigger: 'When a retreat ends', emails: ['Two days after: thank you and how to keep the practice going', 'One week after: a review request'] },
    { key: 'next', name: 'Next retreat', trigger: 'Past guests, when new dates open', emails: ['First to know: new dates for past guests', 'One week later: bring a friend'] }
  ],
  clinic: [
    { key: 'consult', name: 'Consultation', trigger: 'When a consultation is booked', emails: ['Straight away: what happens at your consultation', 'Day after the consultation: your treatment plan and next booking'] },
    { key: 'course', name: 'Treatment course', trigger: 'During a course of treatments', emails: ['After each session: aftercare and your next session', 'Halfway: how results build over the course'] },
    { key: 'replenish', name: 'Skincare reorder', trigger: 'Five weeks after a product purchase', emails: ['Running low: time to reorder', 'One week later: a reminder with how to use it best'] },
    { key: 'review', name: 'Review request', trigger: 'After a completed course', emails: ['A week after: how did we do'] }
  ],
  product: [
    { key: 'welcome', name: 'Welcome', trigger: 'When someone joins your list', emails: ['Straight away: welcome and the story behind the brand', 'Two days after: best sellers and who they suit', 'Five days after: a first order offer'] },
    { key: 'cart', name: 'Abandoned cart', trigger: 'When a cart is left without checking out', emails: ['One hour after: you left something behind', 'One day after: answers to common questions', 'Three days after: last reminder'] },
    { key: 'post', name: 'After purchase', trigger: 'After every order', emails: ['When it ships: thank you and how to use it', 'Two weeks after: a review request'] },
    { key: 'reorder', name: 'Reorder', trigger: 'When a product is likely to run out', emails: ['Running low: time to reorder', 'One week later: a reminder'] },
    { key: 'winback', name: 'Win back', trigger: 'Customers who have not ordered for three months', emails: ['Three months after: something new for you', 'Four months after: a reason to come back'] }
  ]
};
export function journeySet(type) {
  const t = String(type || '').toLowerCase();
  if (/retreat/.test(t)) return { kind: 'retreat', set: SETS.retreat };
  if (/skin|aesthetic|clinic|medi/.test(t)) return { kind: 'clinic', set: SETS.clinic };
  if (/product|store|shop|retail|ecommerce/.test(t)) return { kind: 'product', set: SETS.product };
  return { kind: 'service', set: SERVICE };
}
