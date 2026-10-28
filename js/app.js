// Barbados Future Fund prototype. Demo data only; no real accounts.
// The live service must fetch data from the bank's API after server-side authentication.
(function () {
  "use strict";

  var SEED = 3000; // BDS $ deposited at birth
  var SESSION_KEY = "bff-demo-profile";

  var PROFILES = {
    guardian:  { name: "Kai",     age: 3,  band: "guardian" },
    seedling:  { name: "Amara",   age: 8,  band: "seedling" },
    grower:    { name: "Jaden",   age: 13, band: "grower" },
    navigator: { name: "Shanice", age: 17, band: "navigator" }
  };

  // Illustrative yearly net returns (after fees). Deterministic so the demo is stable.
  var RETURNS = [0.07, 0.11, -0.04, 0.09, 0.06, 0.13, 0.02, -0.08, 0.10, 0.07,
                 0.05, 0.08, 0.04, 0.06, 0.03, 0.05, 0.04, 0.03, 0.03];

  // Lifecycle "glide path": growth assets early, safer assets as 18 approaches.
  function allocation(age) {
    var equity = age <= 10 ? 70 : Math.max(20, 70 - (age - 10) * 7);
    var property = age <= 12 ? 10 : 5;
    var cash = age >= 15 ? 15 : 5;
    var bonds = 100 - equity - property - cash;
    return [
      { label: "Shares (global companies)", pct: equity,   color: "#00267f" },
      { label: "Bonds (loans to governments & firms)", pct: bonds, color: "#ffc726" },
      { label: "Property",                  pct: property, color: "#2a9d8f" },
      { label: "Cash",                      pct: cash,     color: "#9aa5b8" }
    ];
  }

  function history(age) {
    var pts = [SEED], v = SEED;
    for (var i = 0; i < age; i++) { v = v * (1 + RETURNS[i]); pts.push(v); }
    return pts;
  }

  function projectTo18(current, age) {
    var v = current;
    for (var i = age; i < 18; i++) { v = v * 1.04; } // conservative 4% illustration
    return v;
  }

  function money(n) {
    return "BDS $" + Math.round(n).toLocaleString("en-US");
  }

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  // ---- Age-band content ----
  var CONTENT = {
    guardian: {
      label: "Parent / guardian view",
      greet: function (p) { return p.name + "'s Future Fund"; },
      intro: "You're viewing your child's account. Only you can see this until they turn 6.",
      chartTitle: "Account value",
      allocTitle: "Current investment mix",
      learnTitle: "For parents",
      lessons: [
        { t: "Talk about money early", b: "Children form money habits by age 7. Simple chats about saving and waiting help." },
        { t: "Keep your details up to date", b: "In the UK, over a million child accounts went unclaimed because families moved. Update your contact details whenever they change." },
        { t: "Create a child login at 6", b: "From age 6 you can set up a read-only login so your child can see their money grow." }
      ]
    },
    seedling: {
      label: "Seedlings · ages 6–10",
      greet: function (p) { return "Hi " + p.name + "! 🌱"; },
      intro: "This is your money tree. It's been growing since the day you were born!",
      chartTitle: "Watch your money tree grow",
      allocTitle: "Where your money lives",
      learnTitle: "Fun money lessons",
      lessons: [
        { t: "What is saving?", b: "Saving means keeping money now so you can use it later. Like planting a seed and waiting for a tree!",
          q: { ask: "If you plant a seed, what do you need?", opts: ["Patience", "A rocket"], right: 0 } },
        { t: "Needs and wants", b: "A need is something you must have, like food. A want is something nice, like a new toy.",
          q: { ask: "Is water a need or a want?", opts: ["Need", "Want"], right: 0 } },
        { t: "Your money can't be spent yet", b: "Your Future Fund is locked until you are 18, so it can keep growing big and strong." }
      ]
    },
    grower: {
      label: "Growers · ages 11–15",
      greet: function (p) { return "Welcome back, " + p.name; },
      intro: "Here's how your Future Fund is doing and what's driving it.",
      chartTitle: "Your balance, year by year",
      allocTitle: "Your investment mix",
      learnTitle: "Level up your money skills",
      lessons: [
        { t: "Compound growth", b: "When your money earns returns, those returns earn returns too. BDS $3,000 growing at 5% a year becomes about BDS $7,200 in 18 years.",
          q: { ask: "Which grows more over 18 years?", opts: ["5% a year", "2% a year"], right: 0 } },
        { t: "What is a share?", b: "A share is a tiny piece of a company. If the company does well, your piece can become worth more." },
        { t: "Why did my balance drop one year?", b: "Investments go up and down. That's normal. What matters is the long-term trend.",
          q: { ask: "A one-year dip means…", opts: ["The money is lost forever", "Markets move up and down"], right: 1 } }
      ]
    },
    navigator: {
      label: "Navigators · ages 16–19",
      greet: function (p) { return p.name + ", your Future Fund"; },
      intro: "You're nearly in control. Here's the full picture and how to plan for 18.",
      chartTitle: "Performance since birth",
      allocTitle: "Asset allocation (de-risking towards 18)",
      learnTitle: "Planning for 18",
      lessons: [
        { t: "Why your fund is getting safer", b: "As 18 approaches, your fund moves from shares into bonds and cash. That way a market crash just before you need the money does less damage." },
        { t: "Approved uses", b: "From 18 you can use the money for education, training, a first home deposit or starting a business. Start planning now." },
        { t: "Fees matter", b: "A 1% yearly fee can eat roughly 15% of your money over 18 years. Low-cost funds keep more in your pocket.",
          q: { ask: "Over 18 years, a 1% fee vs 0.2% fee…", opts: ["Makes little difference", "Makes a big difference"], right: 1 } },
        { t: "Watch for scams", b: "No one from the Fund will ever ask for your password or ask you to move money. Report anything suspicious." }
      ]
    }
  };

  // ---- Charts (built with DOM APIs; no innerHTML, CSP-friendly) ----
  var SVGNS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function lineChart(target, pts) {
    var W = 560, H = 240, P = 36;
    var max = Math.max.apply(null, pts) * 1.1;
    var n = Math.max(pts.length - 1, 1);
    var x = function (i) { return P + (i / n) * (W - P * 2); };
    var y = function (v) { return H - P - (v / max) * (H - P * 2); };
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Balance growth chart" });
    s.appendChild(svg("line", { x1: P, y1: H - P, x2: W - P, y2: H - P, stroke: "#c8cfdc" }));
    var d = pts.map(function (v, i) { return (i ? "L" : "M") + x(i) + " " + y(v); }).join(" ");
    s.appendChild(svg("path", { d: d + " L" + x(pts.length - 1) + " " + (H - P) + " L" + x(0) + " " + (H - P) + " Z", fill: "#00267f", "fill-opacity": "0.08" }));
    s.appendChild(svg("path", { d: d, fill: "none", stroke: "#00267f", "stroke-width": "3", "stroke-linejoin": "round" }));
    pts.forEach(function (v, i) {
      s.appendChild(svg("circle", { cx: x(i), cy: y(v), r: 3.5, fill: "#ffc726", stroke: "#00267f" }));
    });
    [0, pts.length - 1].forEach(function (i) {
      var t = svg("text", { x: x(i), y: H - 12, "text-anchor": "middle", "font-size": "12", fill: "#5b6475" });
      t.textContent = "Age " + i;
      s.appendChild(t);
    });
    target.appendChild(s);
  }

  function donut(target, parts) {
    var R = 70, C = 2 * Math.PI * R, off = 0;
    var s = svg("svg", { viewBox: "0 0 200 200", role: "img", "aria-label": "Asset allocation chart" });
    parts.forEach(function (p) {
      var len = (p.pct / 100) * C;
      s.appendChild(svg("circle", {
        cx: 100, cy: 100, r: R, fill: "none", stroke: p.color, "stroke-width": 34,
        "stroke-dasharray": len + " " + (C - len), "stroke-dashoffset": -off,
        transform: "rotate(-90 100 100)"
      }));
      off += len;
    });
    target.appendChild(s);
    var ul = el("ul", { "class": "legend" });
    parts.forEach(function (p) {
      var li = el("li");
      var sw = el("span", { "class": "swatch" });
      sw.style.background = p.color; // CSSOM property, allowed under CSP
      li.appendChild(sw);
      li.appendChild(document.createTextNode(p.label + ": " + p.pct + "%"));
      ul.appendChild(li);
    });
    target.appendChild(ul);
  }

  function seedlingTree(target, ratio) {
    // Tree grows with the balance: simple, friendly visual for young children.
    var size = 40 + Math.min(ratio, 3) * 40;
    var s = svg("svg", { viewBox: "0 0 300 240", role: "img", "aria-label": "Your money tree" });
    s.appendChild(svg("rect", { x: 0, y: 210, width: 300, height: 30, fill: "#cfe8c2" }));
    s.appendChild(svg("rect", { x: 142, y: 210 - size, width: 16, height: size, fill: "#8b5a2b", rx: 4 }));
    s.appendChild(svg("circle", { cx: 150, cy: 210 - size, r: size * 0.7, fill: "#2e9e4f" }));
    s.appendChild(svg("circle", { cx: 150 - size * 0.4, cy: 210 - size * 0.8, r: size * 0.45, fill: "#3bb862" }));
    s.appendChild(svg("circle", { cx: 150 + size * 0.4, cy: 210 - size * 0.8, r: size * 0.45, fill: "#3bb862" }));
    s.appendChild(svg("circle", { cx: 150, cy: 210 - size * 1.2, r: 8, fill: "#ffc726" }));
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

  // ---- Pages ----
  var form = document.getElementById("demo-login");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = document.getElementById("profile").value;
      if (!PROFILES[v]) return;
      try { sessionStorage.setItem(SESSION_KEY, v); } catch (err) { /* storage blocked */ }
      window.location.href = "dashboard.html#" + v;
    });
  }

  var dash = document.getElementById("dashboard");
  if (dash) {
    var key = null;
    try { key = sessionStorage.getItem(SESSION_KEY); } catch (err) { /* storage blocked */ }
    if (!key) key = (location.hash || "").slice(1);
    var p = PROFILES[key];
    if (!p) { window.location.replace("login.html"); return; }

    var c = CONTENT[p.band];
    document.body.className = "band-" + p.band;
    document.getElementById("band-label").textContent = c.label;
    document.getElementById("greeting").textContent = c.greet(p);
    document.getElementById("intro").textContent = c.intro;
    document.getElementById("chart-title").textContent = c.chartTitle;
    document.getElementById("alloc-title").textContent = c.allocTitle;
    document.getElementById("learn-title").textContent = c.learnTitle;

    var pts = history(p.age);
    var now = pts[pts.length - 1];
    var growth = now - SEED;

    var stats = [
      { l: "Balance today", v: money(now) },
      { l: "Starting gift from Barbados", v: money(SEED) },
      { l: "Growth so far", v: (growth >= 0 ? "+" : "") + money(growth), up: growth >= 0 },
      { l: p.age < 18 ? "Unlocks in" : "Status", v: p.age < 18 ? (18 - p.age) + (18 - p.age === 1 ? " year" : " years") : "Unlocked" }
    ];
    if (p.band === "grower" || p.band === "navigator" || p.band === "guardian") {
      stats.push({ l: "Illustrative value at 18 (4%/yr)", v: money(projectTo18(now, p.age)) });
    }
    var statsBox = document.getElementById("stats");
    stats.forEach(function (s) {
      var card = el("div", { "class": "card stat" });
      card.appendChild(el("div", { "class": "label" }, s.l));
      card.appendChild(el("div", { "class": "value" + (s.up ? " up" : "") }, s.v));
      statsBox.appendChild(card);
    });

    var chart = document.getElementById("chart");
    if (p.band === "seedling") {
      seedlingTree(chart, now / SEED);
      document.getElementById("chart-note").textContent =
        "Your tree is " + (now / SEED).toFixed(1) + "× bigger than when you were born!";
    } else {
      lineChart(chart, pts);
      document.getElementById("chart-note").textContent =
        "Past performance does not guarantee future results. Figures are simulated.";
    }

    donut(document.getElementById("alloc"), allocation(p.age));

    var lessons = document.getElementById("lessons");
    c.lessons.forEach(function (l) {
      var card = el("div", { "class": "card lesson" });
      card.appendChild(el("h3", null, l.t));
      card.appendChild(el("p", null, l.b));
      if (l.q) quiz(card, l.q);
      lessons.appendChild(card);
    });

    document.getElementById("logout").addEventListener("click", function () {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (err) { /* ignore */ }
    });
  }
})();
