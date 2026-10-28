# Barbados Future Fund (working name)

Prototype website for a government-funded child savings account: BDS $3,000 at birth, invested until 18, with age-specific logins so children can watch it grow and learn about money.

**Status:** static demo. No real auth, no real data, no bank connection.

## Run

Open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

## Structure

- `index.html`: public information page
- `login.html`: demo login (choose a profile)
- `dashboard.html` + `js/app.js`: age-banded account view (Guardian 0–5, Seedlings 6–10, Growers 11–15, Navigators 16–19)
- `docs/SECURITY.md`: security architecture required for the live service
- `docs/BEST_PRACTICE.md`: comparison with other countries' programmes

## Next steps

1. Confirm the official programme rules (eligibility date, approved uses, top-ups).
2. Choose the bank partner and agree a read-only API.
3. Build the backend (auth, guardian/child linking) per `docs/SECURITY.md`.
4. Run a DPIA under the Barbados Data Protection Act 2019.
