# Child Wealth Fund (concept prototype)

Prototype website for the Barbados Republic Child Wealth Fund: BDS $5,000 for every child born since 30 November 2021, held in trust and invested until adulthood. The site stresses performance and transparency: returns vs benchmark after fees, actual vs target allocation, every holding, policy limits and governance.

**Status:** static demo. All figures are simulated (`js/data.js`). No real auth, data or payments.

## Pages

- `index.html`: overview with key figures, each tagged with its source
- `performance.html`: growth vs benchmark, monthly returns, core/satellite allocation, costs
- `transparency.html`: policy limits, holdings, governance, documents, FAQ
- `contribute.html`: gifts to a named child or the Solidarity Pool (demo, no payment)
- `login.html`, `dashboard.html`: age-banded child accounts (parent 0-5, 6-10, 11-15, 16-19)

## Edit and build

Pages are assembled from `partials/`. Edit a partial, then run:

```
python3 build.py
python3 -m http.server 8000
```

Fund figures live in `js/data.js`; in production that file is replaced by data from the fund administrator and custodian.

## Docs

- `docs/SECURITY.md`: security architecture for the live service
- `docs/BEST_PRACTICE.md`: comparison with other countries' programmes
