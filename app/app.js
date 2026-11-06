/* Meridian client app. Renders every screen from window.MERIDIAN_DATA.
   The demo loads sample data; the live app will load each client's data instead. */
(function () {
  var D = window.MERIDIAN_DATA;
  var TEAL = '#5F8F88', GOLD = '#B08D57', TILE = '#EDEAE3', RULE = '#E2DED5', LABEL = '#707070';

  /* ---------- helpers ---------- */
  function $(s) { return document.querySelector(s); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-AU'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function ring(pct, size, stroke, colour, label) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + esc(label || Math.round(p * 100) + ' percent') + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + TILE + '" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (colour || TEAL) + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + (c * p) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg>';
  }

  function bars(rows, fmt, gold, scale) {
    var max = scale || Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    return '<div class="bars">' + rows.map(function (r) {
      return '<div class="bar-row"><span class="lab">' + esc(r.l) + '</span><div class="bar-track"><div class="bar-fill' + (gold ? ' gold' : '') + '" style="width:' + (r.v / max * 100) + '%"></div></div><span class="v">' + (fmt ? fmt(r.v) : r.v) + '</span></div>';
    }).join('') + '</div>';
  }

  /* Line chart with optional target line */
  function line(labels, values, target, opts) {
    opts = opts || {};
    var W = 480, H = opts.h || 220, L = 36, R = 22, T = 14, B = 30;
    var lo = opts.min !== undefined ? opts.min : 0;
    var hi = Math.max.apply(null, values.concat(target || 0)) * 1.12;
    var x = function (i) { return L + i * (W - L - R) / (values.length - 1); };
    var y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); };
    var pts = values.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ');
    var area = 'M' + x(0) + ',' + y(lo) + ' L' + pts.replace(/ /g, ' L') + ' L' + x(values.length - 1) + ',' + y(lo) + 'Z';
    var ticks = [lo, lo + (hi - lo) / 2, hi].map(function (t) {
      return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="' + RULE + '" stroke-width="1"/>' +
        '<text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + Math.round(t) + (opts.suffix || '') + '</text>';
    }).join('');
    var xl = labels.map(function (l, i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>'; }).join('');
    var tl = target ? '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(target) + '" y2="' + y(target) + '" stroke="' + GOLD + '" stroke-width="1.5" stroke-dasharray="5 5"/>' : '';
    var last = values.length - 1;
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.aria || 'Trend chart') + '">' + ticks +
      '<path d="' + area + '" fill="' + TEAL + '" fill-opacity="0.08"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + TEAL + '" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>' +
      tl + '<circle cx="' + x(last) + '" cy="' + y(values[last]) + '" r="4.5" fill="' + TEAL + '"/>' + xl + '</svg>';
  }

  /* Grouped columns: two series per label */
  function columns(labels, a, b, opts) {
    opts = opts || {};
    var W = 480, H = 230, L = 36, R = 8, T = 12, B = 30;
    var hi = Math.max.apply(null, a.concat(b)) * 1.12;
    var slot = (W - L - R) / labels.length, bw = Math.min(18, slot / 3.2);
    var y = function (v) { return T + (1 - v / hi) * (H - T - B); };
    var grid = [0, hi / 2, hi].map(function (t) {
      return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="' + RULE + '"/><text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + Math.round(t) + '</text>';
    }).join('');
    var cols = labels.map(function (l, i) {
      var cx = L + slot * i + slot / 2;
      return '<rect x="' + (cx - bw - 2) + '" y="' + y(a[i]) + '" width="' + bw + '" height="' + (y(0) - y(a[i])) + '" rx="2" fill="' + TEAL + '"/>' +
        '<rect x="' + (cx + 2) + '" y="' + y(b[i]) + '" width="' + bw + '" height="' + (y(0) - y(b[i])) + '" rx="2" fill="' + GOLD + '"/>' +
        '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>';
    }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.aria || 'Column chart') + '">' + grid + cols + '</svg>';
  }

  /* Single-series columns */
  function cols1(labels, values, opts) {
    opts = opts || {};
    var W = 480, H = opts.h || 200, L = 12, R = 12, T = 22, B = 30;
    var hi = Math.max.apply(null, values) * 1.15;
    var slot = (W - L - R) / labels.length, bw = Math.min(34, slot * 0.5);
    var y = function (v) { return T + (1 - v / hi) * (H - T - B); };
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.aria || 'Column chart') + '">' +
      '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="' + RULE + '"/>' +
      labels.map(function (l, i) {
        var cx = L + slot * i + slot / 2, last = i === labels.length - 1;
        return '<rect x="' + (cx - bw / 2) + '" y="' + y(values[i]) + '" width="' + bw + '" height="' + (y(0) - y(values[i])) + '" rx="2" fill="' + (last ? TEAL : '#B9CFCB') + '"/>' +
          '<text x="' + cx + '" y="' + (y(values[i]) - 6) + '" text-anchor="middle" style="fill:#2B2B2B;font-weight:500">' + values[i] + '</text>' +
          '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>';
      }).join('') + '</svg>';
  }

  /* Funnel: widths to scale against the first stage */
  function funnel(rows) {
    var first = rows[0].v;
    return '<div class="bars">' + rows.map(function (r, i) {
      var share = i === 0 ? '' : Math.round(r.v / rows[i - 1].v * 100) + '% of previous';
      return '<div class="bar-row"><span class="lab">' + esc(r.l) + '</span><div class="bar-track" style="height:22px;border-radius:3px"><div class="bar-fill" style="width:' + (r.v / first * 100) + '%;border-radius:3px;opacity:' + (1 - i * 0.17) + '"></div></div><span class="v">' + r.v + '</span></div>' +
        (share ? '<div style="font-size:11.5px;color:' + LABEL + ';margin:-8px 0 0 164px">' + share + '</div>' : '');
    }).join('') + '</div>';
  }

  function panel(title, sub, body, cls, link) {
    return '<section class="panel ' + (cls || '') + '"><div class="panel-head"><h2>' + esc(title) + '</h2>' + (link ? '<a href="' + link[1] + '">' + esc(link[0]) + '</a>' : '') + '</div>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '<div style="height:16px"></div>') + body + '</section>';
  }
  function head(title, sub, right) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + (right || '') + '</div>';
  }
  function approveBtns() {
    return '<div class="actions"><button class="btn ghost" data-act="edit">Edit</button><button class="btn" data-act="approve">Approve</button></div>';
  }

  /* ---------- plans ---------- */
  var TIER_NAMES = { core: 'Core', growth: 'Growth', scale: 'Scale' };
  var TIER_SCREENS = {
    core: ['overview', 'messages', 'bookings', 'returning', 'reviews', 'audit'],
    growth: ['overview', 'messages', 'bookings', 'returning', 'reviews', 'audit', 'plan', 'guests', 'content', 'website', 'partners'],
    scale: ['overview', 'messages', 'bookings', 'returning', 'reviews', 'audit', 'plan', 'guests', 'content', 'website', 'partners', 'ads']
  };
  var UPGRADE = {
    plan: ['Growth', 'A marketing plan built from your goals', ['Set a revenue goal and see the channels and budget to reach it', 'Progress tracked against your goal every week', 'One clear recommendation each Monday']],
    guests: ['Growth', 'New guests, found and messaged for you', ['Personal messages to new guests and local businesses', 'Corporate wellness and partner referrals', 'See every first visit and where it came from']],
    content: ['Growth', 'Content written for you every week', ['Social posts, emails and articles in your voice', 'Approve or edit before anything is published', 'Imagery created in your brand style on Scale']],
    website: ['Growth', 'Get found on Google and AI assistants', ['A monthly website score', 'The fixes that bring the most bookings, made for you', 'Track how often AI assistants recommend you']],
    partners: ['Growth', 'Partner with businesses that share your guests', ['Matched with nearby businesses, never competitors', 'Referral ideas that suit both sides', 'Track partner referrals in your dashboard']],
    ads: ['Scale', 'Ads run and refined for you', ['Instagram, Facebook, Google and AI assistant ads', 'Budget moved to whatever brings bookings', 'Every booking traced to the ad that brought it']]
  };
  function tier() { return D.tier || 'core'; }
  function has(screen) { return TIER_SCREENS[tier()].indexOf(screen) >= 0; }
  function upgradeView(r) {
    var u = UPGRADE[r], title = { plan: 'Plan and goals', guests: 'New guests', content: 'Content', website: 'Website', partners: 'Partners', ads: 'Ads' }[r];
    return head(title, 'Available on the ' + u[0] + ' plan.') +
      '<section class="panel upgrade"><div class="up-mark" aria-hidden="true"></div><h2 class="up-title">' + esc(u[1]) + '</h2><ul class="up-list">' + u[2].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="actions"><a class="btn" href="' + (D.sample ? '../book-a-demo/' : 'mailto:contact@pixelprimed.com?subject=Upgrade%20to%20' + u[0]) + '" style="text-decoration:none">Talk to us about ' + u[0] + '</a></div></section>';
  }

  /* ---------- screens ---------- */
  var V = {};

  V.overview = function () {
    var g = D.goals, rev = g.revenue, pct = rev.actual / rev.target;
    var hero =
      '<section class="panel center"><div class="hero">' +
        '<div class="ring-big">' + ring(pct, 236, 3, TEAL, 'Revenue goal ' + Math.round(pct * 100) + ' percent reached') +
          '<div class="in"><span class="val">' + money(rev.actual) + '</span><span class="of">of ' + money(rev.target) + ' revenue goal</span><span class="pct">' + Math.round(pct * 100) + '% reached</span></div></div>' +
        '<div class="minis">' +
          mini(g.newGuests.actual / g.newGuests.target, g.newGuests.actual, 'New guests', g.newGuests.actual + ' of ' + g.newGuests.target + ' this month') +
          mini(g.rebookRate.actual / g.rebookRate.target, g.rebookRate.actual + '%', 'Guests who rebook', 'Goal is ' + g.rebookRate.target + '%') +
'</div></div></section>';

    var recItem = has('plan') ? '<li><span class="thumb icon" aria-hidden="true">\u2197</span><div class="grow"><div>' + esc(D.recommendation.t) + '</div><div class="meta">Recommendation, <a href="#plan">see why</a></div></div><button class="btn" data-act="approve">Approve</button></li>' : '';
    var msgItems = (D.inbox || []).filter(function (m) { return m.status === 'Needs a reply'; }).map(function (m) {
      return '<li><span class="thumb icon" aria-hidden="true">\u2709</span><div class="grow"><div>Reply to ' + esc(m.name) + '</div><div class="meta">' + esc(m.channel) + ', reply drafted</div></div><a class="btn" href="#messages" style="text-decoration:none">Open</a></li>';
    }).join('');
    recItem = recItem + msgItems;
    var side = panel('Waiting for you', 'Drafted for you to approve', '<ul class="list">' + recItem + D.approvals.filter(function (a) { return has('content') || a.type === 'Review reply'; }).map(function (a) {
      return '<li>' + (a.img ? '<img class="thumb" src="' + a.img + '" alt="">' : '<span class="thumb icon" aria-hidden="true">\u2605</span>') + '<div class="grow"><div>' + esc(a.title) + '</div><div class="meta">' + esc(a.type) + ', ' + esc(a.when) + '</div></div><button class="btn" data-act="approve">Approve</button></li>';
    }).join('') + '</ul>', '', has('content') ? ['See all', '#content'] : null);

    var stats = '<div class="stats-row">' + D.stats.filter(function (s) { return !s.needs || has(s.needs); }).slice(0, 4).map(function (s) {
      return '<section class="panel stat"><span class="n">' + s.n + '</span><span class="l">' + esc(s.l) + '</span><span class="delta">' + esc(s.d) + '</span></section>';
    }).join('') + '</div>';

    var wb = D.weeklyBookings;
    var banner = D.venue.headerImage ? '<div class="banner"><img src="' + D.venue.headerImage + '" alt="' + esc(D.venue.name) + '"></div>' : '';
    return banner + head('Good morning', 'Here is how ' + D.venue.name + ' is tracking against its goals.') +
      '<div class="grid g-hero">' + hero + side + '</div>' +
      '<div style="height:20px"></div>' + stats + '<div style="height:20px"></div>' +
      '<div class="grid g2">' +
        panel('Where revenue came from', D.period, bars(D.revenueBySource, money)) +
        panel('Bookings each week', 'Last 8 weeks, with your weekly goal', line(wb.labels, wb.values, wb.target, { min: 80, aria: 'Weekly bookings rising from 98 to 126' }) + '<div class="legend"><span><i></i>Bookings</span><span><i class="gold"></i>Weekly goal</span></div>') +
      '</div><div style="height:20px"></div>' +
      panel('What Meridian did for you', D.period, '<div class="activity">' + D.activity.filter(function (a) { return !a.needs || has(a.needs); }).map(function (a) {
        return '<div class="stat"><span class="n" style="font-size:26px">' + a.v + '</span><span class="l">' + esc(a.t) + '</span></div>';
      }).join('') + '</div>');
  };
  function mini(p, val, t, d) {
    return '<div class="mini"><div class="mini-ring">' + ring(p, 64, 3, TEAL, t) + '<b>' + val + '</b></div><div><div class="t">' + esc(t) + '</div><div class="d">' + esc(d) + '</div></div></div>';
  }

  V.messages = function () {
    var M = D.inbox || [], open = M.filter(function (m) { return m.status === 'Needs a reply'; }).length;
    var first = M[0];
    var list = '<ul class="inbox">' + M.map(function (m, k) {
      return '<li data-msg="' + k + '" class="' + (k === 0 ? 'sel' : '') + '"><div class="who"><strong>' + esc(m.name) + '</strong><span class="meta">' + esc(m.time) + '</span></div><div class="meta">' + esc(m.text) + '</div><div class="row"><span class="tag">' + esc(m.channel) + '</span>' + (m.status === 'Needs a reply' ? '<span class="tag warn">Needs a reply</span>' : '<span class="tag on">Answered</span>') + '</div></li>';
    }).join('') + '</ul>';
    var thread = threadView(first);
    return head('Messages', 'WhatsApp, text messages, Instagram, email and website chat in one inbox.') +
      '<div class="grid g3">' +
        panel('Waiting for a reply', '', '<div class="stat"><span class="n">' + open + '</span><span class="l">conversations</span></div>') +
        panel('Answered automatically', D.period, '<div class="stat"><span class="n">68%</span><span class="l">of questions about times, prices and vouchers</span></div>') +
        panel('Average reply time', D.period, '<div class="stat"><span class="n">4 min</span><span class="l">down from 3 hours</span></div>') +
      '</div><div style="height:20px"></div>' +
      '<section class="panel inbox-wrap">' + list + '<div id="thread">' + thread + '</div></section>';
  };
  function threadView(first) {
    return '<div class="thread"><div class="thread-head"><strong>' + esc(first.name) + '</strong><span class="tag">' + esc(first.channel) + '</span></div>' +
      '<div class="bubble in">' + esc(first.text) + '</div>' +
      (first.draft ? '<div class="draft"><div class="meta">Suggested reply, checked against your live availability</div><textarea aria-label="Reply">' + esc(first.draft) + '</textarea><div class="actions"><button class="btn ghost" data-act="edit">Edit</button><button class="btn" data-act="approve">Send</button></div></div>' : '<div class="meta">Answered. Nothing waiting.</div>') + '</div>';
  }

  V.audit = function () {
    var a = D.audit, monthly = has('plan');
    var rows = a.sections.map(function (x) {
      var v = monthly ? x.now : x.base;
      return '<div class="bar-row"><span class="lab">' + esc(x.l) + '</span><div class="bar-track" style="position:relative"><div class="bar-fill" style="width:' + v + '%"></div>' + (monthly ? '<span class="base-mark" style="left:' + x.base + '%" title="When you joined: ' + x.base + '"></span>' : '') + '</div><span class="v">' + v + (monthly ? ' <small class="up">+' + (x.now - x.base) + '</small>' : '') + '</span></div>';
    }).join('');
    var score = monthly ? a.now : a.baseline;
    return head('Growth Blueprint', monthly ? 'Updated every month and compared with your first Blueprint in ' + a.joined + '.' : 'Your Blueprint from when you joined in ' + a.joined + '. Monthly updates come with Growth.', '<button class="btn ghost" data-act="edit">Download your Blueprint</button>') +
      '<section class="panel"><div class="hero"><div class="ring-big">' + ring(score / 100, 236, 3, TEAL, 'Blueprint score ' + score) + '<div class="in"><span class="val">' + score + '</span><span class="of">out of 100</span>' + (monthly ? '<span class="pct">+' + (a.now - a.baseline) + ' since you joined</span>' : '<span class="pct" style="color:' + LABEL + '">Starting point</span>') + '</div></div>' +
      '<div style="width:100%;max-width:640px"><div class="bars wide">' + rows + '</div>' + (monthly ? '<div class="legend"><span><i></i>This month</span><span><i class="gold" style="width:2px;height:10px"></i>When you joined</span></div>' : '') + '</div></div></section>' +
      '<div style="height:20px"></div>' +
      panel('Biggest opportunities now', 'Ranked by likely effect on bookings', '<ul class="list">' + a.next.map(function (f) {
        return '<li><span class="dot gold"></span><div class="grow"><div>' + esc(f.t) + '</div><div class="meta">' + esc(f.i) + '</div></div><button class="btn" data-act="approve">Approve</button></li>';
      }).join('') + '</ul>');
  };

  V.plan = function () {
    var c = D.plan.channels;
    var spend = c.reduce(function (s, r) { return s + r.budget; }, 0);
    var rows = c.map(function (r) {
      var p = r.actual / r.expected;
      return '<li><div class="mini-ring" style="width:44px;height:44px">' + ring(p, 44, 3, p >= 1 ? TEAL : GOLD, r.l) + '</div><div class="grow"><div>' + esc(r.l) + '</div><div class="meta">' + (r.budget ? money(r.budget) + ' a month' : 'No ad spend') + '</div></div><div style="text-align:right"><div style="font-weight:600">' + r.actual + ' of ' + r.expected + '</div><div class="meta">new guests or bookings</div></div></li>';
    }).join('');
    return head('Plan and goals', D.plan.goal + '.', '<button class="btn ghost" data-act="edit">Change goals</button>') +
      '<div class="grid g3">' +
        panel('Monthly ad budget', 'Recommended to reach your goal', '<div class="stat"><span class="n">' + money(spend) + '</span><span class="l">across 3 paid channels</span></div>') +
        panel('Expected new guests', 'From the plan this month', '<div class="stat"><span class="n">' + c.slice(1).reduce(function (s, r) { return s + r.expected; }, 0) + '</span><span class="l">first visits</span></div>') +
        panel('On track', 'Channels meeting their target', '<div class="stat"><span class="n">' + c.filter(function (r) { return r.actual >= r.expected; }).length + ' of ' + c.length + '</span><span class="l">channels</span></div>') +
      '</div><div style="height:20px"></div>' +
      '<div class="grid g-hero">' +
        panel('Channel plan', 'Rings fill as each channel reaches its target. Gold means behind.', '<ul class="list">' + rows + '</ul>') +
        panel('This week’s recommendation', 'Reviewed every Monday from your results', '<div class="rec"><div class="t">' + esc(D.recommendation.t) + '</div><p>' + esc(D.recommendation.p) + '</p><div class="actions"><button class="btn ghost" data-act="later">Not now</button><button class="btn" data-act="approve">Approve</button></div></div>') +
      '</div>';
  };

  V.bookings = function () {
    var b = D.bookings;
    return head('Bookings', 'Treatments and bathhouse sessions this week.') +
      '<div class="grid g-hero">' +
        panel('Bookings by day', 'This week', columns(b.days, b.treatments, b.bathhouse, { aria: 'Bookings by day, treatments and bathhouse sessions' }) + '<div class="legend"><span><i></i>Treatments</span><span><i class="gold"></i>Bathhouse sessions</span></div>') +
        panel('Today', 'Next four bookings', '<ul class="list">' + b.today.map(function (t) {
          return '<li><span style="font-weight:600;width:48px">' + t.time + '</span><div class="grow"><div>' + esc(t.what) + '</div><div class="meta">' + esc(t.who) + '</div></div></li>';
        }).join('') + '</ul>') +
      '</div><div style="height:20px"></div><div class="grid g3">' +
        panel('Gift vouchers', 'Unredeemed balance', '<div class="stat"><span class="n">' + b.vouchers.outstanding + '</span><span class="l">' + b.vouchers.sold + ' sold and ' + b.vouchers.redeemed + ' redeemed this month</span></div>') +
        panel('Memberships', 'Active members', '<div class="stat"><span class="n">' + b.memberships.active + '</span><span class="delta">+' + b.memberships.newThisMonth + ' this month</span></div>') +
        panel('Busiest time', 'Plan staffing and offers', '<div class="stat"><span class="n">Sat</span><span class="l">Bathhouse fills by 10am</span></div>') +
      '</div>';
  };

  V.guests = function () {
    var n = D.newGuests;
    return head('New guests', 'People reached for the first time and how many booked.') +
      '<div class="grid g2">' +
        panel('From first message to first visit', D.period, funnel(n.funnel)) +
        panel('Where new guests came from', D.period, bars(n.bySource)) +
      '</div><div style="height:20px"></div>' +
      panel('Recent first visits', '', '<ul class="list">' + n.recent.map(function (r) {
        return '<li><span class="dot"></span><div class="grow"><div>' + esc(r.name) + '</div><div class="meta">' + esc(r.first) + '</div></div><span class="tag">' + esc(r.src) + '</span><span style="width:70px;text-align:right;font-weight:500">' + r.val + '</span></li>';
      }).join('') + '</ul>');
  };

  V.returning = function () {
    var r = D.returning, rr = r.rebookRate;
    return head('Returning guests', 'The messages that bring guests back and how well they work.') +
      '<div class="grid g-hero">' +
        panel('Guests who rebook', 'Share of guests booking again within 90 days', line(rr.labels, rr.values, rr.target, { suffix: '%', min: 30, aria: 'Rebooking rate rising from 41 to 58 percent' }) + '<div class="legend"><span><i></i>Rebooking rate</span><span><i class="gold"></i>Goal, ' + rr.target + '%</span></div>') +
        panel('Loyalty', 'Guests at each level', bars(r.tiers, null, true)) +
      '</div><div style="height:20px"></div>' +
      journeysPanel();
  };
  function journeysPanel() {
    var J = D.journeyEmails || [];
    if (!J.length) return '';
    var tabs = J.map(function (j, k) { return '<button class="tab" role="tab" aria-selected="' + (k === 0) + '" data-journey="' + k + '">' + esc(j.name) + '<span>' + j.emails.length + '</span></button>'; }).join('');
    return panel('Guest journeys', 'Every journey is running. Select one to see its messages.', '<div class="tabs" role="tablist">' + tabs + '</div><div id="journey-view">' + journeyView(0) + '</div>');
  }
  function journeyView(k) {
    var j = D.journeyEmails[k];
    return '<p class="trigger">Starts: ' + esc(j.trigger) + '</p><div class="emails">' + j.emails.map(function (e) {
      return '<article class="email"><div class="email-when">' + esc(e.when) + '</div><div class="email-card"><img src="' + e.img + '" alt=""><div class="email-body"><div class="email-brand">' + esc(D.venue.name) + '</div><div class="email-head">' + esc(e.headline) + '</div><div class="email-rule"></div><div class="email-btn">Book now</div></div></div><div class="email-subj">' + esc(e.subject) + '</div></article>';
    }).join('') + '</div>';
  }


  V.reviews = function () {
    var r = D.reviews;
    return head('Reviews', 'Your Google reviews belong to your business and stay with you.') +
      '<div class="grid g3">' +
        panel('Google rating', r.total + ' reviews', '<div class="stat"><span class="n">' + r.rating + '</span><span class="delta">+' + r.thisMonth + ' this month</span></div>') +
        panel('New reviews each month', '', cols1(r.monthly.labels, r.monthly.values, { h: 150, aria: 'New reviews per month rising to 14' }), 'span2') +
      '</div><div style="height:20px"></div><div class="grid g2">' +
        panel('Ratings', '', bars(r.stars)) +
        panel('Replies waiting for you', 'Drafted for your approval', '<ul class="list">' + r.latest.map(function (l) {
          return '<li><div class="grow"><div style="color:' + GOLD + ';letter-spacing:2px">' + '★'.repeat(l.stars) + '</div><div>' + esc(l.text) + '</div></div>' + approveBtns() + '</li>';
        }).join('') + '</ul>') +
      '</div>';
  };

  V.content = function () {
    return head('Content', 'Drafted for you. Nothing is published until you approve it.') +
      '<div class="grid g3">' + D.content.map(function (c) {
        return '<section class="panel" style="padding:0;overflow:hidden"><img src="' + c.img + '" alt="" style="width:100%;height:180px;object-fit:cover;display:block"><div style="padding:18px 20px 20px"><div class="meta" style="font-size:12px;color:' + LABEL + '">' + esc(c.type) + ', ' + esc(c.when) + '</div><div style="font-weight:500;margin:4px 0 16px">' + esc(c.title) + '</div>' + approveBtns() + '</div></section>';
      }).join('') + '</div>';
  };

  V.ads = function () {
    var c = D.ads.channels;
    var spend = c.reduce(function (s, r) { return s + r.spend; }, 0), rev = c.reduce(function (s, r) { return s + r.rev; }, 0);
    return head('Ads', 'What your ad budget returned. Ad spend is charged to your own account.') +
      '<div class="grid g3">' +
        panel('Spent', D.period, '<div class="stat"><span class="n">' + money(spend) + '</span></div>') +
        panel('Revenue from ads', D.period, '<div class="stat"><span class="n">' + money(rev) + '</span></div>') +
        panel('Return', 'Revenue for every dollar spent', '<div class="stat"><span class="n">' + (rev / spend).toFixed(1) + 'x</span></div>') +
      '</div><div style="height:20px"></div><div class="grid g2">' +
        panel('Cost for each new guest', 'Lower is better', bars(c.map(function (r) { return { l: r.l, v: Math.round(r.spend / r.guests) }; }), money, true)) +
        panel('New guests from ads', D.period, bars(c.map(function (r) { return { l: r.l, v: r.guests }; }))) +
      '</div>';
  };

  V.website = function () {
    var w = D.website;
    return head('Website', 'How easily guests and AI assistants can find and book you. Checked monthly.') +
      '<section class="panel"><div class="hero"><div class="ring-big">' + ring(w.score / 100, 236, 3, TEAL, 'Website score ' + w.score) + '<div class="in"><span class="val">' + w.score + '</span><span class="of">out of 100</span><span class="pct">+6 since last month</span></div></div>' +
      '<div style="width:100%;max-width:560px">' + bars(w.parts, null, false, 100) + '</div></div></section>' +
      '<div style="height:20px"></div><div class="grid g2">' +
        panel('Score over time', 'Last 6 months', line(w.history.labels, w.history.values, null, { min: 40, aria: 'Website score rising from 54 to 72', h: 220 })) +
        panel('Top fixes this month', 'We can make these changes for you', '<ul class="list">' + w.fixes.map(function (f) {
          return '<li><span class="dot gold"></span><div class="grow"><div>' + esc(f.t) + '</div><div class="meta">' + esc(f.i) + '</div></div><button class="btn" data-act="approve">Approve</button></li>';
        }).join('') + '</ul>') +
      '</div>';
  };

  V.partners = function () {
    return head('Partners', 'Businesses on Meridian whose guests are a natural fit for yours.') +
      '<div class="grid g3">' + D.partners.map(function (p) {
        return '<section class="panel"><div style="display:flex;align-items:center;gap:14px;margin-bottom:14px"><div class="mini-ring">' + ring(p.fit / 100, 64, 3, TEAL, 'Guest fit ' + p.fit + ' percent') + '<b>' + p.fit + '%</b></div><div><div style="font-weight:600">' + esc(p.name) + '</div><div class="meta" style="font-size:12.5px;color:' + LABEL + '">' + esc(p.where) + ', guest fit</div></div></div>' +
          '<p style="font-size:13.5px;color:#4A4A48;margin-bottom:12px">' + esc(p.why) + '</p><p style="font-size:13px;margin-bottom:16px"><strong style="font-weight:600">Idea:</strong> ' + esc(p.idea) + '</p>' +
          '<div class="actions"><button class="btn ghost" data-act="later">Not now</button><button class="btn" data-act="interest">Express interest</button></div></section>';
      }).join('') + '</div>';
  };

  /* ---------- routing ---------- */
  var routes = ['overview', 'messages', 'audit', 'plan', 'bookings', 'guests', 'returning', 'reviews', 'content', 'ads', 'website', 'partners'];
  function render() {
    var r = (location.hash || '#overview').slice(1);
    if (routes.indexOf(r) < 0) r = 'overview';
    $('#page').innerHTML = has(r) ? V[r]() : upgradeView(r);
    document.querySelectorAll('.nav a').forEach(function (a) {
      var key = a.getAttribute('href').slice(1);
      if (key === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      var locked = !has(key);
      a.classList.toggle('locked', locked);
      var lk = a.querySelector('.lock');
      if (locked && !lk) { lk = document.createElement('span'); lk.className = 'lock'; a.appendChild(lk); }
      if (lk) lk.textContent = locked ? (UPGRADE[key] ? UPGRADE[key][0] : '') : '';
      if (!locked && lk) lk.remove();
    });
    var pl = $('#plan-name'); if (pl) pl.textContent = TIER_NAMES[tier()];
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  /* ---------- actions ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  document.addEventListener('click', function (e) {
    var mm = e.target.closest('[data-msg]');
    if (mm) {
      document.querySelectorAll('[data-msg]').forEach(function (x) { x.classList.toggle('sel', x === mm); });
      document.getElementById('thread').innerHTML = threadView(D.inbox[+mm.getAttribute('data-msg')]);
      return;
    }
    var t = e.target.closest('[data-journey]');
    if (t) {
      document.querySelectorAll('[data-journey]').forEach(function (x) { x.setAttribute('aria-selected', x === t); });
      document.getElementById('journey-view').innerHTML = journeyView(+t.getAttribute('data-journey'));
      return;
    }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'approve') { b.textContent = 'Approved'; b.className = 'btn done'; b.disabled = true; toast(D.sample ? 'Approved. In the demo nothing is sent.' : 'Approved'); }
    else if (act === 'interest') { b.textContent = 'Interest sent'; b.className = 'btn done'; b.disabled = true; toast(D.sample ? 'Interest sent. In the demo nothing is sent.' : 'Interest sent'); }
    else if (act === 'edit') { toast('Editing opens here in the full version'); }
    else if (act === 'later') { var p = b.closest('.rec, .panel, li'); if (p) p.style.opacity = '.45'; toast('Saved for later'); }
  });

  /* ---------- start ---------- */
  $('#venue').innerHTML = esc(D.venue.name) + '<span>' + esc(D.venue.place) + '</span>';
  if (!D.sample) { var s = $('.sample'); if (s) s.remove(); }
  var c = $('#approvals-count'); if (c) c.textContent = D.approvalsCount;
  var mc = $('#messages-count'); if (mc) mc.textContent = (D.inbox || []).filter(function (m) { return m.status === 'Needs a reply'; }).length;
  var sw = $('#tier-switch');
  if (sw) {
    if (!D.sample) sw.remove();
    else { sw.value = tier(); sw.addEventListener('change', function () { D.tier = sw.value; render(); }); }
  }
  render();
})();
