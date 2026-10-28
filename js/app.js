// Child Wealth Fund prototype. Figures come from js/data.js and are illustrative.
// The live service must fetch child data from the fund administrator after server-side authentication.
(function () {
  "use strict";

  var D = window.CWF;
  var meta = document.querySelector('meta[name="claude:page"]');
  var page = document.body.getAttribute("data-page") || (meta && meta.getAttribute("content"));
  var SESSION_KEY = "cwf-demo-profile";

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function money(n) { return "BDS $" + Math.round(n).toLocaleString("en-US"); }
  function millions(n) { return "BDS $" + (n / 1e6).toFixed(1) + "m"; }
  function pct(n, dp) { var s = n.toFixed(dp == null ? 1 : dp) + "%"; return n > 0 ? "+" + s : s; }

  // ---------- derived fund figures ----------
  var series = (function () {
    var nav = D.startValue, fundIdx = 100, benchIdx = 100;
    var pts = [{ m: "Launch", fund: 100, bench: 100, nav: nav }];
    var inflow = D.birthsPerMonth * D.grant;
    D.months.forEach(function (r) {
      nav = (nav + inflow) * (1 + r.fund / 100);
      fundIdx *= 1 + r.fund / 100;
      benchIdx *= 1 + r.bench / 100;
      pts.push({ m: r.m, fund: fundIdx, bench: benchIdx, nav: nav });
    });
    return pts;
  })();
  var last = series[series.length - 1];
  var sinceFund = last.fund - 100, sinceBench = last.bench - 100, gap = sinceFund - sinceBench;
  var children = D.startChildren + D.birthsPerMonth * D.months.length;
  var breaches = 0; // all limits within range in this illustration

  var FIGS = {
    asOf: D.asOf,
    inception: D.inception,
    inceptionShort: "launch",
    fundValue: millions(last.nav),
    children: children.toLocaleString("en-US"),
    since: pct(sinceFund),
    sinceBench: "Benchmark " + pct(sinceBench) + ", after all fees",
    cost: D.costPct.toFixed(2) + "%",
    gapWords: (gap < 0 ? Math.abs(gap).toFixed(1) + " points behind" : gap.toFixed(1) + " points ahead of"),
    breaches: String(breaches)
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-fig]"), function (n) {
    var v = FIGS[n.getAttribute("data-fig")];
    if (v != null) n.textContent = v;
  });

  // Current-page marker in the nav
  var navKey = page === "dashboard" ? "login" : page;
  var cur = document.querySelector('[data-nav="' + navKey + '"]');
  if (cur && navKey !== "login") cur.setAttribute("aria-current", "page");

  // ---------- charts ----------
  function lineChart(target, pts, opts) {
    var W = 720, H = 300, L = 70, R = 70, T = 20, B = 36;
    var vals = [];
    pts.forEach(function (p) { vals.push(p.fund); if (p.bench != null) vals.push(p.bench); });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad;
    var n = pts.length - 1 || 1;
    var x = function (i) { return L + (i / n) * (W - L - R); };
    var y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); };
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.label });
    var ticks = 4;
    for (var t = 0; t <= ticks; t++) {
      var v = lo + (hi - lo) * t / ticks;
      s.appendChild(svg("line", { "class": "grid-line", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      s.appendChild(svg("text", { "class": "axis-text", x: L - 8, y: y(v) + 4, "text-anchor": "end" }, opts.fmt(v)));
    }
    pts.forEach(function (p, i) {
      if (opts.everyLabel || i === 0 || i === pts.length - 1) {
        s.appendChild(svg("text", { "class": "axis-text", x: x(i), y: H - 12, "text-anchor": "middle" }, p.m));
      }
    });
    function path(key) { return pts.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p[key]).toFixed(1); }).join(" "); }
    if (pts[0].bench != null) s.appendChild(svg("path", { "class": "bench-line", d: path("bench") }));
    s.appendChild(svg("path", { "class": "fund-line", d: path("fund") }));
    pts.forEach(function (p, i) {
      var c = svg("circle", { "class": "fund-dot", cx: x(i), cy: y(p.fund), r: 3.5 });
      c.appendChild(svg("title", {}, p.m + ": fund " + opts.fmt(p.fund) + (p.bench != null ? ", benchmark " + opts.fmt(p.bench) : "")));
      s.appendChild(c);
    });
    var lp = pts[pts.length - 1];
    s.appendChild(svg("text", { "class": "lbl", x: x(n) + 8, y: y(lp.fund) + 4 }, opts.fmt(lp.fund)));
    if (lp.bench != null) s.appendChild(svg("text", { "class": "axis-text", x: x(n) + 8, y: y(lp.bench) + (lp.bench > lp.fund ? -6 : 14) }, opts.fmt(lp.bench)));
    target.appendChild(s);
  }

  function monthlyBars(target) {
    var W = 720, H = 280, L = 52, R = 16, T = 20, B = 36;
    var vals = [];
    D.months.forEach(function (r) { vals.push(r.fund, r.bench); });
    var hi = Math.max(1, Math.max.apply(null, vals)) * 1.2, lo = Math.min(0, Math.min.apply(null, vals)) * 1.2;
    var y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var band = (W - L - R) / D.months.length, bw = band * 0.28;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Monthly returns, Fund vs benchmark" });
    [lo, 0, hi].forEach(function (v) {
      s.appendChild(svg("line", { "class": "grid-line", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      s.appendChild(svg("text", { "class": "axis-text", x: L - 8, y: y(v) + 4, "text-anchor": "end" }, v.toFixed(1) + "%"));
    });
    D.months.forEach(function (r, i) {
      var cx = L + band * i + band / 2;
      [["fund", "bar-fund", -bw - 2], ["bench", "bar-bench", 2]].forEach(function (d) {
        var v = r[d[0]];
        var rect = svg("rect", { "class": d[1], x: cx + d[2], width: bw, y: Math.min(y(v), y(0)), height: Math.abs(y(v) - y(0)), rx: 2 });
        rect.appendChild(svg("title", {}, r.m + " " + (d[0] === "fund" ? "Fund" : "Benchmark") + ": " + pct(v)));
        s.appendChild(rect);
      });
      s.appendChild(svg("text", { "class": "lbl", x: cx - bw / 2 - 2, y: v0(r.fund), "text-anchor": "middle" }, pct(r.fund)));
      s.appendChild(svg("text", { "class": "axis-text", x: cx, y: H - 12, "text-anchor": "middle" }, r.m));
    });
    function v0(v) { return v >= 0 ? y(v) - 6 : y(v) + 14; }
    target.appendChild(s);
  }

  function allocation(target, rows) {
    rows.forEach(function (a) {
      var row = el("div", { "class": "alloc-row" });
      var name = el("div", { "class": "name" }, a.name);
      name.appendChild(el("small", null, a.part + " · " + a.held));
      var track = el("div", { "class": "track", role: "img", "aria-label": a.name + ": " + a.actual + "% actual, target " + a.target + "%, allowed " + a.min + "-" + a.max + "%" });
      var scale = 60; // track spans 0-60%
      var range = el("span", { "class": "range" }); range.style.left = (a.min / scale * 100) + "%"; range.style.width = ((a.max - a.min) / scale * 100) + "%";
      var act = el("span", { "class": "actual" }); act.style.width = (a.actual / scale * 100) + "%";
      var tgt = el("span", { "class": "target" }); tgt.style.left = (a.target / scale * 100) + "%";
      track.appendChild(range); track.appendChild(act); track.appendChild(tgt);
      row.appendChild(name); row.appendChild(track);
      row.appendChild(el("div", { "class": "pct num" }, a.actual + "%"));
      target.appendChild(row);
    });
  }

  function fillTable(tbody, rows) {
    rows.forEach(function (cells) {
      var tr = el("tr");
      cells.forEach(function (c) {
        var td = el("td", c.cls ? { "class": c.cls } : null);
        if (c.node) td.appendChild(c.node); else td.textContent = c.text;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // ---------- pages ----------
  if ($("growth-chart")) {
    lineChart($("growth-chart"), series, { label: "Growth of BDS $100: Fund vs benchmark", fmt: function (v) { return v.toFixed(1); }, everyLabel: page === "performance" });
  }

  if (page === "performance") {
    monthlyBars($("monthly-chart"));
    var lastM = D.months[D.months.length - 1];
    var q = D.months.slice(-3).reduce(function (a, r) { a.f *= 1 + r.fund / 100; a.b *= 1 + r.bench / 100; return a; }, { f: 1, b: 1 });
    var rows = [
      ["Last month (" + lastM.m + ")", lastM.fund, lastM.bench],
      ["Last 3 months", (q.f - 1) * 100, (q.b - 1) * 100],
      ["Since launch", sinceFund, sinceBench]
    ];
    fillTable(document.querySelector("#returns-table tbody"), rows.map(function (r) {
      var d = r[1] - r[2];
      return [{ text: r[0] }, { text: pct(r[1], 2), cls: "r num" }, { text: pct(r[2], 2), cls: "r num" }, { text: pct(d, 2), cls: "r num " + (d >= 0 ? "pos" : "neg") }];
    }));
    allocation($("alloc"), D.allocation);
    var feeRows = D.fees.map(function (f) { return [{ text: f.item }, { text: f.pct.toFixed(2) + "%", cls: "r num" }, { text: "BDS $" + (D.grant * f.pct / 100).toFixed(2), cls: "r num" }]; });
    feeRows.push([{ text: "Total" }, { text: D.costPct.toFixed(2) + "%", cls: "r num" }, { text: "BDS $" + (D.grant * D.costPct / 100).toFixed(2), cls: "r num" }]);
    fillTable(document.querySelector("#fees-table tbody"), feeRows);
  }

  if (page === "transparency") {
    fillTable(document.querySelector("#limits-table tbody"), D.limits.map(function (l) {
      return [{ text: l.rule }, { text: l.limit, cls: "r num" }, { text: l.actual, cls: "r num" }, { node: el("span", { "class": "tag ok" }, "Within limit") }];
    }));
    fillTable(document.querySelector("#holdings-table tbody"), D.holdings.map(function (h) {
      return [{ text: h.name }, { node: el("span", { "class": "tag" + (h.part === "Core" ? " core" : "") }, h.part) }, { text: h.region }, { text: h.pct.toFixed(1) + "%", cls: "r num" }];
    }));
  }

  if (page === "contribute") {
    var form = $("give-form");
    var update = function () {
      var route = form.querySelector("input[name=route]:checked").value;
      $("child-ref-wrap").hidden = route !== "child";
      var amt = parseFloat($("amount").value) || 0;
      var yrs = parseInt($("years").value, 10);
      var fv = amt * Math.pow(1.05, yrs);
      $("give-result").textContent = amt > 0
        ? money(amt) + " could grow to about " + money(fv) + " in " + yrs + " years at 5% a year (illustrative, not guaranteed)."
        : "Enter an amount.";
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      $("give-msg").textContent = "Demo only: no payment is taken. In the live service you would continue to a regulated payment page.";
    });
    update();
  }

  // ---------- child accounts (demo) ----------
  var PROFILES = {
    guardian:  { name: "Kai",     age: 4,  band: "guardian" },
    seedling:  { name: "Amara",   age: 8,  band: "seedling" },
    grower:    { name: "Jaden",   age: 13, band: "grower" },
    navigator: { name: "Shanice", age: 17, band: "navigator" }
  };
  var RETURNS = [0.07, 0.11, -0.04, 0.09, 0.06, 0.13, 0.02, -0.08, 0.10, 0.07, 0.05, 0.08, 0.04, 0.06, 0.03, 0.05, 0.04, 0.03];

  function childAlloc(age) {
    var core = age <= 12 ? 75 : Math.min(90, 75 + (age - 12) * 3);
    var equity = Math.max(20, 45 - Math.max(0, age - 12) * 4);
    var cash = age >= 15 ? 12 : 5;
    var bonds = core - equity - cash;
    var sat = 100 - core;
    return [
      { name: "Shares (global companies)", actual: equity, part: "Core" },
      { name: "Bonds (loans to governments and companies)", actual: bonds, part: "Core" },
      { name: "Cash", actual: cash, part: "Core" },
      { name: "Buildings, roads, energy and private companies", actual: sat, part: "Satellite" }
    ];
  }

  var CONTENT = {
    guardian: {
      label: "Parent view", greet: function (p) { return p.name + "'s Child Wealth Fund account"; },
      intro: "Only you can see this account until " + "your child turns 6, when you can create their own read-only login.",
      chartTitle: "Account value", allocTitle: "What it is invested in", learnTitle: "For parents",
      lessons: [
        { t: "Keep your details up to date", b: "In the UK, over a million child accounts went unclaimed because families moved. Update your contact details whenever they change." },
        { t: "Family and friends can give", b: "Share your child's gift reference. Gifts are invested and locked, and you never have to share the balance." },
        { t: "Talk about money early", b: "Children form money habits young. Simple talks about saving and waiting make a difference." },
        { t: "Summer camps from age 6", b: "Free camps on civics, discipline and money open to every enrolled child from age 6. Sign-up opens each May." }
      ]
    },
    seedling: {
      label: "Seedlings · ages 6-10", greet: function (p) { return "Hi " + p.name + "! This is your money tree."; },
      intro: "It has been growing since the day you were born.",
      chartTitle: "Watch your money tree grow", allocTitle: "Where your money lives", learnTitle: "Fun money lessons",
      lessons: [
        { t: "What is saving?", b: "Saving means keeping money now so you can use it later, like planting a seed and waiting for a tree.", q: { ask: "If you plant a seed, what do you need?", opts: ["Patience", "A rocket"], right: 0 } },
        { t: "Needs and wants", b: "A need is something you must have, like food. A want is something nice, like a new toy.", q: { ask: "Is water a need or a want?", opts: ["Need", "Want"], right: 0 } },
        { t: "Your money is resting", b: "Your money is locked until you are grown up, so it can keep growing big and strong." }
      ]
    },
    grower: {
      label: "Growers · ages 11-15", greet: function (p) { return "Welcome back, " + p.name; },
      intro: "Here is how your Fund is doing and what is driving it.",
      chartTitle: "Your balance, year by year", allocTitle: "Your investment mix", learnTitle: "Level up your money skills",
      lessons: [
        { t: "Compound growth", b: "When your money earns returns, those returns earn returns too. BDS $5,000 growing at 5% a year becomes about BDS $12,000 in 18 years.", q: { ask: "Which grows more over 18 years?", opts: ["5% a year", "2% a year"], right: 0 } },
        { t: "What is an index fund?", b: "An index fund buys a small piece of thousands of companies at once. It is cheap and spreads the risk. Most of your Fund is invested this way." },
        { t: "Why did my balance drop one year?", b: "Investments go up and down. What matters is the long-term trend.", q: { ask: "A one-year dip means...", opts: ["The money is gone forever", "Markets move up and down"], right: 1 } }
      ]
    },
    navigator: {
      label: "Navigators · ages 16-19", greet: function (p) { return p.name + ", your Child Wealth Fund"; },
      intro: "You are nearly in control. Here is the full picture and how to plan your claim.",
      chartTitle: "Performance since birth", allocTitle: "Asset mix (getting safer as your claim nears)", learnTitle: "Planning your claim",
      lessons: [
        { t: "Core and satellite", b: "Most of the Fund is in low-cost index funds (the core). A smaller part is in infrastructure, property and private companies in the Caribbean, Africa and worldwide (the satellites)." },
        { t: "Approved uses", b: "You can use the money for education, training, a first home or starting a business. Start planning now." },
        { t: "Fees matter", b: "A 1% yearly fee takes about 16% of your money over 18 years. The Fund's costs are published on the Performance page.", q: { ask: "Over 18 years, a 1% fee vs a 0.4% fee...", opts: ["Makes little difference", "Makes a big difference"], right: 1 } },
        { t: "Watch for scams", b: "No one from the Fund will ever ask for your password or ask you to move money. The money only goes to an account in your own name." }
      ]
    }
  };

  function childHistory(age) {
    var pts = [{ m: "Birth", fund: D.grant }], v = D.grant;
    for (var i = 0; i < age; i++) { v *= 1 + RETURNS[i]; pts.push({ m: "Age " + (i + 1), fund: v }); }
    return pts;
  }

  function tree(target, ratio) {
    var size = 40 + Math.min(ratio, 3) * 40;
    var s = svg("svg", { viewBox: "0 0 300 240", role: "img", "aria-label": "Your money tree" });
    s.appendChild(svg("rect", { "class": "tree-ground", x: 0, y: 210, width: 300, height: 30 }));
    s.appendChild(svg("rect", { "class": "tree-trunk", x: 142, y: 210 - size, width: 16, height: size, rx: 4 }));
    s.appendChild(svg("circle", { "class": "tree-leaf", cx: 150, cy: 210 - size, r: size * 0.7 }));
    s.appendChild(svg("circle", { "class": "tree-leaf light", cx: 150 - size * 0.4, cy: 210 - size * 0.8, r: size * 0.45 }));
    s.appendChild(svg("circle", { "class": "tree-leaf light", cx: 150 + size * 0.4, cy: 210 - size * 0.8, r: size * 0.45 }));
    s.appendChild(svg("circle", { "class": "tree-sun", cx: 260, cy: 36, r: 16 }));
    target.appendChild(s);
  }

  function quiz(card, q) {
    var box = el("div", { "class": "quiz" });
    box.appendChild(el("p", null, q.ask));
    q.opts.forEach(function (o, i) {
      var b = el("button", { type: "button" }, o);
      b.addEventListener("click", function () {
        b.className = i === q.right ? "right" : "wrong";
        b.textContent = o + (i === q.right ? " ✓" : " ✗");
      });
      box.appendChild(b);
    });
    card.appendChild(box);
  }

  if (page === "login") {
    $("demo-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("profile").value;
      if (!PROFILES[v]) return;
      try { sessionStorage.setItem(SESSION_KEY, v); } catch (err) { /* storage blocked */ }
      window.location.href = "dashboard.html#" + v;
    });
  }

  if (page === "dashboard") {
    var key = (location.hash || "").slice(1);
    if (!PROFILES[key]) { try { key = sessionStorage.getItem(SESSION_KEY); } catch (err) { key = null; } }
    var p = PROFILES[key];
    if (!p) { window.location.replace("login.html"); return; }
    var c = CONTENT[p.band];
    document.body.classList.add("band-" + p.band);
    $("band-label").textContent = c.label;
    $("greeting").textContent = c.greet(p);
    $("intro").textContent = c.intro;
    $("chart-title").textContent = c.chartTitle;
    $("alloc-title").textContent = c.allocTitle;
    $("learn-title").textContent = c.learnTitle;

    var hist = childHistory(p.age);
    var now = hist[hist.length - 1].fund, growth = now - D.grant;
    var stats = [
      { l: "Balance today", v: money(now) },
      { l: "Gift from Barbados", v: money(D.grant) },
      { l: "Growth so far", v: (growth >= 0 ? "+" : "") + money(growth), up: growth >= 0 },
      { l: "Claimable from 18, in", v: (18 - p.age) + (18 - p.age === 1 ? " year" : " years") }
    ];
    stats.forEach(function (s) {
      var card = el("div", { "class": "panel stat" });
      card.appendChild(el("div", { "class": "label" }, s.l));
      card.appendChild(el("div", { "class": "value" + (s.up ? " up" : "") }, s.v));
      $("stats").appendChild(card);
    });

    if (p.band === "seedling") {
      tree($("child-chart"), now / D.grant);
      $("chart-note").textContent = "Your tree is " + (now / D.grant).toFixed(1) + " times bigger than when you were born.";
    } else {
      lineChart($("child-chart"), hist, { label: "Account balance over time", fmt: function (v) { return "$" + Math.round(v).toLocaleString("en-US"); } });
      $("chart-note").textContent = "Simulated figures. Past performance does not guarantee future results.";
    }

    var al = childAlloc(p.age).map(function (a) { return { name: a.name, part: a.part, held: "", actual: a.actual, target: a.actual, min: a.actual, max: a.actual }; });
    var box = $("child-alloc");
    al.forEach(function (a) {
      var row = el("div", { "class": "alloc-row" });
      row.appendChild(el("div", { "class": "name" }, a.name));
      var track = el("div", { "class": "track" });
      var act = el("span", { "class": "actual" }); act.style.width = a.actual + "%";
      track.appendChild(act);
      row.appendChild(track);
      row.appendChild(el("div", { "class": "pct num" }, a.actual + "%"));
      box.appendChild(row);
    });

    c.lessons.forEach(function (l) {
      var card = el("div", { "class": "panel lesson" });
      card.appendChild(el("h3", null, l.t));
      card.appendChild(el("p", null, l.b));
      if (l.q) quiz(card, l.q);
      $("lessons").appendChild(card);
    });
  }
})();
