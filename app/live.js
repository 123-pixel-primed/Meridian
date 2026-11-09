/* Client dashboard: loads the Meridian Sandbox through /.netlify/functions/sandbox-data
   and lays it over the dashboard data model. Areas not yet connected keep the sample
   content and are labelled as sample in the banner. */
(function () {
  var D = window.MERIDIAN_DATA;
  var DAY = 86400000, now = Date.now();
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function startOfWeek(t) { var d = new Date(t); var k = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); return d.getTime() - k * DAY; }
  function hm(t) { var d = new Date(t); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function short(t) { return new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-AU'); }
  function channel(type) {
    var t = String(type).toUpperCase();
    if (t.indexOf('WHATSAPP') >= 0) return 'WhatsApp';
    if (t.indexOf('SMS') >= 0) return 'SMS';
    if (t.indexOf('EMAIL') >= 0) return 'Email';
    if (t.indexOf('IG') >= 0 || t.indexOf('INSTAGRAM') >= 0) return 'Instagram';
    if (t.indexOf('FB') >= 0 || t.indexOf('FACEBOOK') >= 0) return 'Facebook';
    if (t.indexOf('LIVE_CHAT') >= 0 || t.indexOf('WEBCHAT') >= 0) return 'Website chat';
    return 'Message';
  }
  function when(t) {
    if (!t) return '';
    if (now - t < DAY && new Date(t).getDate() === new Date().getDate()) return hm(t);
    if (now - t < 2 * DAY) return 'Yesterday';
    return short(t);
  }

  function apply(S) {
    var cal = { services: { id: 'services', name: 'Treatment', type: 'service', seats: 1 } }; S.calendars.forEach(function (c) { cal[c.id] = c; });
    var isClass = function (e) { var c = cal[e.calendarId]; return c && /class/i.test(c.type); };
    var ok = S.events.filter(function (e) { return !/cancel|invalid|noshow/i.test(e.status) && e.start; });
    var past30 = ok.filter(function (e) { return e.start <= now && e.start > now - 30 * DAY; });

    // Venue
    if (S.location) { D.venue.name = S.location.name; D.venue.place = S.location.city || 'Sandbox'; }

    // Bookings this week by day
    var w0 = startOfWeek(now), tr = [0, 0, 0, 0, 0, 0, 0], ba = [0, 0, 0, 0, 0, 0, 0];
    ok.forEach(function (e) { var i = Math.floor((e.start - w0) / DAY); if (i >= 0 && i < 7) (isClass(e) ? ba : tr)[i]++; });
    D.bookings.days = DAYS; D.bookings.treatments = tr; D.bookings.bathhouse = ba;

    // Next bookings
    var next = ok.filter(function (e) { return e.end >= now; }).sort(function (a, b) { return a.start - b.start; }).slice(0, 4);
    D.bookings.todayTitle = 'Coming up';
    D.bookings.today = next.map(function (e) { return { time: hm(e.start), what: e.title, who: short(e.start) + ', ' + (cal[e.calendarId] ? cal[e.calendarId].name : '') }; });

    // Seats in upcoming class sessions
    var sess = {};
    ok.filter(function (e) { return isClass(e) && e.start >= now; }).forEach(function (e) {
      var k = e.calendarId + '|' + e.start;
      if (!sess[k]) sess[k] = { l: (cal[e.calendarId] ? cal[e.calendarId].name.replace(' Mineral Bathing', '') : 'Session') + ', ' + short(e.start) + ' ' + hm(e.start), booked: 0, seats: cal[e.calendarId] ? cal[e.calendarId].seats : 1, t: e.start };
      sess[k].booked++;
    });
    D.bookings.sessions = Object.keys(sess).map(function (k) { return sess[k]; }).sort(function (a, b) { return a.t - b.t; }).slice(0, 6);

    // Weekly bookings, last 8 weeks
    var labels = [], vals = [];
    for (var i = 7; i >= 0; i--) {
      var ws = w0 - i * 7 * DAY;
      labels.push(short(ws));
      vals.push(ok.filter(function (e) { return e.start >= ws && e.start < ws + 7 * DAY; }).length);
    }
    D.weeklyBookings = { labels: labels, values: vals, target: null };

    // Rebooking: guests with two or more bookings
    var per = {}; ok.forEach(function (e) { if (e.contactId) per[e.contactId] = (per[e.contactId] || 0) + 1; });
    var guests = Object.keys(per).length, repeat = Object.keys(per).filter(function (k) { return per[k] > 1; }).length;
    var rebook = guests ? Math.round(repeat / guests * 100) : 0;

    // Revenue from payments in the last 30 days
    var paid = S.transactions.filter(function (t) { return t.date && t.date > now - 30 * DAY && !/fail|refund/i.test(t.status); });
    var revenue = paid.reduce(function (s, t) { return s + t.amount; }, 0);
    var bySrc = {}; paid.forEach(function (t) { bySrc[t.source] = (bySrc[t.source] || 0) + t.amount; });
    D.revenueBySource = Object.keys(bySrc).map(function (k) { return { l: k, v: bySrc[k] }; }).sort(function (a, b) { return b.v - a.v; });
    var testOnly = paid.length && paid.every(function (t) { return !t.live; });

    // New guests
    var newC = S.contacts.filter(function (c) { return c.added && c.added > now - 30 * DAY; });
    D.newGuests.recent = S.contacts.slice().sort(function (a, b) { return (b.added || 0) - (a.added || 0); }).slice(0, 4).map(function (c) {
      return { name: c.name, src: c.source || 'Booking', first: c.added ? 'Added ' + short(c.added) : '', val: '' };
    });

    // Goals: live actuals against the sandbox targets
    D.goals.revenue.actual = revenue;
    D.goals.newGuests.actual = newC.length;
    D.goals.rebookRate.actual = rebook;

    // Headline stats that are live
    D.stats = D.stats.map(function (s) {
      if (s.l === 'Bookings') return { n: String(past30.length), l: 'Bookings, last 30 days', d: 'Live from the sandbox' };
      if (s.l === 'Guests who rebook') return { n: rebook + '%', l: 'Guests who rebook', d: repeat + ' of ' + guests + ' guests' };
      return s;
    });

    // Inbox
    D.inbox = S.conversations.map(function (c) {
      return { name: c.name, channel: channel(c.type), time: when(c.date), status: c.unread > 0 || c.inbound ? 'Needs a reply' : 'Answered', text: c.text || '(no text)', draft: '' };
    });

    if (S.web) {
      var W = S.web, n = W.now, b = W.before;
      var ch = function (a, c) { if (!c) return 'First month connected'; var d = Math.round(100 * (a - c) / c); return (d >= 0 ? '+' : '') + d + '% on last month'; };
      var secs = Math.round(n[2]);
      D.webVisits = {
        stats: [
          { n: Math.round(n[0]).toLocaleString('en-AU'), l: 'Visits', d: ch(n[0], b[0]) },
          { n: Math.round(n[1]).toLocaleString('en-AU'), l: 'People', d: ch(n[1], b[1]) },
          { n: Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'), l: 'Average time on site', d: 'Last 30 days' },
          { n: Math.round(n[3] * 100) + '%', l: 'Visits where people engaged', d: 'Read, scrolled or clicked' }
        ],
        pages: W.pages.length ? W.pages : [{ l: 'No visits yet', v: 0 }],
        sources: W.sources.length ? W.sources : [{ l: 'No visits yet', v: 0 }],
        mobile: W.mobile,
        local: W.topCity ? W.topCity.share : 0,
        localLabel: W.topCity ? 'From ' + W.topCity.name : 'Top city',
        localSub: 'Your biggest single city'
      };
    }
    if (S.search && S.search.connected) D.searchTerms = S.search;
    if (S.social && S.social.accounts && S.social.accounts.length && S.social.stats) {
      var st = S.social.stats, bd = st.breakdowns || {}, tot = st.totals || {};
      var eng = (bd.engagement && bd.engagement.instagram) || {};
      var pct = function (c, v) { if (v === 0) return 'None this week'; var n = Number(c); return isFinite(n) && c !== undefined ? (n >= 0 ? '+' : '') + Math.round(n) + '% on the week before' : 'Last 7 days'; };
      D.socialLive = {
        accounts: S.social.accounts.map(function (a) { return a.platform.charAt(0).toUpperCase() + a.platform.slice(1) + ' @' + a.name; }),
        stats: [
          { n: tot.posts || 0, l: 'Posts', d: pct(bd.posts && bd.posts.totalChange, tot.posts || 0) },
          { n: (bd.reach && bd.reach.total) || 0, l: 'People reached', d: pct(bd.reach && bd.reach.totalChange, (bd.reach && bd.reach.total) || 0) },
          { n: tot.impressions || 0, l: 'Times seen', d: pct(bd.impressions && bd.impressions.totalChange, tot.impressions || 0) },
          { n: (tot.likes || 0) + (tot.comments || 0), l: 'Likes and comments', d: pct(eng.change) }
        ],
        likes: (st.postPerformance && st.postPerformance.likes) || [],
        days: st.dayRange || []
      };
    }
    D.liveNote = 'Live from ' + D.venue.name + ': bookings, bathing session places, guests, messages and payments' + (testOnly ? ' (test payments)' : '') + (S.web ? ', plus website visits' + (S.search && S.search.connected ? ', Google searches' : '') + (S.social && S.social.stats ? ', Instagram' : '') + ' and the website score' : '') + '. Other panels show sample content until they are connected.';
    if (S.errors && S.errors.length) D.liveNote += ' Some data could not be read: ' + S.errors.join('; ') + '.';
  }

  // Latest Website score check, saved as a file by the monthly audit.
  function loadScore() {
    return fetch('website-score.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (W) {
      if (!W) return;
      D.website = { score: W.score, delta: W.delta, parts: W.parts, fixes: W.fixes, history: W.history, live: true, checked: W.checked };
      D.stats.forEach(function (s) { if (/Website score/.test(s.l)) { s.n = String(W.score); s.d = W.delta; } if (/Google rating/.test(s.l)) { s.d = 'Sample until Google reviews connect'; } });
    }).catch(function () {});
  }

  // Turn live figures into plain recommendations at the top of the Website page's fixes.
  function deriveInsights() {
    var G = D.searchTerms; if (!G || !G.now || !G.terms) return;
    var root = String(G.site || '').replace(/^sc-domain:|^https?:\/\/(www\.)?/g, '').split('.')[0].toLowerCase();
    var squash = function (t) { return t.toLowerCase().replace(/[^a-z0-9]/g, ''); };
    var brand = G.terms.filter(function (t) { return root && squash(t.term).indexOf(root) >= 0; }).reduce(function (a, t) { return a + t.clicks; }, 0);
    var total = G.now.clicks || 0, share = total ? Math.round(100 * brand / total) : 0;
    var add = [];
    if (total && share >= 60) add.push({ t: 'Win searches from people who do not know your name yet', i: share + '% of Google clicks come from people searching your name. Short answer sections and service details help you appear for the services you offer' });
    var p0 = G.before && G.before.position, p1 = G.now.position;
    if (p0 && p1 && p1 - p0 >= 1.5) add.push({ t: 'Lift your average Google position back up', i: 'It moved from ' + (Math.round(p0 * 10) / 10) + ' to ' + (Math.round(p1 * 10) / 10) + ' over the last 4 weeks. Refreshing your top pages usually helps' });
    if (add.length && D.website && D.website.fixes) D.website.fixes = add.concat(D.website.fixes).slice(0, 6);
    D.searchInsight = total ? (share >= 60 ? 'Most of your Google clicks (' + share + '%) come from people who already know your name. Growth will come from appearing for the services you offer.' : 'Most Google clicks come from searches for your services, not just your name.') : null;
  }

  function boot() { var s = document.createElement('script'); s.src = 'app.js'; document.body.appendChild(s); }

  fetch('/.netlify/functions/sandbox-data', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (S) {
      if (S && S.connected) apply(S);
      else D.liveNote = (S && S.reason ? S.reason + ' ' : '') + 'Showing sample content for now.';
    })
    .catch(function () { D.liveNote = 'The sandbox could not be reached. Showing sample content for now.'; })
    .then(loadScore)
    .then(deriveInsights)
    .then(boot);
})();
