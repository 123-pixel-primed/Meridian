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
    var cal = {}; S.calendars.forEach(function (c) { cal[c.id] = c; });
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
    D.liveNote = 'Live from ' + D.venue.name + ': bookings, bathing session places, guests, messages and payments' + (testOnly ? ' (test payments)' : '') + (S.web ? ', plus website visits' : '') + '. Other panels show sample content until they are connected.';
    if (S.errors && S.errors.length) D.liveNote += ' Some data could not be read: ' + S.errors.join('; ') + '.';
  }

  function boot() { var s = document.createElement('script'); s.src = 'app.js'; document.body.appendChild(s); }

  fetch('/.netlify/functions/sandbox-data', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (S) {
      if (S && S.connected) apply(S);
      else D.liveNote = (S && S.reason ? S.reason + ' ' : '') + 'Showing sample content for now.';
    })
    .catch(function () { D.liveNote = 'The sandbox could not be reached. Showing sample content for now.'; })
    .then(boot);
})();
