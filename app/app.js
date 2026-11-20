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
    var asOf = D.asOf ? '<p class="meta" style="margin-top:4px">' + new Date(D.asOf).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', figures for the last 30 days</p>' : '';
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + asOf + '</div>' + (right || '') + '</div>';
  }
  function approveBtns() {
    return '<div class="actions"><button class="btn ghost" data-act="edit">Edit</button><button class="btn" data-act="approve">Approve</button></div>';
  }

  /* ---------- plans ---------- */
  var TIER_NAMES = { core: 'Core', growth: 'Growth', scale: 'Scale' };
  var TIER_SCREENS = {
    core: ['overview', 'messages', 'insights', 'bookings', 'returning', 'reviews', 'audit', 'campaigns'],
    growth: ['overview', 'messages', 'insights', 'bookings', 'returning', 'reviews', 'audit', 'campaigns', 'plan', 'guests', 'brand', 'content', 'website', 'partners'],
    scale: ['overview', 'messages', 'insights', 'bookings', 'returning', 'reviews', 'audit', 'campaigns', 'plan', 'guests', 'brand', 'content', 'website', 'partners', 'ads']
  };
  var UPGRADE = {
    optimise: ['Growth', 'Your marketing, improved every month', ['New guest journeys suggested from your results', 'A/B tests on the messages you already send', 'Every change approved by you first']],
    plan: ['Growth', 'A marketing plan built from your goals', ['Set a revenue goal and see the channels and budget to reach it', 'Progress tracked against your goal every week', 'One clear recommendation each Monday']],
    guests: ['Growth', 'New guests, found and messaged for you', ['Personal messages to new guests and local businesses', 'Corporate wellness and partner referrals', 'See every first visit and where it came from']],
    brand: ['Growth', 'A brand people remember', ['The distinctive assets that make you the first name people think of', 'The needs you answer, matched to the right booking', 'Ideas that turn a first visit into a lasting relationship']],
    content: ['Growth', 'Content written for you every week', ['Social posts, emails and articles in your voice', 'Approve or edit before anything is published', 'Imagery created in your brand style on Scale']],
    website: ['Growth', 'Get found on Google and AI assistants', ['A monthly website score', 'The fixes that bring the most bookings, made for you', 'Track how often AI assistants recommend you']],
    partners: ['Growth', 'Partner with businesses that share your guests', ['Matched with nearby businesses, never competitors', 'Referral ideas that suit both sides', 'Track partner referrals in your dashboard']],
    ads: ['Scale', 'Ads run and refined for you', ['Instagram, Facebook, Google and AI assistant ads', 'Budget moved to whatever brings bookings', 'Every booking traced to the ad that brought it']]
  };
  function tier() { return D.tier || 'core'; }
  function has(screen) { return TIER_SCREENS[tier()].indexOf(screen) >= 0; }
  function upgradeView(r) {
    var u = UPGRADE[r], title = { optimise: 'Optimise', brand: 'Brand', plan: 'Plan and goals', guests: 'New guests', content: 'Content', website: 'Website', partners: 'Partners', ads: 'Ads' }[r];
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
        (D.live ? panel('Conversations', D.period, '<div class="stat"><span class="n">' + M.length + '</span><span class="l">in your inbox</span></div>') +
          panel('Reply times', 'Builds up as messages come in', '<p class="meta">Your average reply time appears here once a few conversations have been answered.</p>')
        : panel('Answered automatically', D.period, '<div class="stat"><span class="n">68%</span><span class="l">of questions about times, prices and vouchers</span></div>') +
          panel('Average reply time', D.period, '<div class="stat"><span class="n">4 min</span><span class="l">down from 3 hours</span></div>')) +
      '</div><div style="height:20px"></div>' +
      '<section class="panel inbox-wrap">' + list + '<div id="thread">' + thread + '</div></section>';
  };
  function threadView(first) {
    if (first.live && first.contactId) {
      return '<div class="thread" data-contact="' + esc(first.contactId) + '" data-type="' + esc(first.msgType || '') + '"><div class="thread-head"><strong>' + esc(first.name) + '</strong><span class="tag">' + esc(first.channel) + '</span></div>' +
        (first.text && first.text !== '(no text)' ? '<div class="bubble in">' + esc(first.text) + '</div>' : '<div class="meta">No message text yet.</div>') +
        '<div class="draft"><div class="meta">Your reply, sent from your own account on the same channel</div><textarea class="reply-box" aria-label="Reply" rows="5" style="width:100%;font:inherit;padding:12px;border:1px solid var(--border,#E9E1D5);border-radius:8px"></textarea>' +
        '<div class="actions"><button class="btn ghost" data-act="suggestreply">Suggest a reply</button><button class="btn" data-act="sendreply">Send</button></div></div></div>';
    }
    return '<div class="thread"><div class="thread-head"><strong>' + esc(first.name) + '</strong><span class="tag">' + esc(first.channel) + '</span></div>' +
      '<div class="bubble in">' + esc(first.text) + '</div>' +
      (first.draft ? '<div class="draft"><div class="meta">Suggested reply, checked against your live availability</div><textarea aria-label="Reply">' + esc(first.draft) + '</textarea><div class="actions"><button class="btn ghost" data-act="edit">Edit</button><button class="btn" data-act="approve">Send</button></div></div>' : '<div class="meta">Answered. Nothing waiting.</div>') + '</div>';
  }

  V.audit = function () {
    if (D.blueprintStatus === 'writing' && !D.blueprint) {
      setTimeout(function () { if ((location.hash || '') === '#audit') location.reload(); }, 45000);
      return head('Growth Blueprint', 'Your Blueprint is being written now.') + panel('What is happening', 'Usually ready within five minutes', '<p style="max-width:62ch">Meridian is reading your website, running a speed test on mobile and checking your account, then scoring nine areas of your business and writing your plan for the next three months. This page refreshes on its own when it is ready.</p>');
    }
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
      }).join('') + '</ul>') + blueprintExtra();
  };

  function blueprintExtra() {
    var B = D.blueprint; if (!B) return '';
    var list = function (xs) { return '<ul class="list">' + (xs || []).map(function (x) { return '<li><span class="dot"></span><div class="grow">' + esc(x) + '</div></li>'; }).join('') + '</ul>'; };
    return '<div style="height:20px"></div>' +
      panel('Where you are now', 'Written ' + new Date(B.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), '<p style="max-width:70ch">' + esc(B.summary || '') + '</p>') +
      '<div style="height:20px"></div><div class="grid g2">' +
        panel('What is already working', '', list(B.strengths)) +
        panel('This week', 'Quick wins', list(B.quickWins)) +
      '</div><div style="height:20px"></div>' +
      panel('Your next three months', '', '<div class="grid g3">' + (B.plan || []).map(function (m) { return '<div class="rec"><div class="email-when">' + esc(m.month) + '</div><div class="t">' + esc(m.focus) + '</div>' + list(m.actions) + '</div>'; }).join('') + '</div>') +
      '<div style="height:20px"></div>' +
      panel('How each area scored', 'What Meridian saw', '<ul class="list">' + (D.audit.sections || []).filter(function (x) { return x.why; }).map(function (x) { return '<li><div style="width:44px;font-weight:600">' + x.now + '</div><div class="grow"><div>' + esc(x.l) + '</div><div class="meta">' + esc(x.why) + '</div></div></li>'; }).join('') + '</ul>');
  }

  V.plan = function () {
    var c = D.plan.channels;
    var spend = c.reduce(function (s, r) { return s + r.budget; }, 0);
    var rows = c.map(function (r) {
      var p = r.actual / r.expected;
      return '<li><div class="mini-ring" style="width:44px;height:44px">' + ring(p, 44, 3, p >= 1 ? TEAL : GOLD, r.l) + '</div><div class="grow"><div>' + esc(r.l) + '</div><div class="meta">' + (r.budget ? money(r.budget) + ' a month' : 'No ad spend') + '</div></div><div style="text-align:right"><div style="font-weight:600">' + r.actual + ' of ' + r.expected + '</div><div class="meta">new guests or bookings</div></div></li>';
    }).join('');
    return head('Plan and goals', D.plan.goal + '.', '<button class="btn ghost" data-act="edit">Change goals</button>') +
      '<div class="grid g3">' +
        (tier() === 'scale'
          ? panel('Monthly ad budget', 'From your onboarding answers', '<div class="stat"><span class="n">' + money(spend) + '</span><span class="l">across ' + c.filter(function (r) { return r.budget; }).length + ' paid channels</span></div>')
          : panel('Visits needed', 'To reach your goal this month', '<div class="stat"><span class="n">' + (D.plan.visitsNeeded != null ? D.plan.visitsNeeded : c.reduce(function (s, r) { return s + r.expected; }, 0)) + '</span><span class="l">' + (D.plan.avg ? 'at ' + money(D.plan.avg) + ' a visit' : 'visits') + '</span></div>')) +
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
    return head('New guests', 'People reached for the first time, the messages that reach them and who is ready to book.') + audiencePanel() +
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
        panel('Channels', 'Pause any channel at any time', '<ul class="list">' + o.channels.map(function (c, ci) {
          return '<li data-chan="' + ci + '"><div class="grow"><div>' + esc(c.l) + '</div><div class="meta">' + esc(c.d) + '</div></div><button class="switch" role="switch" aria-checked="' + c.on + '" aria-label="' + esc(c.l) + '" data-act="switch"><span></span></button></li>';
        }).join('') + '</ul>') +
        allowancePanel() +
      '</div><div style="height:20px"></div><div class="grid g2">' +
        panel('Instagram follow-backs', 'Local businesses and people who share your guests', funnel(o.follows)) +
        panel('Going out next week', o.next.length + o.nextMore + ' messages', '<ul class="list">' + o.next.map(function (r) {
          return '<li><span class="dot"></span><div class="grow"><div>' + esc(r.n) + '</div><div class="meta">' + esc(r.w) + ', ' + esc(r.m) + '</div></div><span class="tag">' + esc(r.c) + '</span><button class="btn ghost" data-act="edit">Edit</button></li>';
        }).join('') + '<li><div class="grow meta">And ' + o.nextMore + ' more</div></li></ul>') +
        panel('Recent first visits', '', '<ul class="list">' + n.recent.map(function (r) {
          return '<li><span class="dot"></span><div class="grow"><div>' + esc(r.name) + '</div><div class="meta">' + esc(r.first) + '</div></div><span class="tag">' + esc(r.src) + '</span><span style="width:60px;text-align:right;font-weight:500">' + r.val + '</span></li>';
        }).join('') + '</ul>') +
      '</div>';
  };
  // How many new people Meridian contacts each month, and how that is shared between channels.
  var ALLOWANCE = { core: 0, growth: 400, scale: 800 }, LINKEDIN_WEEK = 50;
  // Who Meridian reaches, from Business details.
  function audiencePanel() {
    var P = D.answers ? D.clientProfile : null; var a = P && P.audience; if (!a) return '';
    var row = function (l, v) { return '<li><div class="grow"><div class="meta">' + l + '</div><div>' + esc(v || 'Not set yet') + '</div></div></li>'; };
    return panel('Who we reach', 'From your Business details', '<ul class="list">' + row('Ideal guest', a.ideal) + row('Where', a.area) + row('Partners and clients', (a.partners || []).join(', ')) + row('Never contacted', a.avoid) + '</ul>' +
      '<div class="actions" style="margin-top:12px"><a class="btn ghost" href="/onboard/?edit=1">Change who we reach</a></div>') + '<div style="height:20px"></div>';
  }
  function allowancePanel() {
    var total = ALLOWANCE[tier()] || 0, on = (D.outreach.channels || []).filter(function (c) { return c.on; });
    if (!total || !on.length) return panel('Your monthly outreach', '', '<p class="meta">Switch on a channel to start reaching new people.</p>');
    var rates = {}; ((D.insights && D.insights.channels) || []).forEach(function (c) { rates[c.l] = c.rate; });
    var weights = on.map(function (c) { return Math.max(1, rates[c.l] || 0); }), sum = weights.reduce(function (a, b) { return a + b; }, 0);
    var split = on.map(function (c, k) { var n = Math.round(total * weights[k] / sum); if (c.k === 'linkedin' || c.l === 'LinkedIn') n = Math.min(n, LINKEDIN_WEEK * 4); return { l: c.l, n: n }; });
    return panel('Your monthly outreach', total + ' new people a month across your channels', '<ul class="list">' + split.map(function (x) { return '<li><div class="grow"><div>' + esc(x.l) + '</div></div><div style="font-weight:600">' + x.n + '</div></li>'; }).join('') + '</ul>' +
      '<p class="meta" style="margin-top:12px">Each month more goes to the channel getting the most replies. Anyone who does not reply gets up to two follow-ups, which do not count towards the total, and nobody is contacted again once they reply or say no. LinkedIn stays within ' + LINKEDIN_WEEK + ' new people a week. Every email carries an unsubscribe link.</p>');
  }
  function saveAnswers(body) {
    var id = new URLSearchParams(location.search).get('client');
    if (!D.live || !id) return Promise.resolve();
    return fetch('/.netlify/functions/onboard?id=' + encodeURIComponent(id) + '&update=1', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw 0; });
  }
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
      '<div class="em-body"><div class="em-text">' + esc(e.b).replace(/\n/g, '<br>') + '</div><div class="actions" style="margin-top:18px">' + (ok ? '<button class="btn ghost" data-act="edit">Edit</button>' : '<button class="btn ghost" data-act="edit">Request a change</button><button class="btn" data-act="approve">Approve</button>') + '</div></div></div>';
  }

  V.returning = function () {
    var r = D.returning, rr = r.rebookRate;
    return head('Returning guests', 'The messages that bring guests back and how well they work.') +
      '<div class="grid g-hero">' +
        panel('Guests who rebook', 'Share of guests booking again within 90 days', line(rr.labels, rr.values, rr.target, { suffix: '%', min: 30, aria: 'Rebooking rate rising from 41 to 58 percent' }) + '<div class="legend"><span><i></i>Rebooking rate</span><span><i class="gold"></i>Goal, ' + rr.target + '%</span></div>') +
        panel('Loyalty', 'Guests at each level', bars(r.tiers, null, true)) +
      '</div><div style="height:20px"></div>' + klaviyoBlock() +
      (cidParam() && D.client && usesKlaviyo() ? '' : journeysPanel());
  };
  // A live client's journeys: their own emails, editable, approved one journey at a time.
  function liveJourneysPanel() {
    var L = D.liveJourneys;
    if (L.status === 'writing' || L.status === 'none') { setTimeout(function () { if (location.hash === '#returning') location.reload(); }, 45000); return panel('Guest journeys', 'Being written now', '<p class="meta">Meridian is writing every email in your guest journeys in your voice. They appear here in a few minutes.</p>'); }
    if (L.status === 'failed' && !(L.journeys || []).length) return panel('Guest journeys', '', '<p class="meta">Your journeys could not be written just now.' + (L.error ? ' Reason: ' + esc(L.error) : '') + '</p><div class="actions" style="margin-top:10px"><button class="btn" data-act="rewritejourneys">Try again</button></div>');
    var tabs = L.journeys.map(function (j, k) { return '<button class="tab" role="tab" aria-selected="' + (k === JOURNEY_TAB) + '" data-journey="' + k + '">' + esc(j.name) + '<span>' + j.emails.length + '</span></button>'; }).join('');
    return panel('Guest journeys', 'Written in your voice. Edit any email, then approve the journey and our team puts it live.', '<div class="tabs" role="tablist">' + tabs + '</div><div id="journey-view">' + liveJourneyView(JOURNEY_TAB) + '</div>' +
      '<p class="meta" style="margin-top:18px">' + (L.status === 'rewriting' ? 'Rewriting with your latest business details.' : 'Changed your business details? <a href="#" data-act="rewritejourneys">Rewrite these journeys</a>.') + '</p>');
  }
  var JOURNEY_TAB = 0;
  function liveJourneyView(k) {
    var j = D.liveJourneys.journeys[k]; if (!j) return '';
    return '<p class="trigger">Starts: ' + esc(j.trigger) + '</p><div class="emails">' + j.emails.map(function (e) {
      return '<article class="email post-card" data-email="' + esc(e.id) + '"><div class="email-when">' + esc(e.when) + '</div><div class="email-card">' + (e.img ? '<img src="' + esc(e.img) + '" alt="">' : '') +
        '<div class="email-body"><div class="email-brand">' + esc(D.venue.name) + '</div><div class="email-head em-subj">' + esc(e.headline) + '</div>' +
        '<div class="em-text" style="white-space:pre-line;text-align:left;font-size:14px;line-height:1.6;margin:14px 0">' + esc(e.body) + '</div><div class="email-rule"></div><div class="email-btn">' + esc(e.cta) + '</div></div></div>' +
        '<div class="email-subj">Subject: ' + esc(e.subject) + '</div><div class="actions" style="margin-top:8px"><button class="btn ghost" data-act="edit">Edit</button></div></article>';
    }).join('') + '</div><div class="actions" style="margin-top:16px">' + (j.approved ? '<span class="meta">Approved ' + new Date(j.approved.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }) + '. Our team is putting it live.</span>' : '<button class="btn" data-act="approvejourney" data-key="' + esc(j.key) + '">Approve this journey</button>') + '</div>';
  }
  function journeysPanel() {
    if (D.liveJourneys) return liveJourneysPanel();
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

  // The secure link a client uses to connect their social accounts. They log in to each network themselves.
  function connectBlock() {
    var c = D.connect; if (!c || !c.link) return '';
    return panel('Connect your social accounts', 'Takes about two minutes', '<p style="max-width:62ch">Open the secure link, enter the password, then log in to each account you want us to post to and read results from. You never share your passwords with us.</p>' +
      '<div class="actions" style="margin-top:12px;align-items:center"><a class="btn" href="' + esc(c.link) + '" target="_blank" rel="noopener">Open the secure link</a>' + (c.password ? '<span class="meta">Password: <b>' + esc(c.password) + '</b></span>' : '') + '</div>') + '<div style="height:20px"></div>';
  }
  // The AI visibility check for a live client: the questions guests ask, and whether the business is recommended.
  function visibilityPanel() {
    lazy('visLive', '/.netlify/functions/visibility', 'content');
    var X = D.visLive, title = 'Found by AI assistants', sub = 'When guests ask an AI assistant for a recommendation';
    if (!X) return panel(title, sub, '<p class="meta">Loading.</p>');
    var L = X.latest;
    if (!L) {
      if (X.status === 'running') { setTimeout(function () { if (location.hash === '#content') { LAZY.visLive = false; lazy('visLive', '/.netlify/functions/visibility', 'content', true); } }, 60000); return panel(title, 'Being checked now', '<p class="meta">Meridian is asking an AI assistant the questions your guests would ask, from ' + esc((D.answers || {}).city || 'your area') + '. Results appear here in a few minutes.</p>'); }
      return panel(title, sub, '<p class="meta">The check could not finish just now.' + (X.error ? ' Reason: ' + esc(X.error) : '') + '</p><div class="actions" style="margin-top:10px"><button class="btn" data-x="visretry">Try again</button></div>');
    }
    var prev = X.history[1], trend = prev ? (L.named - prev.named > 0 ? 'Up from ' + prev.named + ' last time' : L.named < prev.named ? 'Down from ' + prev.named + ' last time' : 'Same as last time') : 'First check';
    var stats = [{ n: L.named + ' of ' + L.total, l: 'Questions where you are recommended' }, { n: L.avgPosition ? '#' + L.avgPosition : '-', l: 'Average place when recommended' }, { n: trend, l: 'Checked ' + new Date(L.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }) }];
    var rows = (L.results || []).filter(function (r) { return !r.error; }).map(function (r) {
      return '<li><div class="grow"><div><strong>' + esc(r.q) + '</strong></div>' + (r.named ? '' : r.others.length ? '<div class="meta">Recommended instead: ' + r.others.slice(0, 3).map(esc).join(', ') + '</div>' : '<div class="meta">No specific places were recommended</div>') +
        '<details class="meta" style="margin-top:4px"><summary style="cursor:pointer">See the answer</summary><div style="margin-top:6px;white-space:pre-line;max-width:70ch">' + esc(String(r.excerpt).replace(/\*\*/g, '')) + '</div>' + (r.sources && r.sources.length ? '<div style="margin-top:6px">Drew on: ' + r.sources.map(esc).join(', ') + '</div>' : '') + '</details></div>' +
        '<span class="tag ' + (r.named ? 'on' : '') + '">' + (r.named ? (r.position ? 'Recommended #' + r.position : 'Mentioned') : 'Not yet') + '</span></li>';
    }).join('');
    var acts = (L.actions || []).length ? '<h3 style="font-size:15px;margin:22px 0 8px">What would help you be recommended more</h3><ul class="list">' + L.actions.map(function (a) { return '<li><span class="dot"></span><div class="grow"><div><strong>' + esc(a.title) + '</strong></div><div class="meta">' + esc(a.why) + '</div></div></li>'; }).join('') + '</ul>' : '';
    var sites = (L.sites || []).length ? '<p class="meta" style="margin-top:14px">The answers drew most on ' + L.sites.slice(0, 4).map(function (x) { return esc(x.name); }).join(', ') + '. Being listed and reviewed on these sites helps.</p>' : '';
    return panel(title, sub + '. Checked every month from ' + esc((D.answers || {}).city || 'your area'),
      '<div class="mini-stats" style="margin-bottom:18px">' + stats.map(function (x) { return '<div class="stat"><span class="n" style="font-size:24px">' + esc(String(x.n)) + '</span><span class="l">' + esc(x.l) + '</span></div>'; }).join('') + '</div>' +
      '<ul class="list">' + rows + '</ul>' + acts + sites + (X.admin ? '<p class="meta" style="margin-top:12px"><a href="#" data-x="visrun">Run the check again</a> (staff only)</p>' : ''));
  }
  V.content = function () {
    var a = D.aiSearch, liveVis = !!(cidParam() && D.client);
    return head('Content', 'Written for you every week. Nothing is published until you approve it.') + connectBlock() + socialCalendarBlock() + brandBlock() + socialBlock() +
      (liveVis ? visibilityPanel() + '<div style="height:20px"></div><div class="grid g-hero">' : '<div class="grid g-hero">' +
        panel('Found by AI assistants', 'When guests ask an AI assistant for a recommendation', '<div class="mini-stats" style="margin-bottom:18px">' + a.stats.map(function (x) { return '<div class="stat"><span class="n" style="font-size:26px">' + x.n + '</span><span class="l">' + esc(x.l) + '</span></div>'; }).join('') + '</div>' +
          '<div class="ask"><div class="ask-q">' + esc(a.question) + '</div><div class="ask-a">' + esc(a.answer) + '</div></div>')) +
        panel('Coming next month', D.nextMonth.length + ' articles planned', '<ul class="list">' + D.nextMonth.map(function (x) { return '<li><span class="dot off"></span><div class="grow">' + esc(x.t) + '</div><span class="meta">' + esc(x.d) + '</span></li>'; }).join('') + '</ul>') +
      '</div><div style="height:20px"></div>' +
      panel('Articles this month', 'How each article is found on Google', '<ul class="list arts">' + D.articles.map(function (x) {
        var pub = x.status === 'Published';
        return '<li><div class="grow"><div class="meta">' + esc(x.when) + '</div><div class="art-t">' + esc(x.t) + '</div><div class="kws">' + x.kw.map(function (k) { return '<span class="tag">' + esc(k) + '</span>'; }).join('') + '</div>' + (x.note ? '<div class="meta" style="margin-top:8px;max-width:60ch">' + esc(x.note) + '</div>' : '') + '</div>' +
          (pub ? '<div class="art-n"><div><b>' + x.views + '</b><span>views</span></div><div><b>' + x.clicks + '</b><span>clicks</span></div><div><b>' + x.pos + '</b><span>position</span></div></div>' : '<div class="actions"><button class="btn ghost" data-act="edit">Preview</button><button class="btn" data-act="approve">Publish</button></div>') + '</li>';
      }).join('') + '</ul>') +
      '<div style="height:20px"></div><h2 class="sec">Posts and emails to approve</h2>' + (D.livePosts ? strategyLine() + livePostsBlock() : '') +
      (D.livePosts ? '' : '<div class="grid g3">' + D.content.map(function (c) {
        return '<section class="panel" style="padding:0;overflow:hidden"><img src="' + c.img + '" alt="" style="width:100%;height:180px;object-fit:cover;display:block"><div style="padding:18px 20px 20px"><div class="meta" style="font-size:12px;color:' + LABEL + '">' + esc(c.type) + ', ' + esc(c.when) + '</div><div style="font-weight:500;margin:4px 0 16px">' + esc(c.title) + '</div>' + approveBtns() + '</div></section>';
      }).join('') + '</div>');
  };

  // This week's Instagram posts for a live client: approve one and it is scheduled to their connected accounts.
  function livePostsBlock() {
    var L = D.livePosts;
    if (L.status === 'writing' || L.status === 'none') { setTimeout(function () { if (location.hash === '#content') location.reload(); }, 40000); return '<p class="meta">This week\u2019s posts are being written in your voice. They appear here in a minute or two.</p>'; }
    if (L.status === 'failed') return '<p class="meta">This week\u2019s posts could not be written just now.' + (L.error ? ' Reason: ' + esc(L.error) : '') + '</p><div class="actions" style="margin:10px 0 20px"><button class="btn" data-act="retryposts">Try again</button></div>';
    var to = (L.accounts || []).map(function (a) { return a.platform + ' ' + a.name; }).join(' and ');
    return '<p class="meta" style="margin:-6px 0 14px">' + (to ? 'Approved posts are scheduled to ' + esc(to) + '.' : 'Connect Instagram or Facebook to have approved posts scheduled for you.' + (L.accountsError ? ' (Staff note: ' + esc(L.accountsError) + ')' : '')) + '</p><div class="grid g3">' +
      (L.posts || []).map(function (p) {
        var s = (L.scheduled || {})[p.id];
        var when = s ? new Date(s.when).toLocaleString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : '';
        var imgs = p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : []);
        var fmt = p.format === 'carousel' ? 'Carousel, ' + imgs.length + ' photos' : p.format === 'reel' ? 'Reel' : 'Single photo';
        var pic = imgs.length ? '<img src="' + esc(imgs[0]) + '" alt="" style="width:100%;height:200px;object-fit:cover;display:block">' +
            (imgs.length > 1 ? '<div style="display:flex;gap:4px;padding:4px 4px 0;overflow-x:auto">' + imgs.slice(1).map(function (u) { return '<img src="' + esc(u) + '" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:4px;flex-shrink:0">'; }).join('') + '</div>' : '')
          : '<div style="background:#F5F0EA;padding:16px 20px;font-size:13px;color:#4A7570">Suggested photo: ' + esc(p.image) + '</div>';
        if (p.rewriting) {
          setTimeout(function () { if (location.hash === '#content') fetch('/.netlify/functions/social' + clientQS(), { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (P) { D.livePosts = P; render(); }).catch(function () {}); }, 20000);
          return '<section class="panel post-card" style="padding:0;overflow:hidden;display:block">' + pic + '<div style="padding:18px 20px 20px"><div class="meta">Writing another version. It appears here in under a minute.</div></div></section>';
        }
        return '<section class="panel post-card" style="padding:0;overflow:hidden;display:block">' + pic +
          '<div style="padding:18px 20px 20px"><div class="meta" style="font-size:12px">Instagram, ' + esc(p.day) + ' ' + esc(p.time) + '. ' + fmt + (p.pillar ? '. ' + esc(p.pillar) : '') + '</div><div class="em-subj" style="font-weight:500;margin:4px 0 10px">' + esc(p.title) + '</div>' +
          (p.format === 'reel' && p.reel ? '<div class="meta" style="margin:-4px 0 10px">To film: ' + esc(p.reel) + '</div>' : '') +
          '<div class="em-text" style="white-space:pre-line;font-size:14px;margin-bottom:14px">' + esc(p.caption) + '</div>' +
          (p.redoError ? '<div class="meta" style="margin-bottom:8px">' + esc(p.redoError) + '</div>' : '') +
          (s ? '<div class="meta">' + (s.status === 'draft' ? (s.reason === 'video' ? 'Saved for our team to add the video before ' : 'Saved for our team to add a photo before ') + esc(when) : 'Scheduled for ' + esc(when)) + '</div>' :
            '<div class="actions" style="flex-wrap:wrap"><button class="btn ghost" data-act="edit">Edit</button><button class="btn ghost" data-x="redo" data-post="' + esc(p.id) + '">Write another version</button><button class="btn" data-act="schedule" data-post="' + esc(p.id) + '">' + (p.format === 'reel' ? 'Approve' : 'Approve and schedule') + '</button></div><div class="redo-box"></div>') +
          '</div></section>';
      }).join('') + '</div><div style="height:20px"></div>';
  }


  // Every booking traced to its source: the channel that first brought each guest.
  function traceBlock() {
    var A = D.attribution; if (!A) return '';
    var rows = A.channels.map(function (c) {
      return '<tr><td><strong>' + esc(c.l) + '</strong></td><td>' + (c.guests || '') + '</td><td>' + c.bookings + '</td><td>' + (c.revenue ? money(c.revenue) : '') + '</td></tr>';
    }).join('');
    var note = A.traced + '% of bookings traced to a channel.' + (A.traced < 100 ? ' Untraced bookings were made before tracking started or without a tracked link.' : '') +
      (A.testPayments ? ' Revenue includes test payments.' : '');
    return panel('Where every booking came from', 'Live. A guest\'s first booking counts for the channel that brought them; later visits count as returning guests.',
      '<table class="tbl"><thead><tr><th>Channel</th><th>New guests</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>' + rows + '</tbody></table><p class="meta" style="margin-top:12px">' + esc(note) + '</p>') +
      '<div style="height:20px"></div>';
  }

  V.ads = function () {
    var c = D.ads.channels;
    var spend = c.reduce(function (s, r) { return s + r.spend; }, 0), rev = c.reduce(function (s, r) { return s + r.rev; }, 0);
    return head('Ads', 'What your ad budget returned. Ad spend is charged to your own account.') + traceBlock() +
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


  // Monthly optimisation review: suggestions drawn from the client's own results.
  // Each one names the evidence, the change and how it will be tested, and goes to the team when approved.
  function suggestions() {
    var out = [], g = D.goals || {}, A = D.attribution;
    var rb = g.rebookRate || {}, ng = g.newGuests || {}, rev = g.revenue || {};
    if (rb.target && rb.actual != null && rb.actual < rb.target) out.push({
      area: 'Returning guests', title: 'Test a sooner rebooking message',
      why: rb.actual + '% of guests rebook against your goal of ' + rb.target + '%.',
      change: 'Your rebooking email goes 21 days after a visit. We would send half your guests the same email at 14 days instead.',
      test: 'A/B test for 6 weeks. The winner is whichever brings more second visits within 30 days.'
    });
    if (A && A.channels) {
      var ret = A.channels.find(function (c) { return c.l === 'Returning guests'; });
      var firsts = A.channels.filter(function (c) { return c.l !== 'Returning guests'; }).reduce(function (n, c) { return n + c.guests; }, 0);
      if (firsts && (!ret || ret.bookings < firsts / 2)) out.push({
        area: 'Guest journeys', title: 'Add a second-visit journey',
        why: firsts + ' new guests booked recently and fewer than half have come back yet.',
        change: 'A new journey two days after a first visit: a thank-you, what to book next and a reason to return within the month.',
        test: 'Runs for every first-time guest. Measured on second visits within 45 days, compared with the last 3 months.'
      });
      var paidCh = A.channels.filter(function (c) { return c.l !== 'Returning guests' && c.l !== 'Not recorded' && c.guests; }).sort(function (a, b) { return b.revenue / b.guests - a.revenue / a.guests; });
      if (paidCh.length > 1) out.push({
        area: 'Channels', title: 'Lean into ' + paidCh[0].l,
        why: 'Guests who found you through ' + paidCh[0].l + ' spend the most on their first visit (' + money(Math.round(paidCh[0].revenue / paidCh[0].guests)) + ' each).',
        change: 'Shift more of next month’s content and outreach towards ' + paidCh[0].l + '.',
        test: 'Compared month on month on new guests and first-visit spend.'
      });
      if (A.traced < 70) out.push({
        area: 'Tracking', title: 'Trace more bookings to their source',
        why: 'Only ' + A.traced + '% of bookings can be traced to the channel that brought them.',
        change: 'Tracked booking links in your social profiles, emails and Google listing.',
        test: 'Aim for 80% of bookings traced within a month.'
      });
    }
    if (ng.target && ng.actual != null && ng.actual < ng.target) out.push({
      area: 'New guests', title: 'Test a new first-message opening',
      why: ng.actual + ' new guests this month against your goal of ' + ng.target + '.',
      change: 'Half of new-guest messages lead with your signature offer, half with what makes you different.',
      test: 'A/B test until each version has reached 100 people. The winner is the one with more bookings.'
    });
    out.push({
      area: 'Wording', title: 'Test the welcome email subject line',
      why: 'The first email a new guest opens sets how many read the rest.',
      change: 'Keep "Before your first visit" for half your guests and try a version written around your signature offer for the other half.',
      test: 'A/B test for 4 weeks on opens and first visits kept.'
    });
    return out.slice(0, 5).map(function (x) { x.key = x.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50); return x; });
  }
  var OPT = [], WORDING = {};
  function wordingHtml(k) {
    var v = WORDING[k]; if (!v) return '';
    return '<div style="background:var(--linen,#F5F0EA);border-radius:10px;padding:14px 16px;margin:0 0 14px"><div class="email-when">' + esc(v.label.toUpperCase()) + '</div><div style="white-space:pre-line;margin-top:6px">' + esc(v.text) + '</div></div>';
  }
  function loadWording() {
    var need = OPT.filter(function (x) { return !WORDING[x.key]; });
    if (!need.length || !D.live) return;
    var cid = new URLSearchParams(location.search).get('client') || '';
    fetch('/.netlify/functions/wording', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: cid, items: need }) })
      .then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
        var v = j.versions || {}; Object.keys(v).forEach(function (k) { WORDING[k] = v[k]; });
        document.querySelectorAll('.ai-ver').forEach(function (el) { el.innerHTML = wordingHtml(el.getAttribute('data-k')); });
      }).catch(function () {});
  }
  function optimiseBlock() {
    var list = OPT = suggestions();
    return '<div style="height:20px"></div><div class="page-head" style="margin-top:12px"><div><h1 style="font-size:28px">What we’d change</h1><p>This month’s suggestions, drawn from the numbers above. Nothing changes until you approve it.</p></div></div>' +
      list.map(function (x) {
        return '<section class="panel opt" style="margin-bottom:16px"><div class="email-when">' + esc(x.area.toUpperCase()) + '</div>' +
          '<div class="em-subj" style="font-family:var(--serif);font-size:20px;margin:4px 0 10px">' + esc(x.title) + '</div>' +
          '<p class="meta" style="margin-bottom:8px"><b>What we saw:</b> ' + esc(x.why) + '</p>' +
          '<p class="meta grow" style="margin-bottom:8px"><b>What we would change:</b> ' + esc(x.change) + '</p>' +
          '<p class="meta" style="margin-bottom:14px"><b>How we will know:</b> ' + esc(x.test) + '</p>' + '<div class="ai-ver" data-k="' + esc(x.key) + '">' + wordingHtml(x.key) + '</div>' + approveBtns() + '</section>';
      }).join('') +
      '<p class="meta">Approved changes are made by the Pixel Primed team, and test results appear here as they come in.</p>';
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
      panel('Which channels work best', 'Share of people reached who became interested', bars(I.channels.map(function (c) { return { l: c.l, v: c.rate }; }), function (v) { return v + '%'; }, false, 12) + '<ul class="list" style="margin-top:18px">' + I.channels.map(function (c) { return '<li><div class="grow"><div>' + esc(c.l) + '</div><div class="meta">' + c.reached + ' reached, ' + c.warm + ' interested. ' + esc(c.note) + '</div></div></li>'; }).join('') + '</ul>') + optimiseBlock();
  };

  /* ---------- loaded on demand: campaigns, brand plan, Klaviyo, social calendar ---------- */
  function cidParam() { return new URLSearchParams(location.search).get('client') || ''; }
  var LAZY = {};
  // Fetches once per page load; re-renders the page the data belongs to when it arrives.
  function lazy(key, url, page, force) {
    if (!cidParam() || (LAZY[key] && !force)) return;
    LAZY[key] = true;
    fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'client=' + encodeURIComponent(cidParam()), { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j) { D[key] = j; if ((location.hash || '#overview').slice(1) === page) render(); } })
      .catch(function () {});
  }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function niceDate(s, long) { var d = new Date(s + (s.length === 10 ? 'T00:00:00' : '')); return d.toLocaleDateString('en-AU', long ? { weekday: 'short', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' }); }
  // A calendar grid, Monday first. Items: {date:'YYYY-MM-DD', label, cls, title}.
  function calGrid(start, weeks, items, monthOf) {
    var by = {}; items.forEach(function (it) { (by[it.date] = by[it.date] || []).push(it); });
    var d = new Date(start), today = ymd(new Date()), out = '<div class="cal" role="grid"><div class="cal-h">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="cal-g">';
    for (var i = 0; i < weeks * 7; i++) {
      var k = ymd(d), list = by[k] || [], other = monthOf != null && d.getMonth() !== monthOf;
      out += '<div class="cal-d' + (k === today ? ' today' : '') + (other ? ' other' : '') + '"><span class="cal-n">' + d.getDate() + (d.getDate() === 1 || i === 0 ? ' ' + d.toLocaleDateString('en-AU', { month: 'short' }) : '') + '</span>' +
        list.slice(0, 4).map(function (it) { return '<span class="cal-i ' + (it.cls || '') + '" title="' + esc(it.title || it.label) + '">' + esc(it.label) + '</span>'; }).join('') + (list.length > 4 ? '<span class="meta">+' + (list.length - 4) + ' more</span>' : '') + '</div>';
      d.setDate(d.getDate() + 1);
    }
    return out + '</div></div>';
  }
  function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  // Each day a campaign runs, as calendar items.
  function campaignItems(list) {
    var out = [];
    (list || []).forEach(function (c) {
      var d = new Date(c.start + 'T00:00:00'), end = new Date((c.end || c.start) + 'T00:00:00'), n = 0;
      while (d <= end && n < 120) { out.push({ date: ymd(d), label: c.name, cls: 'camp', title: c.name + (c.offer ? '. ' + c.offer : '') }); d.setDate(d.getDate() + 1); n++; }
    });
    return out;
  }
  var SAMPLE_CAMPAIGNS = function () {
    var t = new Date(), at = function (n) { var d = new Date(t); d.setDate(d.getDate() + n); return ymd(d); };
    return [{ id: 's1', name: 'Gift cards for the holidays', start: at(3), end: at(24), offer: 'Gift cards in any amount', channels: 'Email, Instagram', notes: 'Lead with gifting for someone who needs a rest' },
      { id: 's2', name: 'Twilight bathing evenings', start: at(10), end: at(12), offer: 'Evening sessions', channels: 'Instagram', notes: '' },
      { id: 's3', name: 'New year reset', start: at(35), end: at(50), offer: 'Three-visit pass', channels: 'Email, Instagram, Google', notes: '' }];
  };

  V.campaigns = function () {
    var live = !!cidParam();
    if (live) lazy('campaignsLive', '/.netlify/functions/campaigns', 'campaigns');
    var C = live ? D.campaignsLive : { campaigns: SAMPLE_CAMPAIGNS() };
    if (!C) return head('Campaigns', 'Your campaign calendar. Posts, emails and journeys are planned around it.') + panel('Loading your calendar', '', '<p class="meta">One moment.</p>');
    var now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth() + CAL_MONTH, 1), start = mondayOf(m0);
    var weeks = Math.ceil(((m0.getDay() + 6) % 7 + new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate()) / 7);
    var today = ymd(now), upcoming = (C.campaigns || []).filter(function (c) { return (c.end || c.start) >= today; }), past = (C.campaigns || []).filter(function (c) { return (c.end || c.start) < today; });
    var sh = C.sheet;
    var row = function (c) {
      return '<li><div class="grow"><div><strong>' + esc(c.name) + '</strong></div><div class="meta">' + niceDate(c.start, true) + (c.end && c.end !== c.start ? ' to ' + niceDate(c.end, true) : '') + (c.channels ? '. ' + esc(c.channels) : '') + '</div>' +
        (c.offer ? '<div class="meta">Offer: ' + esc(c.offer) + '</div>' : '') + (c.notes ? '<div class="meta">' + esc(c.notes) + '</div>' : '') + '</div>' +
        (live && c.source === 'manual' ? '<div class="actions"><button class="btn ghost" data-x="cedit" data-id="' + esc(c.id) + '">Edit</button><button class="btn ghost" data-x="cdel" data-id="' + esc(c.id) + '">Remove</button></div>' : '<span class="tag">' + esc({ sheet: 'Google Sheet', upload: 'Spreadsheet', manual: 'Added here' }[c.source] || 'Sample') + '</span>') + '</li>';
    };
    var tools = '<div class="actions" style="flex-wrap:wrap"><button class="btn" data-x="cadd">Add a campaign</button><button class="btn ghost" data-x="cupload">Upload a spreadsheet</button><button class="btn ghost" data-x="csheet">Link a Google Sheet</button>' +
      '<input type="file" id="c-file" accept=".csv,.xlsx,.xls" hidden></div>' +
      '<p class="meta" style="margin-top:12px">Spreadsheets need a header row with at least Campaign and Start date. End date, Offer, Channels and Notes are picked up too.' +
      (sh && sh.link ? ' Linked sheet: synced ' + new Date(sh.at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + (sh.error ? '. ' + esc(sh.error) : ', ' + (sh.count || 0) + ' campaign' + (sh.count === 1 ? '' : 's')) + '. <a href="#" data-x="csync">Sync now</a>' : '') + '</p><div id="c-form"></div>';
    return head('Campaigns', 'Your campaign calendar. Your weekly posts, emails and journeys are planned around it.') +
      panel('Add your campaigns', live ? 'Add them here, upload a spreadsheet or link the Google Sheet you already use' : 'In your own dashboard you add campaigns here, upload a spreadsheet or link a Google Sheet', tools) + '<div style="height:20px"></div>' +
      panel(m0.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }), 'Campaign days are shaded', '<div class="actions" style="margin:-8px 0 12px"><button class="btn ghost" data-x="cmonth" data-d="-1">Previous month</button><button class="btn ghost" data-x="cmonth" data-d="1">Next month</button></div>' +
        calGrid(start, weeks, campaignItems(C.campaigns), m0.getMonth())) + '<div style="height:20px"></div>' +
      panel('Coming up', upcoming.length ? upcoming.length + ' campaign' + (upcoming.length === 1 ? '' : 's') : 'Nothing planned yet', upcoming.length ? '<ul class="list">' + upcoming.map(row).join('') + '</ul>' : '<p class="meta">Add your first campaign and Meridian plans your posts around it.</p>') +
      (past.length ? '<div style="height:20px"></div>' + panel('Finished', '', '<ul class="list">' + past.slice(-6).reverse().map(row).join('') + '</ul>') : '');
  };
  var CAL_MONTH = 0;
  function campaignForm(c) {
    c = c || {};
    var f = function (k, l, type, v) { return '<label style="display:block;margin:0 0 12px"><span class="meta">' + l + '</span><input name="' + k + '" type="' + type + '" value="' + esc(v || '') + '" style="display:block;width:100%;margin-top:6px;font:inherit;padding:10px 12px;border:1px solid var(--rule);border-radius:8px"></label>'; };
    $('#c-form').innerHTML = '<div class="panel" style="margin-top:16px;background:var(--cream)" data-cid="' + esc(c.id || '') + '">' + f('name', 'Campaign', 'text', c.name) +
      '<div class="grid g2" style="gap:12px">' + f('start', 'Starts', 'date', c.start) + f('end', 'Ends', 'date', c.end) + '</div>' + f('offer', 'Offer (optional)', 'text', c.offer) + f('channels', 'Channels (optional)', 'text', c.channels) + f('notes', 'Notes (optional)', 'text', c.notes) +
      '<div class="actions"><button class="btn ghost" data-x="ccancel">Cancel</button><button class="btn" data-x="csave">Save campaign</button></div></div>';
    $('#c-form input').focus();
  }
  function saveCampaigns(body, done) {
    return fetch('/.netlify/functions/campaigns?client=' + encodeURIComponent(cidParam()), { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok) { toast(x.j.error || 'That could not be saved'); return; } D.campaignsLive = x.j; render(); toast(done(x.j)); })
      .catch(function () { toast('That could not be saved. Please try again.'); });
  }
  function readSheetFile(file) {
    var send = function (csv) { saveCampaigns({ csv: csv }, function (j) { return j.imported + ' campaign' + (j.imported === 1 ? '' : 's') + ' added' + (j.skipped && j.skipped.length ? '. Rows without a date were skipped: ' + j.skipped.join(', ') : ''); }); };
    if (/\.csv$/i.test(file.name)) { file.text().then(send); return; }
    // Excel files are read in the browser with SheetJS, loaded only when needed.
    var go = function () { file.arrayBuffer().then(function (buf) { var wb = window.XLSX.read(buf, { type: 'array', cellDates: false }); send(window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { rawNumbers: true })); }).catch(function () { toast('That spreadsheet could not be read. Try saving it as CSV.'); }); };
    if (window.XLSX) return go();
    var s = document.createElement('script'); s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'; s.onload = go; s.onerror = function () { toast('Excel files could not be opened just now. Save it as CSV and try again.'); }; document.head.appendChild(s);
  }

  /* Brand: Amplify, Connect, Compound */
  var SAMPLE_BRAND = { promise: 'The place you come back to yourself', assets: [{ name: 'Steam rising at first light', has: true, why: 'Your most photographed moment, worth using the same way everywhere.' }, { name: 'The sound of the bell between rounds', has: true, why: 'A small ritual guests remember and talk about.' }, { name: 'A signature scent in every room', has: false, why: 'Scent is one of the strongest memory cues and few venues own one.' }, { name: 'A short phrase guests repeat', has: false, why: 'One line said the same way in every message builds recall.' }],
    consistency: ['Open every email and post with the same morning steam image style', 'Use one phrase in every booking confirmation', 'Show the bell moment in reels and at the end of each visit'],
    needs: [{ need: 'I need to switch off', occasion: 'End of a long week', offer: 'Bathing circuit', message: 'Two hours where nothing is asked of you.' }, { need: 'A gift for someone who needs a rest', occasion: 'Birthdays and holidays', offer: 'Gift cards', message: 'Give them a morning that is just theirs.' }, { need: 'Time with a friend that is not another dinner', occasion: 'Weekends', offer: 'Shared bathing session', message: 'Catch up somewhere warm and quiet.' }, { need: 'My body is sore', occasion: 'After training or a long drive', offer: 'Recovery massage', message: 'Let the heat and hands do the work.' }],
    guide: { question: 'What do you need today?', options: [{ label: 'To switch off', offer: 'Bathing circuit' }, { label: 'A gift', offer: 'Gift cards' }, { label: 'Time with a friend', offer: 'Shared session' }, { label: 'Ease sore muscles', offer: 'Recovery massage' }] },
    themes: [{ occasion: 'December gifting', idea: 'A gift guide by the kind of rest someone needs' }, { occasion: 'Summer evenings', idea: 'The twilight session, shot as the light drops' }, { occasion: 'New year', idea: 'A slower start to the year, three visits in January' }, { occasion: 'Valentine’s Day', idea: 'Time together without a dinner booking' }],
    compound: [{ stage: 'After the first visit', idea: 'A thank you with one tip to keep the calm going at home' }, { stage: 'Before the second visit', idea: 'Remind them of the moment they liked most' }, { stage: 'Ongoing', idea: 'Members hear about new sessions first' }, { stage: 'A milestone', idea: 'Mark their tenth visit with something small and personal' }] };

  function recallStats() {
    var out = [], name = (D.venue && D.venue.name || '').toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3 && !/^(spa|the|and|wellness|studio|clinic|retreat|house|bathhouse)$/.test(w); });
    var G = D.searchTerms;
    if (G && G.terms) {
      var b = G.terms.filter(function (t) { var q = t.term.toLowerCase(); return name.some(function (w) { return q.indexOf(w) >= 0; }); });
      var bc = b.reduce(function (s, t) { return s + (+t.clicks || 0); }, 0), all = G.terms.reduce(function (s, t) { return s + (+t.clicks || 0); }, 0);
      out.push({ n: bc, l: 'Clicks from searches for your name', d: all ? Math.round(100 * bc / all) + '% of your Google clicks' : 'Last 4 weeks' });
    } else out.push({ n: '-', l: 'Searches for your name', d: 'Shown once Google Search Console is connected' });
    var W = D.webVisits, dir = W && W.sources && W.sources.find(function (s) { return /direct/i.test(s.l); });
    out.push(W && W.sources ? { n: dir ? dir.v : 0, l: 'Visits typed in directly', d: 'People who came straight to you' } : { n: '-', l: 'Visits typed in directly', d: 'Shown once website visits are connected' });
    var S = D.socialLive, reach = S && S.stats.find(function (x) { return /reached/i.test(x.l); });
    out.push(reach ? { n: reach.n, l: 'People reached on social', d: reach.d } : { n: '-', l: 'People reached on social', d: 'Shown once Instagram is connected' });
    if (cidParam()) lazy('visLive', '/.netlify/functions/visibility', 'brand');
    var VL = D.visLive && D.visLive.latest;
    out.push(VL ? { n: VL.named + ' of ' + VL.total, l: 'Guest questions where AI assistants recommend you', d: 'Checked ' + new Date(VL.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) } : cidParam() ? { n: '-', l: 'AI assistants recommending you', d: 'First check under way' } : { n: '3 of 8', l: 'Guest questions where AI assistants recommend you', d: 'Checked monthly' });
    return out;
  }
  V.brand = function () {
    var live = !!cidParam();
    if (live) lazy('brandLive', '/.netlify/functions/brand', 'brand');
    var L = live ? D.brandLive : { status: 'ready', plan: SAMPLE_BRAND };
    var intro = head('Brand', 'Brand and performance working together: be remembered, meet the need of the moment, then keep the relationship growing.');
    if (!L) return intro + panel('Loading your brand plan', '', '<p class="meta">One moment.</p>');
    if (L.status === 'writing' || L.status === 'none') { setTimeout(function () { if (location.hash === '#brand') { LAZY.brandLive = false; lazy('brandLive', '/.netlify/functions/brand', 'brand', true); } }, 40000); return intro + panel('Your brand plan', 'Being written now', '<p class="meta">Meridian is building your brand plan from your business details, your Growth Blueprint and any strategy you uploaded. It appears here in a minute or two.</p>'); }
    if (L.status === 'failed' && !L.plan) return intro + panel('Your brand plan', '', '<p class="meta">Your brand plan could not be written just now.' + (L.error ? ' Reason: ' + esc(L.error) : '') + '</p><div class="actions" style="margin-top:10px"><button class="btn" data-x="brandretry">Try again</button></div>');
    var P = L.plan, li = function (a, f) { return '<ul class="list">' + (a || []).map(f).join('') + '</ul>'; };
    var stage = function (n, name, line) { return '<div class="stage-h"><span class="stage-n">' + n + '</span><div><h2 class="sec" style="margin:0">' + name + '</h2><p class="meta" style="margin:2px 0 0">' + line + '</p></div></div>'; };
    var stats = recallStats();
    return intro +
      (P.promise ? '<p class="brand-promise">' + esc(P.promise) + '</p>' : '') +
      stage(1, 'Amplify', 'Build distinctive memory, so people think of you first') +
      '<div class="stats-row">' + stats.map(function (x) { return '<section class="panel stat"><span class="n">' + esc(String(x.n)) + '</span><span class="l">' + esc(x.l) + '</span><span class="delta">' + esc(x.d) + '</span></section>'; }).join('') + '</div><div style="height:20px"></div>' +
      '<div class="grid g2">' + panel('Your distinctive assets', 'What people should recognise as yours', li(P.assets, function (a) { return '<li><div class="grow"><div><strong>' + esc(a.name) + '</strong></div><div class="meta">' + esc(a.why) + '</div></div><span class="tag ' + (a.has ? 'on' : '') + '">' + (a.has ? 'You have this' : 'To build') + '</span></li>'; })) +
        panel('Show them everywhere', 'Recognition comes from repetition', li(P.consistency, function (x) { return '<li><span class="dot"></span><div class="grow">' + esc(x) + '</div></li>'; })) + '</div>' +
      '<div style="height:28px"></div>' + stage(2, 'Connect', 'Turn what a guest needs right now into the right experience') +
      '<div class="grid g2">' + panel('The needs you answer', 'In your guests’ own words', li(P.needs, function (n) { return '<li><div class="grow"><div><strong>“' + esc(n.need) + '”</strong></div><div class="meta">' + esc(n.occasion) + '. Leads to ' + esc(n.offer) + '.</div><div class="meta" style="color:var(--teal-dk)">' + esc(n.message) + '</div></div></li>'; })) +
        panel('A guide for your website', 'Helps a visitor find the right booking in one tap', '<div class="needs-guide"><div class="ng-q">' + esc((P.guide || {}).question || 'What do you need today?') + '</div><div class="ng-o">' + ((P.guide || {}).options || []).map(function (o) { return '<span title="' + esc(o.offer) + '">' + esc(o.label) + '</span>'; }).join('') + '</div></div>' +
          '<p class="meta" style="margin-top:12px">Each answer takes the visitor to ' + ((P.guide || {}).options || []).map(function (o) { return esc(o.offer); }).join(', ') + '.</p><div class="actions" style="margin-top:12px"><button class="btn" data-act="approve">Add this to my website</button></div>') + '</div><div style="height:20px"></div>' +
      panel('Moments to plan content around', 'The next three months', li(P.themes, function (t) { return '<li><div class="grow"><div><strong>' + esc(t.occasion) + '</strong></div><div class="meta">' + esc(t.idea) + '</div></div></li>'; })) +
      '<div style="height:28px"></div>' + stage(3, 'Compound', 'Turn a first visit into a lasting relationship') +
      '<div class="grid g2">' + panel('Ideas to deepen the relationship', '', li(P.compound, function (c) { return '<li><div class="grow"><div><strong>' + esc(c.stage) + '</strong></div><div class="meta">' + esc(c.idea) + '</div></div></li>'; })) +
        panel('Already working for you', 'Your guest journeys and returning guests', '<p style="max-width:56ch">Your guest journeys welcome new guests, follow up after each visit, invite the next booking and win back guests who have gone quiet.</p><div class="actions" style="margin-top:12px"><a class="btn ghost" href="#returning">See your guest journeys</a></div>') + '</div>' +
      (live ? '<p class="meta" style="margin-top:18px">' + (L.status === 'rewriting' ? 'Rewriting with your latest details.' : 'Written ' + (L.at ? new Date(L.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' }) : '') + '. Changed your business details or strategy? <a href="#" data-x="brandretry">Rewrite this plan</a>.') + '</p>' : '');
  };

  /* Content: the Social Planner calendar with results, and the strategy the posts follow */
  function strategyLine() {
    var L = D.livePosts; if (!L || !cidParam()) return '';
    var bits = [];
    if (L.usedStrategy) bits.push('Following your content strategy');
    else if (!L.hasGuide) bits.push('Upload your content strategy in <a href="/onboard/?edit=1">Business details</a> and your posts will follow it');
    if (L.campaigns && L.campaigns.length) bits.push('planned around ' + L.campaigns.map(esc).join(', '));
    if (L.photoCount === 0) bits.push('upload brand photos in <a href="/onboard/?edit=1">Business details</a> so posts use your own images');
    else if (L.photosLeft != null && L.photosLeft < 6) bits.push((L.photosLeft === 0 ? 'every photo you uploaded has now been used, so add new ones' : L.photosLeft + ' photo' + (L.photosLeft === 1 ? '' : 's') + ' not yet used on your grid. Add more') + ' in <a href="/onboard/?edit=1">Business details</a> to keep posts fresh');
    if (L.guideUnread && L.guideUnread.length) bits.push('the text in your ' + L.guideUnread.map(function (x) { return esc(x.toLowerCase()); }).join(' and ') + ' could not be read, as the pages look like pictures. A PDF or web page version works best. Upload it in <a href="/onboard/?edit=1">Business details</a>');
    var line = bits.join(', '); line = line.charAt(0).toUpperCase() + line.slice(1);
    return '<p class="meta" style="margin:-6px 0 14px">' + line + (bits.length ? '. ' : '') + (L.status === 'ready' ? '<a href="#" data-x="rewriteposts">Rewrite this week’s posts</a>' : '') + '</p>';
  }
  function socialCalendarBlock() {
    if (!cidParam() || !D.client) return '';
    lazy('socialCal', '/.netlify/functions/social?calendar=1', 'content');
    lazy('campaignsLive', '/.netlify/functions/campaigns', 'content');
    var S = D.socialCal;
    if (!S) return panel('Your content calendar', 'Loading', '<p class="meta">One moment.</p>') + '<div style="height:20px"></div>';
    var start = mondayOf(new Date()); start.setDate(start.getDate() - 7);
    var CLS = { published: 'pub', scheduled: 'sch', failed: 'fail', draft: 'dr', in_review: 'dr', pending: 'sch', in_progress: 'sch' };
    var items = (S.posts || []).map(function (p) { return { date: ymd(new Date(p.when)), label: (p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'Post'), cls: CLS[p.status] || '', title: p.text }; })
      .concat(campaignItems((D.campaignsLive || {}).campaigns));
    var pub = (S.posts || []).filter(function (p) { return p.status === 'published'; }).reverse();
    var rows = pub.length ? pub.slice(0, 12).map(function (p) {
      return '<tr><td>' + niceDate(p.when) + '</td><td>' + esc(p.platform.charAt(0).toUpperCase() + p.platform.slice(1)) + '</td><td style="max-width:44ch">' + esc(p.text.slice(0, 110)) + (p.text.length > 110 ? '…' : '') + '</td><td>' + (p.likes != null ? p.likes : '-') + '</td><td>' + (p.comments != null ? p.comments : '-') + '</td><td>' + (p.shares != null ? p.shares : '-') + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="meta">Published posts and their results appear here.</td></tr>';
    var failed = (S.posts || []).filter(function (p) { return p.status === 'failed'; });
    return panel('Your content calendar', 'Last week to five weeks ahead. Everything scheduled or published to your accounts, with your campaigns.',
      '<div class="legend" style="margin-bottom:12px"><span><i class="k-pub"></i>Published</span><span><i class="k-sch"></i>Scheduled</span><span><i class="k-dr"></i>Draft</span><span><i class="k-camp"></i>Campaign</span>' + (failed.length ? '<span><i class="k-fail"></i>Did not publish</span>' : '') + '</div>' +
      calGrid(start, 6, items) + (S.error ? '<p class="meta" style="margin-top:10px">' + esc(S.error) + '</p>' : '') +
      (failed.length ? '<p class="meta" style="margin-top:10px;color:var(--warn)">' + failed.length + ' post' + (failed.length === 1 ? '' : 's') + ' did not publish. Our team has been told and will fix ' + (failed.length === 1 ? 'it' : 'them') + '.</p>' : '')) +
      '<div style="height:20px"></div>' + panel('How your posts performed', 'Published in the last two weeks', '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Where</th><th>Post</th><th>Likes</th><th>Comments</th><th>Shares</th></tr></thead><tbody>' + rows + '</tbody></table></div>') + '<div style="height:20px"></div>';
  }

  /* Returning guests: journeys already running in the client's own Klaviyo */
  function usesKlaviyo() { return (D.answers || {}).email_platform === 'Klaviyo' || !!(D.klaviyoLive && D.klaviyoLive.connected); }
  function klaviyoBlock() {
    if (!cidParam() || !D.client) return '';
    if (!usesKlaviyo()) { if (!LAZY.klaviyoLive) lazy('klaviyoLive', '/.netlify/functions/klaviyo', 'returning'); return ''; }
    lazy('klaviyoLive', '/.netlify/functions/klaviyo', 'returning');
    var K = D.klaviyoLive; if (!K) return '';
    if (!K.connected) return panel('Connect your Klaviyo account', 'Your journeys keep running in Klaviyo. Connect it to see them here with their results', '<p style="max-width:64ch">In Klaviyo, open Settings, then API keys, then Create Private API Key. Name it Meridian, choose Read-only access and copy the key, which starts with pk_. Paste it below. Meridian can only read your journeys and results; it cannot send or change anything.</p>' +
      '<div style="display:flex;gap:8px;margin-top:12px;max-width:560px"><input id="k-key" type="password" autocomplete="off" placeholder="pk_..." style="flex:1;font:inherit;padding:10px 12px;border:1px solid var(--rule);border-radius:8px"><button class="btn" data-x="kconnect">Connect Klaviyo</button></div>') + '<div style="height:20px"></div>';
    var F = K.flows || [];
    var rows = F.length ? F.map(function (f) {
      return '<tr><td><strong>' + esc(f.name) + '</strong><div class="meta">' + esc(f.trigger || '') + '</div></td><td><span class="tag ' + (f.status === 'live' ? 'on' : '') + '">' + esc(f.status === 'live' ? 'Live' : f.status === 'manual' ? 'Manual' : 'Draft') + '</span></td><td>' + (f.sent != null ? f.sent.toLocaleString('en-AU') : '-') + '</td><td>' + (f.openRate != null ? f.openRate + '%' : '-') + '</td><td>' + (f.clickRate != null ? f.clickRate + '%' : '-') + '</td>' + (K.revenue ? '<td>' + (f.revenue != null ? money(f.revenue) : '-') + '</td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="6" class="meta">No journeys found in this Klaviyo account yet.</td></tr>';
    return panel('Your Klaviyo journeys', 'Last 30 days' + (K.account ? ', ' + esc(K.account) : '') + '. Refreshed a few times a day.',
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Journey</th><th>Status</th><th>Sent</th><th>Opened</th><th>Clicked</th>' + (K.revenue ? '<th>Revenue</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (K.reportError || K.error ? '<p class="meta" style="margin-top:10px">' + esc(K.reportError || K.error) + '</p>' : '') + '<p class="meta" style="margin-top:10px"><a href="#" data-x="kdisconnect">Disconnect Klaviyo</a></p>') + '<div style="height:20px"></div>';
  }

  // Links to Business details carry the client, so staff viewing a client's dashboard edit that client.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="/onboard/?edit=1"]');
    if (a && cidParam() && a.href.indexOf('client=') < 0) a.href = '/onboard/?edit=1&client=' + encodeURIComponent(cidParam());
  }, true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-x]'); if (!b) return;
    var x = b.getAttribute('data-x'); e.preventDefault();
    var live = !!cidParam(), demo = function () { toast('In your own dashboard this is saved to your calendar.'); };
    if (x === 'cmonth') { CAL_MONTH += +b.getAttribute('data-d'); render(); return; }
    if (x === 'cadd' || x === 'cedit') { campaignForm(x === 'cedit' ? ((D.campaignsLive || {}).campaigns || []).find(function (c) { return c.id === b.getAttribute('data-id'); }) : null); return; }
    if (x === 'ccancel') { $('#c-form').innerHTML = ''; return; }
    if (x === 'csave') {
      if (!live) return demo();
      var box = b.closest('[data-cid]'), v = {}; box.querySelectorAll('input').forEach(function (i) { v[i.name] = i.value.trim(); }); v.id = box.getAttribute('data-cid') || undefined;
      if (!v.name || !v.start) { toast('Add a name and a start date'); return; }
      saveCampaigns({ campaign: v }, function () { return 'Campaign saved'; }); return;
    }
    if (x === 'cdel') {
      fetch('/.netlify/functions/campaigns?client=' + encodeURIComponent(cidParam()) + '&id=' + encodeURIComponent(b.getAttribute('data-id')), { method: 'DELETE', credentials: 'same-origin' })
        .then(function (r) { return r.json(); }).then(function (j) { D.campaignsLive = j; render(); toast('Removed'); }).catch(function () { toast('That could not be removed'); });
      return;
    }
    if (x === 'cupload') { if (!live) return demo(); var fi = $('#c-file'); fi.onchange = function () { if (fi.files[0]) readSheetFile(fi.files[0]); }; fi.click(); return; }
    if (x === 'csheet') {
      if (!live) return demo();
      $('#c-form').innerHTML = '<div class="panel" style="margin-top:16px;background:var(--cream)"><label class="meta" for="c-sheet">Google Sheet link. In Google Sheets choose Share, then "Anyone with the link can view".</label><div style="display:flex;gap:8px;margin-top:6px"><input id="c-sheet" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." style="flex:1;font:inherit;padding:10px 12px;border:1px solid var(--rule);border-radius:8px"><button class="btn" data-x="csheetgo">Import</button></div><p class="meta" style="margin-top:8px">Meridian checks the sheet again every day, so changes you make there show up here.</p></div>';
      $('#c-sheet').focus(); return;
    }
    if (x === 'csheetgo') { var link = $('#c-sheet').value.trim(); if (!link) return; b.disabled = true; b.textContent = 'Importing'; saveCampaigns({ sheet: link }, function (j) { return j.imported + ' campaign' + (j.imported === 1 ? '' : 's') + ' imported'; }).then(function () { b.disabled = false; b.textContent = 'Import'; }); return; }
    if (x === 'csync') { LAZY.campaignsLive = false; lazy('campaignsLive', '/.netlify/functions/campaigns?sync=1', 'campaigns', true); toast('Syncing your sheet'); return; }
    if (x === 'brandretry') {
      fetch('/.netlify/functions/brand?client=' + encodeURIComponent(cidParam()) + '&rewrite=1', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { D.brandLive = j; render(); toast('Writing your brand plan'); }).catch(function () {});
      return;
    }
    if (x === 'visretry' || x === 'visrun') {
      fetch('/.netlify/functions/visibility?client=' + encodeURIComponent(cidParam()) + (x === 'visrun' ? '&run=1' : '&retry=1'), { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { D.visLive = j; if (j.status === 'running' && !j.latest) render(); toast('Checking now. Results appear in a few minutes.'); }).catch(function () {});
      return;
    }
    if (x === 'redo') {
      var box = b.closest('.post-card').querySelector('.redo-box');
      box.innerHTML = '<div style="margin-top:12px"><label class="meta" style="display:block;margin-bottom:6px">What would you like different? Optional, for example a warmer title or a different angle.</label><textarea rows="2" style="width:100%;font:inherit;padding:10px 12px;border:1px solid var(--rule);border-radius:8px"></textarea><div class="actions" style="margin-top:8px"><button class="btn ghost" data-x="redocancel">Cancel</button><button class="btn" data-x="redogo" data-post="' + esc(b.getAttribute('data-post')) + '">Write it</button></div></div>';
      box.querySelector('textarea').focus(); return;
    }
    if (x === 'redocancel') { b.closest('.redo-box').innerHTML = ''; return; }
    if (x === 'redogo') {
      var note = b.closest('.redo-box').querySelector('textarea').value.trim(), id = b.getAttribute('data-post'); b.disabled = true;
      fetch('/.netlify/functions/social?client=' + encodeURIComponent(cidParam()), { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redo: id, note: note }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (r) { if (!r.ok) { b.disabled = false; toast(r.j.error || 'That did not work'); return; } (D.livePosts.posts || []).forEach(function (p) { if (p.id === id) p.rewriting = true; }); render(); })
        .catch(function () { b.disabled = false; toast('That did not work. Please try again.'); });
      return;
    }
    if (x === 'rewriteposts') {
      fetch('/.netlify/functions/social?client=' + encodeURIComponent(cidParam()) + '&rewrite=1', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (P) { D.livePosts = P; render(); toast('Rewriting this week’s posts. Scheduled posts stay as they are.'); }).catch(function () {});
      return;
    }
    if (x === 'kconnect' || x === 'kdisconnect') {
      var opts = x === 'kconnect' ? { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: $('#k-key').value.trim() }) } : { method: 'DELETE', credentials: 'same-origin' };
      if (x === 'kconnect' && !$('#k-key').value.trim()) { toast('Paste your Klaviyo key first'); return; }
      b.disabled = true;
      fetch('/.netlify/functions/klaviyo?client=' + encodeURIComponent(cidParam()), opts).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (r) { b.disabled = false; if (!r.ok) { toast(r.j.error || 'That did not work'); return; } toast(r.j.connected ? 'Klaviyo connected' : 'Klaviyo disconnected'); LAZY.klaviyoLive = false; D.klaviyoLive = null; lazy('klaviyoLive', '/.netlify/functions/klaviyo', 'returning', true); })
        .catch(function () { b.disabled = false; toast('That did not work. Please try again.'); });
    }
  });

  /* ---------- routing ---------- */
  var routes = ['overview', 'messages', 'insights', 'audit', 'campaigns', 'brand', 'plan', 'bookings', 'guests', 'returning', 'reviews', 'content', 'ads', 'website', 'partners'];
  var EMPTY = { overview: 'Overview', messages: 'Messages', bookings: 'Bookings', returning: 'Returning guests', reviews: 'Reviews', guests: 'New guests', partners: 'Partners', ads: 'Ads' };
  function emptyView(r) {
    return head(EMPTY[r] || 'Your dashboard', 'Your own figures appear here as soon as your account is connected.') +
      panel('Getting your account ready', 'Usually within one working day of your setup call', '<p style="max-width:62ch">Our team is connecting your bookings, guests and messages. Until then this page stays empty rather than showing anyone else\u2019s numbers. Your Growth Blueprint, plan, content and brand voice are ready to look at now.</p><div class="actions" style="margin-top:14px"><a class="btn" href="#audit">See your Growth Blueprint</a><a class="btn ghost" href="#content">See your content</a></div>');
  }
  function render() {
    var r = (location.hash || '#overview').slice(1);
    if (r === 'optimise') r = 'insights';
    if (routes.indexOf(r) < 0) r = 'overview';
    var waiting = document.body.classList.contains('client-view') && !D.live && ['overview', 'messages', 'bookings', 'returning', 'reviews', 'guests', 'partners', 'ads'].indexOf(r) >= 0;
    $('#page').innerHTML = !has(r) ? upgradeView(r) : waiting ? emptyView(r) : V[r]();
    document.querySelectorAll('.nav a[href^="#"]').forEach(function (a) {
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
    if (r === 'insights' && has('plan')) loadWording();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  /* ---------- approvals ---------- */
  // Each Approve button is identified by its page and the item's title, so the saved state survives reloads.
  var APPROVALS = {};
  function approvalItem(b) {
    var box = b.closest('.em, .opt, .post-card, li, tr') || b.parentNode;
    var tEl = box.querySelector('.em-subj') || box.querySelector('.grow > div:first-child, td strong, strong') || box.querySelector('.email-when') || box;
    var title = (tEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    var mEl = box.querySelector('.meta.grow, .grow .meta, .meta');
    var page = (location.hash || '#overview').slice(1);
    return { key: page + ':' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120), title: title, detail: mEl ? mEl.textContent.replace(/\s+/g, ' ').trim() : '', page: page };
  }
  var EDITS = {};
  function clientQS() { var c = new URLSearchParams(location.search).get('client'); return c ? '?client=' + encodeURIComponent(c) : ''; }
  // The text an Edit button changes: an email body, a reply draft or a message.
  function editTarget(b) {
    var box = b.closest('.em, .opt, .post-card, li, tr, .draft') || b.parentNode;
    return { box: box, el: box.querySelector('.em-text') || box.querySelector('textarea') || box.querySelector('p') };
  }
  function editKey(b) { return 'edit:' + approvalItem(b).key; }
  function markApprovals() {
    document.querySelectorAll('[data-act="edit"]').forEach(function (b) {
      var rec = EDITS[editKey(b)], t = editTarget(b); if (!rec || !t.el) return;
      if (t.el.tagName === 'TEXTAREA') t.el.value = rec.text; else t.el.innerHTML = esc(rec.text).replace(/\n/g, '<br>');
      if (!t.box.querySelector('.edit-note')) { var n = document.createElement('div'); n.className = 'meta edit-note'; n.style.margin = '8px 0'; n.textContent = rec.status === 'done' ? 'Your changes are live.' : 'Your changes are saved. Pixel Primed is updating it.'; t.el.parentNode.insertBefore(n, t.el.nextSibling); }
    });
    document.querySelectorAll('[data-act="approve"]').forEach(function (b) {
      var rec = APPROVALS[approvalItem(b).key]; if (!rec) return;
      b.disabled = true; b.className = 'btn done';
      b.textContent = rec.status === 'done' ? 'Done' : rec.status === 'in_progress' ? 'In progress' : 'Approved';
      b.title = 'Approved ' + new Date(rec.approvedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) + (rec.note ? '. ' + rec.note : '');
    });
  }
  function loadApprovals() {
    if (!D.live) return;
    fetch('/.netlify/functions/approvals' + clientQS(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { approvals: [] }; })
      .then(function (j) { (j.approvals || []).forEach(function (a) { if (a.kind === 'edit') EDITS[a.key] = a; else APPROVALS[a.key] = a; }); markApprovals(); }).catch(function () {});
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
      if (D.liveJourneys) { JOURNEY_TAB = +t.getAttribute('data-journey'); document.getElementById('journey-view').innerHTML = liveJourneyView(JOURNEY_TAB); markApprovals(); }
      else document.getElementById('journey-view').innerHTML = journeyView(+t.getAttribute('data-journey'));
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
      fetch('/.netlify/functions/approvals' + clientQS(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it) })
        .then(function (r) { return r.json(); })
        .then(function (rec) { APPROVALS[rec.key] = rec; markApprovals(); toast(rec.taskId ? 'Approved. Pixel Primed has been sent a task.' : 'Approved and saved'); })
        .catch(function () { toast('Approved here, but it could not be saved. Please try again.'); b.textContent = 'Approve'; b.className = 'btn'; b.disabled = false; });
    }
    else if (act === 'interest') { b.textContent = 'Interest sent'; b.className = 'btn done'; b.disabled = true; toast(D.sample ? 'Interest sent. In the demo nothing is sent.' : 'Interest sent'); }
    else if (act === 'switch') {
      var li = b.closest('[data-chan]'), C = li ? D.outreach.channels[+li.getAttribute('data-chan')] : null;
      var on = b.getAttribute('aria-checked') !== 'true';
      var finish = function () {
        if (C) C.on = on;
        if (C && C.k) { var o2 = {}; o2['channel_' + C.k] = on ? 'on' : 'off'; saveAnswers(o2).catch(function () {}); }
        render(); toast(on ? 'Channel switched on' : 'Channel paused');
      };
      if (on && C && C.needs && !(D.answers || {})[C.needs]) {
        if (li.querySelector('.ask')) return;
        var ask = document.createElement('div'); ask.className = 'ask'; ask.style.cssText = 'flex-basis:100%;margin-top:10px';
        if (D.connect && D.connect.link && C.k !== 'email') { location.hash = '#content'; toast('Connect ' + C.l + ' with your secure link at the top of this page'); return; }
        ask.innerHTML = '<label class="meta">' + esc(C.ask) + '</label><div style="display:flex;gap:8px;margin-top:6px"><input type="text" style="flex:1;font:inherit;padding:10px 12px;border:1px solid var(--border,#E9E1D5);border-radius:8px"><button class="btn" data-ask="save">Connect</button></div><div class="meta" style="margin-top:6px">Our team connects it for you, usually within a working day.</div>';
        li.style.flexWrap = 'wrap'; li.appendChild(ask); ask.querySelector('input').focus();
        ask.addEventListener('click', function (ev) {
          if (!ev.target.closest('[data-ask]')) return; ev.stopPropagation();
          var v = ask.querySelector('input').value.trim(); if (!v) return;
          var body = {}; body[C.needs] = v; body['channel_' + C.k] = 'on';
          saveAnswers(body).then(function () {
            D.answers = D.answers || {}; D.answers[C.needs] = v; C.d = 'Connecting ' + v;
            if (D.live) fetch('/.netlify/functions/approvals' + clientQS(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'connect:' + C.k, title: 'Connect ' + C.l + ': ' + v, detail: 'Switched on from the Outreach page', page: 'guests' }) }).catch(function () {});
            ask.remove(); finish();
          }).catch(function () { toast('That could not be saved. Please try again.'); });
        });
        return;
      }
      finish();
    }
    else if (act === 'rewritejourneys' || act === 'approvejourney') {
      if (e && e.preventDefault) e.preventDefault();
      var cq = clientQS();
      if (act === 'rewritejourneys') {
        fetch('/.netlify/functions/journeys' + cq + (cq ? '&' : '?') + 'rewrite=1', { credentials: 'same-origin', cache: 'no-store' })
          .then(function (r) { return r.json(); }).then(function (J) { D.liveJourneys = J; render(); toast('Rewriting your journeys. This takes a few minutes.'); }).catch(function () {});
        return;
      }
      var edits = {};
      document.querySelectorAll('#journey-view [data-email]').forEach(function (a) { var t = a.querySelector('.em-text'); if (t) edits[a.getAttribute('data-email')] = t.innerText.trim(); });
      b.disabled = true; b.textContent = 'Approving';
      fetch('/.netlify/functions/journeys' + cq, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: b.getAttribute('data-key'), edits: edits }) })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (x) { var j = D.liveJourneys.journeys[JOURNEY_TAB]; j.approved = x.approved; render(); toast('Approved. Our team will put this journey live.'); })
        .catch(function () { b.disabled = false; b.textContent = 'Approve this journey'; toast('That could not be approved. Please try again.'); });
    }
    else if (act === 'suggestreply' || act === 'sendreply') {
      var th = b.closest('.thread'), box = th.querySelector('.reply-box'), M = D.inbox || [];
      var cur = M.find(function (m) { return m.contactId === th.getAttribute('data-contact'); }) || {};
      var body = act === 'suggestreply' ? { client: new URLSearchParams(location.search).get('client') || '', suggest: { name: cur.name, text: cur.text, channel: cur.channel } }
        : { client: new URLSearchParams(location.search).get('client') || '', contactId: th.getAttribute('data-contact'), type: th.getAttribute('data-type'), message: box.value.trim() };
      if (act === 'sendreply' && !body.message) { toast('Write a reply first'); return; }
      var label = b.textContent; b.disabled = true; b.textContent = act === 'suggestreply' ? 'Writing' : 'Sending';
      fetch('/.netlify/functions/messages', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          b.disabled = false; b.textContent = label;
          if (!x.ok) { toast(x.j.error || 'That did not work. Please try again.'); return; }
          if (act === 'suggestreply') box.value = x.j.text || '';
          else { box.value = ''; cur.status = 'Answered'; toast('Sent'); }
        }).catch(function () { b.disabled = false; b.textContent = label; toast('That did not work. Please try again.'); });
    }
    else if (act === 'retryposts') {
      b.disabled = true; b.textContent = 'Writing';
      fetch('/.netlify/functions/social' + clientQS() + (clientQS() ? '&' : '?') + 'retry=1', { credentials: 'same-origin', cache: 'no-store' })
        .then(function (r) { return r.json(); }).then(function (P) { D.livePosts = P; render(); }).catch(function () { b.disabled = false; b.textContent = 'Try again'; });
    }
    else if (act === 'schedule') {
      var pid = b.getAttribute('data-post'); b.disabled = true; b.textContent = 'Scheduling';
      fetch('/.netlify/functions/social' + clientQS(), { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: pid, caption: (function () { var t = b.closest('.post-card').querySelector('.em-text'); return t ? t.innerText.trim() : ''; })() }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) { b.disabled = false; b.textContent = 'Approve and schedule'; toast(x.j.needsConnect ? 'Connect Instagram or Facebook first, using the secure link at the top of this page' : (x.j.error || 'That could not be scheduled')); return; }
          D.livePosts.scheduled = D.livePosts.scheduled || {}; D.livePosts.scheduled[pid] = x.j; render();
          toast(x.j.status === 'draft' ? (x.j.reason === 'video' ? 'Approved. Our team will add the video before it goes out.' : 'Saved. Our team will add a photo before it goes out.') : 'Scheduled');
        }).catch(function () { b.disabled = false; b.textContent = 'Approve and schedule'; toast('That could not be scheduled. Please try again.'); });
    }
    else if (act === 'edit') {
      var label = b.textContent.trim();
      if (/change goals/i.test(label)) { goalsForm(); return; }
      if (/download/i.test(label)) { window.print(); return; }
      var t = editTarget(b); if (!t.el || t.box.querySelector('.editing')) return;
      var asks = /request/i.test(label);
      var orig = t.el.tagName === 'TEXTAREA' ? t.el.value : t.el.innerText;
      var wrap = document.createElement('div'); wrap.className = 'editing';
      wrap.innerHTML = '<textarea class="edit-box" rows="8" style="width:100%;font:inherit;padding:12px;border:1px solid var(--border,#E9E1D5);border-radius:8px;background:#fff">' + esc(asks ? '' : orig) + '</textarea>' +
        (asks ? '<div class="meta" style="margin:6px 0 0">Tell us what you would like changed.</div>' : '') +
        '<div class="actions" style="margin-top:10px"><button class="btn ghost" data-edit="cancel">Cancel</button><button class="btn" data-edit="save">' + (asks ? 'Send request' : 'Save changes') + '</button></div>';
      t.el.style.display = 'none'; t.el.parentNode.insertBefore(wrap, t.el.nextSibling);
      wrap.querySelector('textarea').focus();
      wrap.addEventListener('click', function (ev) {
        var w = ev.target.closest('[data-edit]'); if (!w) return;
        ev.stopPropagation();
        if (w.getAttribute('data-edit') === 'cancel') { wrap.remove(); t.el.style.display = ''; return; }
        var text = wrap.querySelector('textarea').value.trim(); if (!text) return;
        // A request is rewritten for them straight away, so they can check it and save it themselves.
        if (asks && D.live && !wrap.dataset.rewritten) {
          w.disabled = true; w.textContent = 'Writing a new version';
          fetch('/.netlify/functions/wording', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: new URLSearchParams(location.search).get('client') || '', rewrite: { text: orig, request: text } }) })
            .then(function (r) { return r.ok ? r.json() : {}; })
            .then(function (j) {
              w.disabled = false;
              if (!j.text) { wrap.dataset.rewritten = 'fallback'; w.textContent = 'Send request to our team'; return; }
              wrap.dataset.rewritten = '1'; asks = false;
              wrap.querySelector('textarea').value = j.text;
              var hint = wrap.querySelector('.meta'); if (hint) hint.textContent = 'Here is a new version with your change. Edit anything, then save.';
              w.textContent = 'Save this version';
            }).catch(function () { w.disabled = false; wrap.dataset.rewritten = 'fallback'; w.textContent = 'Send request to our team'; });
          return;
        }
        var it = approvalItem(b); it.key = editKey(b); it.kind = 'edit'; it.text = asks ? 'Request: ' + text + '\n\nCurrent wording:\n' + orig : text;
        w.disabled = true; w.textContent = 'Saving';
        if (!D.live) { wrap.remove(); t.el.style.display = ''; toast('Saved. In the demo nothing is sent.'); return; }
        fetch('/.netlify/functions/approvals' + clientQS(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it) })
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (rec) {
            wrap.remove(); t.el.style.display = '';
            if (!asks) { EDITS[rec.key] = rec; markApprovals(); }
            toast(asks ? 'Request sent to Pixel Primed' : 'Saved. Pixel Primed has been sent the new wording.');
          })
          .catch(function () { w.disabled = false; w.textContent = 'Try again'; toast('That could not be saved. Please try again.'); });
      });
    }
    else if (act === 'later') { var p = b.closest('.rec, .panel, li'); if (p) p.style.opacity = '.45'; toast('Saved for later'); }
  });

  // Change goals: saved to the client's profile, so every page uses the new targets.
  function goalsForm() {
    if (document.getElementById('goals-form')) return;
    var g = D.goals || {}, id = new URLSearchParams(location.search).get('client');
    var f = document.createElement('div'); f.id = 'goals-form'; f.className = 'panel';
    f.style.cssText = 'position:fixed;inset:0;margin:auto;max-width:440px;height:max-content;z-index:60;box-shadow:0 20px 60px rgba(34,50,44,.18)';
    var row = function (k, l, v, unit) { return '<label style="display:block;margin:0 0 14px"><span class="meta">' + l + '</span><div style="display:flex;align-items:center;gap:8px;margin-top:6px">' + (unit === '$' ? '<span>$</span>' : '') + '<input name="' + k + '" type="number" min="0" value="' + (v || '') + '" style="flex:1;font:inherit;padding:10px 12px;border:1px solid var(--border,#E9E1D5);border-radius:8px">' + (unit === '%' ? '<span>%</span>' : '') + '</div></label>'; };
    f.innerHTML = '<div style="font-family:var(--serif);font-size:22px;margin-bottom:16px">Change your goals</div>' +
      row('revenue_goal', 'Monthly revenue goal', g.revenue && g.revenue.target, '$') +
      row('new_guest_goal', 'New guests each month', g.newGuests && g.newGuests.target) +
      row('rebook_goal', 'Guests who rebook', g.rebookRate && g.rebookRate.target, '%') +
      '<div class="actions"><button class="btn ghost" data-g="cancel">Cancel</button><button class="btn" data-g="save">Save goals</button></div>';
    document.body.appendChild(f);
    f.addEventListener('click', function (ev) {
      var w = ev.target.closest('[data-g]'); if (!w) return; ev.stopPropagation();
      if (w.getAttribute('data-g') === 'cancel') { f.remove(); return; }
      var body = {}; Array.prototype.forEach.call(f.querySelectorAll('input'), function (i) { if (i.value) body[i.name] = i.value; });
      if (!D.live || !id) {
        if (body.revenue_goal) g.revenue.target = +body.revenue_goal; if (body.new_guest_goal) g.newGuests.target = +body.new_guest_goal; if (body.rebook_goal) g.rebookRate.target = +body.rebook_goal;
        f.remove(); render(); toast(D.live ? 'Goals updated' : 'Goals updated. In the demo nothing is saved.'); return;
      }
      w.disabled = true; w.textContent = 'Saving';
      fetch('/.netlify/functions/onboard?id=' + encodeURIComponent(id) + '&update=1', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw 0; location.reload(); })
        .catch(function () { w.disabled = false; w.textContent = 'Try again'; toast('Your goals could not be saved. Please try again.'); });
    });
  }

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
    var convo = [];
    // What the assistant can see: the figures on this client's dashboard right now.
    function snapshot() {
      var pick = function (o, ks) { var r = {}; ks.forEach(function (k) { if (o && o[k] != null) r[k] = o[k]; }); return r; };
      // Only figures that come from the client's own account or profile. Sample panels (outreach, ads, partners) are left out.
      var out = { date: new Date().toISOString().slice(0, 10), plan: tier(), venue: D.venue && D.venue.name, goals: D.goals, plan_channels: D.plan && D.plan.fromGoals ? D.plan.channels : undefined,
        blueprint: D.blueprint ? pick(D.audit, ['baseline', 'now', 'sections', 'next']) : undefined, social: D.socialLive || undefined, notYet: 'Outreach, ads and partner figures are not connected yet' };
      if (D.campaignsLive) out.campaigns = (D.campaignsLive.campaigns || []).filter(function (c) { return (c.end || c.start) >= out.date; }).slice(0, 10);
      if (D.brandLive && D.brandLive.plan) out.brand = pick(D.brandLive.plan, ['promise', 'needs']);
      if (D.klaviyoLive && D.klaviyoLive.flows) out.klaviyo = D.klaviyoLive.flows.slice(0, 12);
      if (D.live) { out.attribution = D.attribution; out.bookings = D.bookings && pick(D.bookings, ['stats', 'week', 'upcoming']); out.returning = D.returning && pick(D.returning, ['stats']); out.reviews = D.reviews && pick(D.reviews, ['stats', 'rating', 'count']); }
      return out;
    }
    function fmt(t) { return esc(t).replace(/\n\s*\d+\.\s/g, '<br>&bull; ').replace(/\n/g, '<br>'); }
    function ask(q) {
      say('me', esc(q)); prompts.hidden = true; convo.push({ role: 'user', text: q });
      var t = document.createElement('div'); t.className = 'ai-msg bot typing'; t.textContent = 'Thinking'; body.appendChild(t);
      var canned = function () { var growthQ = q === 'Which channel brings the best new guests?'; return growthQ && !has('guests') ? esc(D.chat.coreOnly) : (D.chat.answers[q] || esc(D.chat.fallback)); };
      if (!D.live) { setTimeout(function () { t.remove(); say('bot', canned()); }, 800); return; }
      fetch('/.netlify/functions/assistant', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: new URLSearchParams(location.search).get('client') || '', messages: convo, snapshot: snapshot() }) })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (j) { t.remove(); if (j.text) { convo.push({ role: 'assistant', text: j.text }); say('bot', fmt(j.text)); } else say('bot', 'I could not answer that just now. Please try again in a moment.'); })
        .catch(function () { t.remove(); say('bot', 'I could not answer that just now. Please try again in a moment.'); });
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
