/* Meridian client app. Renders every screen from window.MERIDIAN_DATA.
   The demo loads sample data; the live app will load each client's data instead. */
(function () {
  var D = window.MERIDIAN_DATA;
  var TEAL = window.MERIDIAN_TEAL || '#5F8F88', GOLD = '#B08D57', TILE = '#EDEAE3', RULE = '#E2DED5', LABEL = '#707070';

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
      return '<div class="bar-row"><span class="lab">' + esc(r.l) + '</span><div class="bar-track"><div class="bar-fill' + (gold ? ' gold' : '') + '" style="width:' + (r.v / max * 100) + '%"></div></div><span class="v">' + (fmt ? fmt(r.v, r) : r.v) + '</span></div>';
    }).join('') + '</div>';
  }

  /* Line chart with optional target line */
  function line(labels, values, target, opts) {
    opts = opts || {};
    var W = 480, H = opts.h || 220, L = 36, R = 22, T = 14, B = 30;
    var lo = opts.min !== undefined ? opts.min : 0;
    var hi = Math.max.apply(null, values.concat(target || 0)) * 1.12; if (!(hi > lo)) hi = lo + 4;
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
    var hi = Math.max.apply(null, a.concat(b)) * 1.12 || 4; if (hi < 4) hi = 4;
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
    var hi = Math.max.apply(null, values) * 1.15 || 4; if (hi < 4) hi = 4;
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
    core: ['overview', 'messages', 'insights', 'bookings', 'returning', 'reviews', 'audit'],
    growth: ['overview', 'messages', 'insights', 'bookings', 'returning', 'reviews', 'audit', 'plan', 'guests', 'content', 'website', 'partners'],
    scale: ['overview', 'messages', 'insights', 'bookings', 'returning', 'reviews', 'audit', 'plan', 'guests', 'content', 'website', 'partners', 'ads']
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
        panel('Where revenue came from', D.period, D.revenueBySource.length ? bars(D.revenueBySource, money) : '<p class="meta">No payments yet. Revenue appears here as bookings are paid.</p>') +
        panel('Bookings each week', wb.target ? 'Last 8 weeks, with your weekly goal' : 'Last 8 weeks', line(wb.labels, wb.values, wb.target, { min: wb.target ? 80 : 0, aria: 'Weekly bookings, ' + wb.values[0] + ' to ' + wb.values[wb.values.length - 1] }) + '<div class="legend"><span><i></i>Bookings</span>' + (wb.target ? '<span><i class="gold"></i>Weekly goal</span>' : '') + '</div>') +
      '</div><div style="height:20px"></div>' +
      '<div class="grid g2">' + insightPanel() + returnPanel() + '</div><div style="height:20px"></div>' +
      panel('What Meridian did for you', D.period, '<div class="activity">' + D.activity.filter(function (a) { return !a.needs || has(a.needs); }).map(function (a) {
        return '<div class="stat"><span class="n" style="font-size:26px">' + a.v + '</span><span class="l">' + esc(a.t) + '</span></div>';
      }).join('') + '</div>') +
      '<div style="height:20px"></div><div class="grid g2">' +
        panel('Your setup', D.setup.filter(okNeeds).length + ' of ' + D.setup.filter(okNeeds).length + ' complete', '<ul class="checks">' + D.setup.filter(okNeeds).map(function (x) { return '<li><span class="tick" aria-hidden="true"></span><div><div>' + esc(x.t) + '</div><div class="meta">' + esc(x.d) + '</div></div></li>'; }).join('') + '</ul>') +
        panel('Everything running', 'Checked every morning', '<ul class="checks">' + D.status.filter(okNeeds).map(function (x) { return '<li><span class="live" aria-hidden="true"></span><div class="grow">' + esc(x.t) + '</div><span class="meta">' + esc(x.d) + '</span></li>'; }).join('') + '</ul>') +
      '</div>';
  };
  function okNeeds(x) { return !x.needs || has(x.needs); }
  function insightPanel() {
    var w = D.weeklyInsight, i = has('guests') ? w.growth : w.core;
    return panel('Weekly insight', 'Meridian AI, ' + w.date, '<div class="rec"><div class="t">' + esc(i.t) + '</div><p>' + esc(i.p) + '</p><div class="actions"><button class="btn" data-act="approve">' + esc(i.a) + '</button><a class="btn ghost" href="#insights" style="text-decoration:none">More insights</a></div></div>');
  }
  function returnPanel() {
    var t = tier(), cost = D.planPrice[t], rev = D.attributed[t], x = rev / cost;
    return panel('Return on Meridian', D.period, '<div class="roi"><div class="stat"><span class="n">' + money(rev) + '</span><span class="l">Revenue Meridian brought in</span></div><div class="roi-x">' + x.toFixed(1) + 'x</div><div class="stat"><span class="n">' + money(cost) + '</span><span class="l">Your ' + TIER_NAMES[t] + ' plan</span></div></div>' +
      '<div class="split" aria-label="Revenue compared with plan cost"><span style="width:' + Math.round(cost / rev * 100) + '%" class="cost"></span><span class="gain"></span></div><div class="legend"><span><i class="gold"></i>Plan cost</span><span><i></i>Revenue brought in</span></div>');
  }
  function mini(p, val, t, d) {
    return '<div class="mini"><div class="mini-ring">' + ring(p, 64, 3, TEAL, t) + '<b>' + val + '</b></div><div><div class="t">' + esc(t) + '</div><div class="d">' + esc(d) + '</div></div></div>';
  }

  V.messages = function () {
    var M = D.inbox || [], open = M.filter(function (m) { return m.status === 'Needs a reply'; }).length;
    var first = M[0];
    var list = '<ul class="inbox">' + M.map(function (m, k) {
      return '<li data-msg="' + k + '" class="' + (k === 0 ? 'sel' : '') + '"><div class="who"><strong>' + esc(m.name) + '</strong><span class="meta">' + esc(m.time) + '</span></div><div class="meta">' + esc(m.text) + '</div><div class="row"><span class="tag">' + esc(m.channel) + '</span>' + (m.status === 'Needs a reply' ? '<span class="tag warn">Needs a reply</span>' : '<span class="tag on">Answered</span>') + '</div></li>';
    }).join('') + '</ul>';
    var thread = first ? threadView(first) : '<div class="thread"><div class="meta">No conversations yet. Messages by text, WhatsApp, email and website chat appear here.</div></div>';
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
        panel(b.todayTitle || 'Today', 'Next four bookings', !b.today.length ? '<p class="meta">Nothing booked yet.</p>' : '<ul class="list">' + b.today.map(function (t) {
          return '<li><span style="font-weight:600;width:48px">' + t.time + '</span><div class="grow"><div>' + esc(t.what) + '</div><div class="meta">' + esc(t.who) + '</div></div></li>';
        }).join('') + '</ul>') +
      '</div><div style="height:20px"></div>' + sessionsPanel(b) + '<div class="grid g3">' +
        panel('Gift vouchers', 'Unredeemed balance', '<div class="stat"><span class="n">' + b.vouchers.outstanding + '</span><span class="l">' + b.vouchers.sold + ' sold and ' + b.vouchers.redeemed + ' redeemed this month</span></div>') +
        panel('Memberships', 'Active members', '<div class="stat"><span class="n">' + b.memberships.active + '</span><span class="delta">+' + b.memberships.newThisMonth + ' this month</span></div>') +
        panel('Busiest time', 'Plan staffing and offers', '<div class="stat"><span class="n">Sat</span><span class="l">Bathhouse fills by 10am</span></div>') +
      '</div>';
  };

  function sessionsPanel(b) {
    if (!b.sessions) return '';
    return panel('Bathing sessions', 'Places booked in each upcoming session', !b.sessions.length ? '<p class="meta">No upcoming bathing sessions booked yet.</p>' :
      bars(b.sessions.map(function (x) { return { l: x.l, v: x.booked, of: x.seats }; }), function (v, r) { return v + ' of ' + r.of; }, true, Math.max.apply(null, b.sessions.map(function (x) { return x.seats; })))) + '<div style="height:20px"></div>';
  }

  V.guests = function () {
    var n = D.newGuests, o = D.outreach;
    return head('New guests', 'People reached for the first time, the messages that reach them and who is ready to book.') +
      '<div class="stats-row">' + o.stats.map(function (x) { return '<section class="panel stat"><span class="n">' + x.n + '</span><span class="l">' + esc(x.l) + '</span><span class="delta">' + esc(x.d) + '</span></section>'; }).join('') + '</div><div style="height:20px"></div>' +
      '<div class="grid g2">' +
        panel('From first message to first visit', D.period, funnel(n.funnel)) +
        panel('Where new guests came from', D.period, bars(n.bySource)) +
      '</div><div style="height:20px"></div>' +
      panel('Ready to book this week', 'Replied or visited your booking page. A reply is drafted for each.', '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Who</th><th>Where</th><th>Sign</th><th>Channel</th><th>When</th><th></th></tr></thead><tbody>' + o.ready.map(function (r) {
        return '<tr><td><strong>' + esc(r.n) + '</strong></td><td>' + esc(r.w) + '</td><td>' + esc(r.s) + '</td><td><span class="tag">' + esc(r.c) + '</span></td><td class="meta">' + esc(r.when) + '</td><td><button class="btn" data-act="approve">Send reply</button></td></tr>';
      }).join('') + '</tbody></table></div>') +
      '<div style="height:20px"></div>' +
      panel('Messages to new guests', 'Written in your voice. Nothing sends until you approve it.', '<div class="tabs" role="tablist">' +
        ['Email', 'Instagram', 'LinkedIn'].map(function (c, k) { return '<button class="tab" role="tab" aria-selected="' + (k === 0) + '" data-ch="' + k + '">' + c + '</button>'; }).join('') +
        '</div><div id="ch-view">' + chView(0) + '</div>') +
      '<div style="height:20px"></div><div class="grid g2">' +
        panel('Channels', 'Pause any channel at any time', '<ul class="list">' + o.channels.map(function (c) {
          return '<li><div class="grow"><div>' + esc(c.l) + '</div><div class="meta">' + esc(c.d) + '</div></div><button class="switch" role="switch" aria-checked="' + c.on + '" aria-label="' + esc(c.l) + '" data-act="switch"><span></span></button></li>';
        }).join('') + '</ul>') +
        panel('Instagram follow-backs', 'Local businesses and people who share your guests', funnel(o.follows)) +
      '</div><div style="height:20px"></div><div class="grid g2">' +
        panel('Going out next week', o.next.length + o.nextMore + ' messages', '<ul class="list">' + o.next.map(function (r) {
          return '<li><span class="dot"></span><div class="grow"><div>' + esc(r.n) + '</div><div class="meta">' + esc(r.w) + ', ' + esc(r.m) + '</div></div><span class="tag">' + esc(r.c) + '</span><button class="btn ghost" data-act="edit">Edit</button></li>';
        }).join('') + '<li><div class="grow meta">And ' + o.nextMore + ' more</div></li></ul>') +
        panel('Recent first visits', '', '<ul class="list">' + n.recent.map(function (r) {
          return '<li><span class="dot"></span><div class="grow"><div>' + esc(r.name) + '</div><div class="meta">' + esc(r.first) + '</div></div><span class="tag">' + esc(r.src) + '</span><span style="width:60px;text-align:right;font-weight:500">' + r.val + '</span></li>';
        }).join('') + '</ul>') +
      '</div>';
  };
  function chView(k) {
    var o = D.outreach;
    if (k === 0) {
      var done = o.email.filter(function (e) { return e.status === 'Approved'; }).length;
      return '<p class="trigger">' + done + ' of ' + o.email.length + ' approved. Sent from your own email address.</p><div class="tabs">' + o.email.map(function (e, i) {
        return '<button class="tab" aria-selected="' + (i === 0) + '" data-em="' + i + '">Email ' + (i + 1) + (e.status === 'Approved' ? '' : '<span class="pend">to approve</span>') + '</button>';
      }).join('') + '</div><div id="em-view">' + emView(0) + '</div>';
    }
    var list = k === 1 ? o.instagram : o.linkedin;
    var msgs = '<ol class="steps">' + list.map(function (m) { return '<li><div class="email-when">' + esc(m.when) + '</div><p>' + esc(m.b) + '</p><div class="actions"><button class="btn ghost" data-act="edit">Edit</button></div></li>'; }).join('') + '</ol>';
    if (k === 2) return '<p class="trigger">A connection request, then one message when they accept. Best for corporate wellness.</p>' + msgs;
    return '<p class="trigger">Starts when someone follows you back. Sent from your own Instagram account.</p><div class="ig">' + msgs +
      '<div><div class="phone"><div class="ph-top"><span class="ph-av">' + esc(D.venue.name.charAt(0)) + '</span><div><b>' + esc(D.venue.name) + '</b><span>Instagram</span></div></div><div class="ph-msg out">' + esc(list[0].b) + '</div><div class="ph-msg in">' + (D.brandProfile ? 'That sounds lovely. How do I book?' : 'Oh I have been meaning to try Biologique Recherche for ages. How do I book?') + '</div></div>' +
      '<div class="mini-stats">' + o.igStats.map(function (x) { return '<div class="stat"><span class="n" style="font-size:22px">' + x.n + '</span><span class="l">' + esc(x.l) + '</span></div>'; }).join('') + '</div></div></div>';
  }
  function emView(i) {
    var e = D.outreach.email[i], ok = e.status === 'Approved';
    return '<div class="em"><div class="em-meta"><div class="email-when">' + esc(e.when) + '</div><div class="em-subj">' + esc(e.s) + '</div><span class="tag ' + (ok ? 'on' : 'warn') + '">' + esc(e.status) + '</span>' + (e.r ? '<div class="meta" style="margin-top:10px">' + esc(e.r) + '</div>' : '') + '</div>' +
      '<div class="em-body">' + esc(e.b).replace(/\n/g, '<br>') + '<div class="actions" style="margin-top:18px">' + (ok ? '<button class="btn ghost" data-act="edit">Edit</button>' : '<button class="btn ghost" data-act="edit">Request a change</button><button class="btn" data-act="approve">Approve</button>') + '</div></div></div>';
  }

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


  // Set from the onboarding form: how every draft sounds and how every image looks.
  function brandBlock() {
    var B = D.brandProfile; if (!B) return '';
    var v = B.voice, im = B.imagery;
    var li = function (a) { return '<ul class="list">' + a.map(function (x) { return '<li><span class="dot"></span><div class="grow">' + esc(x) + '</div></li>'; }).join('') + '</ul>'; };
    var words = (v.love ? '<p class="meta" style="margin-top:12px"><b>Words you love:</b> ' + esc(v.love) + '</p>' : '') + (v.avoidWords ? '<p class="meta"><b>Never used:</b> ' + esc(v.avoidWords) + '</p>' : '') +
      (v.flagged && v.flagged.length ? '<p class="meta" style="color:var(--warn)">' + esc(v.flagged.join('. ')) + '. Edit before approving.</p>' : '');
    var voice = '<p style="font-family:var(--serif);font-size:20px;margin-bottom:6px">' + esc(v.tone) + '</p><p class="meta" style="margin-bottom:14px">' + esc(v.summary) + '</p>' +
      '<div class="grid g2" style="gap:18px"><div><div class="email-when">Always</div>' + li(v.do) + '</div><div><div class="email-when">Never</div>' + li(v.avoid) + '</div></div>' + words +
      '<p class="meta" style="margin-top:12px">Signed as ' + esc(v.signoff) + '. Every email, message and post is drafted in this voice, including your welcome email and the messages that find new guests.</p>';
    var sw = im.palette.map(function (c) { return '<span title="' + esc(c) + '" style="display:inline-block;width:26px;height:26px;border-radius:50%;background:' + esc(c) + ';border:1px solid var(--rule);margin-right:6px"></span>'; }).join('');
    var photos = B.photos.length ? '<div style="display:flex;gap:8px;margin:12px 0">' + B.photos.slice(0, 5).map(function (u) { return '<img src="' + u + '" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:4px">'; }).join('') + '</div>' : '';
    var img = '<p style="font-family:var(--serif);font-size:20px;margin-bottom:6px">' + esc(im.style) + '</p><p class="meta" style="margin-bottom:12px">' + esc(im.look) + '</p>' +
      (sw ? '<div style="margin-bottom:10px">' + sw + '</div>' : '') + photos +
      '<div class="email-when">Shots to plan this month</div>' + li(im.shots) +
      '<p class="meta" style="margin-top:10px"><b>People:</b> ' + esc(im.people) + '. <b>Avoid:</b> ' + esc(im.avoid.join(', ').toLowerCase()) + '.</p>' +
      (im.inspiration ? '<p class="meta"><b>Inspired by:</b> ' + esc(im.inspiration) + '</p>' : '');
    var w = v.welcome;
    var welcome = '<div class="em"><div class="em-meta"><div class="email-when">Welcome email</div><div class="em-subj">' + esc(w.subject) + '</div><span class="tag warn">Waiting for you</span></div>' +
      '<div class="em-body">' + esc(w.b).replace(/\n/g, '<br>') + '<div style="margin-top:18px">' + approveBtns() + '</div></div></div>';
    return '<div class="grid g2">' + panel('Your brand voice', 'From your onboarding answers', voice) + panel('Your imagery style', 'From your onboarding answers', img) + '</div><div style="height:20px"></div>' +
      panel('Your welcome email, first draft', 'Written in your voice. Approve it or ask for changes.', welcome) + '<div style="height:20px"></div>';
  }

  V.content = function () {
    var a = D.aiSearch;
    return head('Content', 'Written for you every week. Nothing is published until you approve it.') + brandBlock() + socialBlock() +
      '<div class="grid g-hero">' +
        panel('Found by AI assistants', 'When guests ask an AI assistant for a recommendation', '<div class="mini-stats" style="margin-bottom:18px">' + a.stats.map(function (x) { return '<div class="stat"><span class="n" style="font-size:26px">' + x.n + '</span><span class="l">' + esc(x.l) + '</span></div>'; }).join('') + '</div>' +
          '<div class="ask"><div class="ask-q">' + esc(a.question) + '</div><div class="ask-a">' + esc(a.answer) + '</div></div>') +
        panel('Coming next month', D.nextMonth.length + ' articles planned', '<ul class="list">' + D.nextMonth.map(function (x) { return '<li><span class="dot off"></span><div class="grow">' + esc(x.t) + '</div><span class="meta">' + esc(x.d) + '</span></li>'; }).join('') + '</ul>') +
      '</div><div style="height:20px"></div>' +
      panel('Articles this month', 'How each article is found on Google', '<ul class="list arts">' + D.articles.map(function (x) {
        var pub = x.status === 'Published';
        return '<li><div class="grow"><div class="meta">' + esc(x.when) + '</div><div class="art-t">' + esc(x.t) + '</div><div class="kws">' + x.kw.map(function (k) { return '<span class="tag">' + esc(k) + '</span>'; }).join('') + '</div>' + (x.note ? '<div class="meta" style="margin-top:8px;max-width:60ch">' + esc(x.note) + '</div>' : '') + '</div>' +
          (pub ? '<div class="art-n"><div><b>' + x.views + '</b><span>views</span></div><div><b>' + x.clicks + '</b><span>clicks</span></div><div><b>' + x.pos + '</b><span>position</span></div></div>' : '<div class="actions"><button class="btn ghost" data-act="edit">Preview</button><button class="btn" data-act="approve">Publish</button></div>') + '</li>';
      }).join('') + '</ul>') +
      '<div style="height:20px"></div><h2 class="sec">Posts and emails to approve</h2>' +
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
      '<section class="panel"><div class="hero"><div class="ring-big">' + ring(w.score / 100, 236, 3, TEAL, 'Website score ' + w.score) + '<div class="in"><span class="val">' + w.score + '</span><span class="of">out of 100</span><span class="pct">' + esc(w.delta || '+6 since last month') + '</span></div></div>' +
      '<div style="width:100%;max-width:560px">' + bars(w.parts, null, false, 100) + '</div></div></section>' +
      '<div style="height:20px"></div><div class="grid g2">' +
        panel('Score over time', w.history.values.length > 1 ? 'Last ' + w.history.values.length + ' months' : 'Checked monthly', w.history.values.length > 1 ? line(w.history.labels, w.history.values, null, { min: 0, aria: 'Website score over time', h: 220 }) : '<p class="meta">This is the first check. The trend line starts after next month’s check.</p>') +
        panel('Top fixes this month', 'We can make these changes for you', '<ul class="list">' + w.fixes.map(function (f) {
          return '<li><span class="dot gold"></span><div class="grow"><div>' + esc(f.t) + '</div><div class="meta">' + esc(f.i) + '</div></div><button class="btn" data-act="approve">Approve</button></li>';
        }).join('') + '</ul>') +
      '</div><div style="height:20px"></div>' + speedBlock() + searchBlock() + visitsBlock();
  };
  // Page speed: asks Google PageSpeed Insights from the browser (mobile). Takes about 20 seconds,
  // so the panel fills in after the page loads. The result is kept for a day in this browser.
  function speedSite() {
    var s = D.searchTerms && D.searchTerms.site;
    if (s) return 'https://' + String(s).replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/\/$/, '') + '/';
    return D.venue.website || null;
  }
  function speedBlock() {
    if (!speedSite()) return '';
    setTimeout(runSpeed, 50);
    return '<h2 class="sec">Page speed on a phone</h2><div id="speed">' + panel('Checking ' + esc(speedSite().replace(/^https:\/\//, '').replace(/\/$/, '')), 'Google’s page speed test', '<p class="meta">Running the test now. This takes about 20 seconds.</p>') + '</div><div style="height:20px"></div>';
  }
  function speedHtml(r) {
    var tile = function (n, l, d) { return '<section class="panel stat"><span class="n">' + n + '</span><span class="l">' + esc(l) + '</span><span class="delta">' + esc(d) + '</span></section>'; };
    var verdict = r.score >= 90 ? 'Fast' : r.score >= 50 ? 'Could be faster' : 'Slow on phones';
    return '<div class="stats-row">' +
      tile(r.score, 'Speed score out of 100', verdict) +
      tile(r.lcp, 'Main content appears in', 'Under 2.5 seconds is good') +
      tile(r.tbt, 'Time the page is busy', 'Under 0.2 seconds is good') +
      tile(r.cls, 'Layout movement while loading', 'Under 0.1 is good') +
      '</div>' + (parseFloat(r.lcp) > 2.5 ? '<p class="live-note" style="margin:16px 0 0;padding:12px 16px">Recommended: on a phone the main content takes ' + esc(r.lcp) + ' to appear.' + (r.slow ? ' The slowest item is “' + esc(String(r.slow).slice(0, 90)) + '”. Making that load faster, for example by compressing it, gives the biggest gain.' : ' Compressing the largest images near the top of the page usually gives the biggest gain.') + '</p>' : '') +
      '<p class="meta" style="margin-top:10px">Tested ' + esc(r.when) + ' on a simulated phone. Checked ' + esc(r.url) + '.</p>';
  }
  function runSpeed() {
    var el = document.getElementById('speed'); if (!el) return;
    var url = speedSite(), key = 'meridian-speed:' + url, cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.t < 86400000) { el.innerHTML = speedHtml(cached.r); return; }
    fetch('/.netlify/functions/speed-key').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
      .then(function (k) { return fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?category=performance&strategy=mobile&url=' + encodeURIComponent(url) + (k && k.key ? '&key=' + encodeURIComponent(k.key) : '')); })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var a = j.lighthouseResult.audits, sec = function (ms) { return (Math.round(ms / 100) / 10) + ' s'; };
        var r = { url: url.replace(/^https:\/\//, '').replace(/\/$/, ''), score: Math.round(j.lighthouseResult.categories.performance.score * 100),
          lcp: sec(a['largest-contentful-paint'].numericValue), tbt: sec(a['total-blocking-time'].numericValue),
          cls: (Math.round(a['cumulative-layout-shift'].numericValue * 100) / 100).toString(), slow: (function () { try { var d = a['largest-contentful-paint-element'].details, it = d.items[0]; var n = (it.items ? it.items[0] : it).node; return n.nodeLabel || n.snippet || ''; } catch (e) { return ''; } })(), when: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }) };
        try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), r: r })); } catch (e) {}
        var now = document.getElementById('speed'); if (now) now.innerHTML = speedHtml(r);
      })
      .catch(function () { var now = document.getElementById('speed'); if (now) now.innerHTML = '<p class="meta">Google’s speed test is busy right now. It will try again next time you open this page.</p>'; });
  }
  function socialBlock() {
    var S = D.socialLive; if (!S) return '';
    return '<h2 class="sec" style="margin-top:0">Social this week</h2><p class="meta" style="margin:-6px 0 14px">' + esc(S.accounts.join(', ')) + '. Figures build up from the day an account is connected.</p>' +
      '<div class="stats-row">' + S.stats.map(function (x) { return '<section class="panel stat"><span class="n">' + x.n + '</span><span class="l">' + esc(x.l) + '</span><span class="delta">' + esc(x.d) + '</span></section>'; }).join('') + '</div><div style="height:20px"></div>';
  }
  function searchBlock() {
    var G = D.searchTerms;
    if (!G) return '';
    var n = G.now, b = G.before;
    var ch = function (a, c) { if (!c) return 'Last 4 weeks'; var d = Math.round(100 * (a - c) / c); return (d >= 0 ? '+' : '') + d + '% on the 4 weeks before'; };
    var rows = G.terms.length ? G.terms.map(function (t) {
      return '<tr><td><strong>' + esc(t.term) + '</strong></td><td>' + t.clicks + '</td><td>' + t.impressions + '</td><td>' + t.position + '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="meta">No searches recorded yet.</td></tr>';
    return '<h2 class="sec">Found on Google</h2><div class="stats-row">' +
      '<section class="panel stat"><span class="n">' + Math.round(n.clicks) + '</span><span class="l">Clicks from Google search</span><span class="delta">' + esc(ch(n.clicks, b.clicks)) + '</span></section>' +
      '<section class="panel stat"><span class="n">' + Math.round(n.impressions).toLocaleString('en-AU') + '</span><span class="l">Times you appeared in results</span><span class="delta">' + esc(ch(n.impressions, b.impressions)) + '</span></section>' +
      '<section class="panel stat"><span class="n">' + (Math.round(n.position * 10) / 10 || '-') + '</span><span class="l">Average position on Google</span><span class="delta">Lower is better</span></section>' +
      '</div><div style="height:20px"></div>' +
      (D.searchInsight ? '<p class="live-note" style="margin:0 0 20px;padding:12px 16px">' + esc(D.searchInsight) + '</p>' : '') +
      panel('What people searched to find you', 'Last 4 weeks, from Google Search Console', '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Search</th><th>Clicks</th><th>Appeared</th><th>Position</th></tr></thead><tbody>' + rows + '</tbody></table></div>') +
      '<div style="height:20px"></div>';
  }
  function visitsBlock() {
    var v = D.webVisits;
    return '<h2 class="sec">Website visits</h2><div class="stats-row">' + v.stats.map(function (x) { return '<section class="panel stat"><span class="n">' + x.n + '</span><span class="l">' + esc(x.l) + '</span><span class="delta">' + esc(x.d) + '</span></section>'; }).join('') + '</div><div style="height:20px"></div>' +
      '<div class="grid g3">' + panel('Most visited pages', D.period, bars(v.pages)) + panel('Where visitors came from', D.period, bars(v.sources)) +
      panel('Who visits', D.period, '<div class="minis">' + mini(v.mobile / 100, v.mobile + '%', 'On a phone', 'Make booking easy on mobile') + mini(v.local / 100, v.local + '%', v.localLabel || 'Gold Coast based', v.localSub || 'Within 30 minutes of you') + '</div>') + '</div>';
  }

  V.partners = function () {
    return head('Partners', 'Businesses on Meridian whose guests are a natural fit for yours. Never competitors.') +
      D.partners.map(function (p, k) {
        var x = D.partnerDetail[k] || { traits: [] };
        return '<section class="panel partner"><div class="p-head"><div class="mini-ring">' + ring(p.fit / 100, 64, 3, TEAL, 'Guest fit ' + p.fit + ' percent') + '<b>' + p.fit + '%</b></div><div class="grow"><div style="font-weight:600;font-size:15px">' + esc(p.name) + '</div><div class="meta">' + esc(p.where) + ', guest fit</div></div><span class="tag">' + esc(x.kind || '') + '</span></div>' +
          '<div class="p-grid"><div><h3>Why you were matched</h3><p>' + esc(p.why) + '</p><h3>Guests you share</h3><ul class="traits">' + x.traits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' +
          '<div><h3>Idea</h3><p>' + esc(p.idea) + '. Meridian writes the messages for both of you.</p><h3>Likely result</h3><p>' + esc(x.outcome || '') + '</p><div class="actions" style="margin-top:16px"><button class="btn ghost" data-act="later">Not now</button><button class="btn" data-act="interest">Express interest</button></div></div></div></section><div style="height:20px"></div>';
      }).join('') + '<p class="meta" style="font-size:12.5px;color:' + LABEL + ';max-width:70ch">Matches are based on shared guests, location and services that complement each other. Your interest stays private until both businesses say yes.</p>';
  };

  V.insights = function () {
    var I = D.insights, own = I.ownership, pct = own.own / (own.own + own.rented), g = has('guests');
    var out = head('Insights', 'What your numbers are telling you, updated every week.') +
      insightPanel() + '<div style="height:20px"></div>' +
      '<div class="grid g-hero">' +
        panel('Guest behaviour', 'What guests do after their first visit', '<div class="beh">' + I.behaviour.map(function (b) { return '<div class="stat"><span class="n" style="font-size:26px">' + b.v + '</span><span class="l">' + esc(b.l) + '</span><span class="meta" style="font-size:12px">' + esc(b.d) + '</span></div>'; }).join('') + '</div>') +
        panel('Guest details you own', 'Contacts on your own list, compared with followers held by social platforms', '<div class="hero" style="gap:24px"><div class="mini-ring" style="width:120px;height:120px">' + ring(pct, 120, 3, TEAL, 'You own ' + Math.round(pct * 100) + ' percent') + '<b style="font-size:22px;font-family:var(--serif);font-weight:500">' + Math.round(pct * 100) + '%</b></div><div><div class="stat"><span class="n" style="font-size:22px">' + own.own.toLocaleString('en-AU') + '</span><span class="l">On your list</span></div><div class="stat" style="margin-top:10px"><span class="n" style="font-size:22px">' + own.rented.toLocaleString('en-AU') + '</span><span class="l">Social followers only</span></div></div></div><p class="meta" style="margin-top:14px">' + esc(own.note) + '</p>') +
      '</div>';
    if (!g) return out + '<div style="height:20px"></div>' + panel('More insights on Growth', '', '<p style="max-width:60ch;color:#4A4A48">On the Growth plan this page also shows who your best new guests are, the words that get replies and which channels bring guests most efficiently.</p><div class="actions" style="margin-top:14px"><a class="btn" href="' + (D.sample ? '../book-a-demo/' : 'mailto:contact@pixelprimed.com') + '" style="text-decoration:none">Talk to us about Growth</a></div>');
    return out + '<div style="height:20px"></div>' +
      panel('What your data is telling you', 'Meridian AI', '<div class="g3 grid">' + I.telling.map(function (t) { return '<div class="rec"><div class="t">' + esc(t.h) + '</div><p style="margin-bottom:0">' + esc(t.p) + '</p></div>'; }).join('') + '</div>') +
      '<div style="height:20px"></div><div class="grid g2">' +
        panel('Who your new guests are', 'By age and suburb, last 90 days', '<h3 class="mini-h">Age</h3>' + bars(I.ages, function (v) { return v + '%'; }, false, 50) + '<h3 class="mini-h" style="margin-top:20px">Suburb</h3>' + bars(I.places, function (v) { return v + '%'; }, false, 50) + '<p class="best">' + esc(I.bestFit) + '</p>') +
        panel('Words that get replies', 'Open rate compared with your 41% average', '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Wording</th><th>Opened</th><th>Change</th></tr></thead><tbody>' + I.words.map(function (w) { return '<tr><td>' + esc(w.l) + '</td><td>' + w.open + '%</td><td class="' + (w.lift < 0 ? 'neg' : 'pos') + '">' + (w.lift > 0 ? '+' : '') + w.lift + '%</td></tr>'; }).join('') + '</tbody></table></div><p class="meta" style="margin-top:12px">' + esc(I.wordsNote) + '</p>') +
      '</div><div style="height:20px"></div>' +
      panel('Which channels work best', 'Share of people reached who became interested', bars(I.channels.map(function (c) { return { l: c.l, v: c.rate }; }), function (v) { return v + '%'; }, false, 12) + '<ul class="list" style="margin-top:18px">' + I.channels.map(function (c) { return '<li><div class="grow"><div>' + esc(c.l) + '</div><div class="meta">' + c.reached + ' reached, ' + c.warm + ' interested. ' + esc(c.note) + '</div></div></li>'; }).join('') + '</ul>');
  };

  /* ---------- routing ---------- */
  var routes = ['overview', 'messages', 'insights', 'audit', 'plan', 'bookings', 'guests', 'returning', 'reviews', 'content', 'ads', 'website', 'partners'];
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
    markApprovals();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  /* ---------- approvals ---------- */
  // Each Approve button is identified by its page and the item's title, so the saved state survives reloads.
  var APPROVALS = {};
  function approvalItem(b) {
    var box = b.closest('.em, li, tr') || b.parentNode;
    var tEl = box.querySelector('.em-subj') || box.querySelector('.grow > div:first-child, td strong, strong') || box;
    var title = (tEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    var mEl = box.querySelector('.grow .meta, .meta');
    var page = (location.hash || '#overview').slice(1);
    return { key: page + ':' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120), title: title, detail: mEl ? mEl.textContent.replace(/\s+/g, ' ').trim() : '', page: page };
  }
  function markApprovals() {
    document.querySelectorAll('[data-act="approve"]').forEach(function (b) {
      var rec = APPROVALS[approvalItem(b).key]; if (!rec) return;
      b.disabled = true; b.className = 'btn done';
      b.textContent = rec.status === 'done' ? 'Done' : rec.status === 'in_progress' ? 'In progress' : 'Approved';
      b.title = 'Approved ' + new Date(rec.approvedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + (rec.note ? '. ' + rec.note : '');
    });
  }
  function loadApprovals() {
    if (!D.live) return;
    fetch('/.netlify/functions/approvals', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { approvals: [] }; })
      .then(function (j) { (j.approvals || []).forEach(function (a) { APPROVALS[a.key] = a; }); markApprovals(); }).catch(function () {});
  }

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
    var ch = e.target.closest('[data-ch]');
    if (ch) { document.querySelectorAll('[data-ch]').forEach(function (x) { x.setAttribute('aria-selected', x === ch); }); document.getElementById('ch-view').innerHTML = chView(+ch.getAttribute('data-ch')); return; }
    var em = e.target.closest('[data-em]');
    if (em) { document.querySelectorAll('[data-em]').forEach(function (x) { x.setAttribute('aria-selected', x === em); }); document.getElementById('em-view').innerHTML = emView(+em.getAttribute('data-em')); return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'approve') {
      b.textContent = 'Approved'; b.className = 'btn done'; b.disabled = true;
      if (!D.live) { toast('Approved. In the demo nothing is sent.'); return; }
      var it = approvalItem(b);
      fetch('/.netlify/functions/approvals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it) })
        .then(function (r) { return r.json(); })
        .then(function (rec) { APPROVALS[rec.key] = rec; markApprovals(); toast(rec.taskId ? 'Approved. Pixel Primed has been sent a task.' : 'Approved and saved'); })
        .catch(function () { toast('Approved here, but it could not be saved. Please try again.'); b.textContent = 'Approve'; b.className = 'btn'; b.disabled = false; });
    }
    else if (act === 'interest') { b.textContent = 'Interest sent'; b.className = 'btn done'; b.disabled = true; toast(D.sample ? 'Interest sent. In the demo nothing is sent.' : 'Interest sent'); }
    else if (act === 'switch') { var on = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', on); toast(on ? 'Channel switched on' : 'Channel paused'); }
    else if (act === 'edit') { toast('Editing opens here in the full version'); }
    else if (act === 'later') { var p = b.closest('.rec, .panel, li'); if (p) p.style.opacity = '.45'; toast('Saved for later'); }
  });

  /* ---------- start ---------- */
  if (D.liveNote) { var ln = document.createElement('div'); ln.className = 'live-note'; ln.setAttribute('role', 'status'); ln.textContent = D.liveNote; var pg = $('#page'); pg.parentNode.insertBefore(ln, pg); }
  $('#venue').innerHTML = (D.venue.logo ? '<img src="' + D.venue.logo + '" alt="" style="height:30px;max-width:120px;object-fit:contain;vertical-align:middle;margin-right:12px">' : '') + esc(D.venue.name) + '<span>' + esc(D.venue.place) + '</span>';
  if (!D.sample) { var s = $('.sample'); if (s) s.remove(); }
  var c = $('#approvals-count'); if (c) c.textContent = D.approvalsCount;
  var mc = $('#messages-count'); if (mc) mc.textContent = (D.inbox || []).filter(function (m) { return m.status === 'Needs a reply'; }).length;
  var sw = $('#tier-switch');
  if (sw) {
    if (!D.sample) sw.remove();
    else { sw.value = tier(); sw.addEventListener('change', function () { D.tier = sw.value; render(); }); }
  }
  /* ---------- notifications ---------- */
  var bell = $('#bell');
  if (bell) {
    var notes = $('#notes');
    function drawNotes() {
      var list = (D.notifications || []).filter(okNeeds);
      $('#bell-n').textContent = list.length;
      notes.innerHTML = '<div class="notes-head"><b>Notifications</b><button data-clear>Mark all read</button></div><ul>' + list.map(function (n) {
        return '<li><a href="#' + n.go + '"><div class="nt">' + esc(n.t) + '</div><div class="meta">' + esc(n.d) + '</div><div class="nw">' + esc(n.when) + '</div></a></li>';
      }).join('') + '</ul>';
    }
    drawNotes();
    bell.addEventListener('click', function (e) { e.stopPropagation(); var open = notes.hidden; notes.hidden = !open; bell.setAttribute('aria-expanded', open); });
    notes.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) { $('#bell-n').textContent = ''; notes.hidden = true; bell.setAttribute('aria-expanded', false); }
      if (e.target.closest('a')) { notes.hidden = true; bell.setAttribute('aria-expanded', false); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.bell-wrap')) { notes.hidden = true; bell.setAttribute('aria-expanded', false); } });
    var _render = render; render = function () { _render(); drawNotes(); };
  }

  /* ---------- Meridian AI ---------- */
  var aiBtn = $('#ai-btn');
  if (aiBtn && D.chat) {
    var ai = $('#ai'), body = $('#ai-body'), prompts = $('#ai-prompts');
    function say(who, html) { var d = document.createElement('div'); d.className = 'ai-msg ' + who; d.innerHTML = html; body.appendChild(d); body.scrollTop = body.scrollHeight; }
    say('bot', esc(D.chat.hello.replace('Amélie', D.venue.owner || '')));
    prompts.innerHTML = D.chat.prompts.map(function (q) { return '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');
    function ask(q) {
      say('me', esc(q)); prompts.hidden = true;
      var t = document.createElement('div'); t.className = 'ai-msg bot typing'; t.textContent = 'Thinking'; body.appendChild(t);
      setTimeout(function () {
        t.remove();
        var growthQ = q === 'Which channel brings the best new guests?';
        say('bot', growthQ && !has('guests') ? esc(D.chat.coreOnly) : (D.chat.answers[q] || esc(D.chat.fallback)));
      }, 800);
    }
    function toggle(open) { ai.hidden = !open; aiBtn.setAttribute('aria-expanded', open); aiBtn.hidden = open; if (open) $('#ai-in').focus(); }
    aiBtn.addEventListener('click', function () { toggle(true); });
    $('#ai-x').addEventListener('click', function () { toggle(false); });
    prompts.addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (b) ask(b.getAttribute('data-q')); });
    $('#ai-form').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#ai-in').value.trim(); if (v) { $('#ai-in').value = ''; ask(v); } });
  }

  render();
  loadApprovals();
})();
