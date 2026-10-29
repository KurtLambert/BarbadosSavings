// Illustrative fund data for the prototype. Every figure here is simulated.
// In production this file is replaced by data published by the fund administrator and custodian.
window.CWF = {
  asOf: "30 September 2026",
  inception: "1 April 2026",
  grant: 5000,
  startValue: 52.0e6,      // initial grants for ~10,400 children born since 30 Nov 2021
  startChildren: 10400,
  birthsPerMonth: 190,
  costPct: 0.38,           // estimated total annual cost, % of assets
  opsBudget: 1.0e6,        // core team and office, BDS a year, paid from a separate government budget line
  // Monthly returns, %: Fund vs total-fund benchmark (70% MSCI ACWI IMI / 30% Bloomberg Global Aggregate)
  months: [
    { m: "Apr", fund: 1.2,  bench: 1.4 },
    { m: "May", fund: 0.8,  bench: 0.9 },
    { m: "Jun", fund: -0.6, bench: -0.9 },
    { m: "Jul", fund: 1.4,  bench: 1.6 },
    { m: "Aug", fund: 0.3,  bench: 0.2 },
    { m: "Sep", fund: 0.9,  bench: 1.0 }
  ],
  allocation: [
    { name: "Global equities",  part: "Core",      actual: 51, target: 45, min: 35, max: 55, held: "Equity index funds" },
    { name: "Fixed income",     part: "Core",      actual: 30, target: 25, min: 20, max: 40, held: "Bond index funds; Government of Barbados bonds" },
    { name: "Cash",             part: "Core",      actual: 6,  target: 5,  min: 2,  max: 15, held: "Deposits and treasury bills" },
    { name: "Real assets",      part: "Satellite", actual: 9,  target: 15, min: 5,  max: 20, held: "Infrastructure and property funds" },
    { name: "Private equity",   part: "Satellite", actual: 4,  target: 10, min: 0,  max: 12, held: "DFI-backed private equity funds" }
  ],
  holdings: [
    { name: "Global equity index fund (MSCI ACWI IMI tracker)", part: "Core", region: "Global", pct: 51.0 },
    { name: "Global bond index fund (USD-hedged)",              part: "Core", region: "Global", pct: 22.0 },
    { name: "Government of Barbados bonds",                     part: "Core", region: "Barbados", pct: 8.0 },
    { name: "Cash and treasury bills",                          part: "Core", region: "Barbados / US", pct: 6.0 },
    { name: "Global infrastructure fund",                       part: "Satellite", region: "Global", pct: 6.0 },
    { name: "Caribbean renewable energy fund (DFI co-investor)", part: "Satellite", region: "Caribbean", pct: 3.0 },
    { name: "Global private equity fund-of-funds",              part: "Satellite", region: "Global", pct: 2.5 },
    { name: "Caribbean SME growth fund (DFI co-investor)",      part: "Satellite", region: "Caribbean", pct: 1.0 },
    { name: "Pan-African private equity fund (DFI co-investor)", part: "Satellite", region: "Africa", pct: 0.5 }
  ],
  fees: [
    { item: "Core index funds", pct: 0.12 },
    { item: "Real asset funds", pct: 0.11 },
    { item: "Private equity funds", pct: 0.09 },
    { item: "Custody, administration, audit", pct: 0.06 }
  ],
  limits: [
    { rule: "Private equity, total",                limit: "max 12%",  actual: "4%" },
    { rule: "Barbados + Caribbean + Africa private equity", limit: "max 7%", actual: "1.5%" },
    { rule: "Private equity in Barbados",           limit: "max 2%",   actual: "0%" },
    { rule: "Total Barbados exposure",              limit: "max 20%",  actual: "14%" },
    { rule: "Government of Barbados bonds",         limit: "max 10%",  actual: "8%" },
    { rule: "Held in USD or BDS",                   limit: "min 80%",  actual: "99.5%" },
    { rule: "Total annual cost",                    limit: "max 0.75%", actual: "0.38%" }
  ]
};
