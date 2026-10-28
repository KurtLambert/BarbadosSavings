# Security design: Barbados Future Fund

The current site is a **static prototype**. It has no real authentication and no real data. Everything below is required before any real child's data or balance goes online.

## Principles

1. **The bank holds the money, the site only displays it.** The portal has no payment, transfer or withdrawal capability. Withdrawals at 18 go through the bank's own KYC-verified process, in person or in the bank's own app.
2. **Read-only by default.** The portal reads balances from the bank through a scoped, read-only API (OAuth 2.0 client credentials + mTLS between portal backend and bank). Browsers never talk to the bank directly.
3. **Minimise children's data.** Store no national ID numbers, addresses or birth certificates in the portal. Keep only a pseudonymous account reference, first name, date of birth (for the age band) and guardian link.
4. **Comply with law.** Barbados Data Protection Act 2019 (DPIA required: children are a high-risk group), Central Bank of Barbados / FSC guidance, and UN guidance on children's digital rights.

## Identity and access

| Role | How they sign in | What they can do |
|---|---|---|
| Guardian | National digital ID (Trident ID or equivalent) + phone/app MFA (passkeys preferred) | View child's account, create/revoke child login, update contact details |
| Child 6–17 | Username + passkey or PIN created by guardian; no email/phone required | Read-only view of own account and lessons |
| Young adult 18+ | Re-verified with own national ID at 18; old child login retired | View, then claim through bank |
| Staff / admin | SSO + hardware key, least privilege, all actions logged | Support only; no balance edits |

- Server-side sessions, `HttpOnly; Secure; SameSite=Strict` cookies, short idle timeout (15 min for guardians).
- Rate limiting and lockout on login; no username enumeration.
- Age band is derived server-side from date of birth, never from the client.
- Guardian changes (e.g. new guardian after custody change) require verified documents and a cooling-off period, with notification to the existing guardian.

## The biggest real-world risk: fraud at claim time

In other countries the main losses come from **impersonation and scams around maturity**, not from hacking the site:
- Fraudsters pose as the young person or a "claims agent".
- Family members try to claim on the child's behalf.

Mitigations: the claim happens only at the bank with in-person or strong-ID verification; payouts go only to an account in the young person's own name; approved-purpose evidence is checked; and the portal shows a clear "we will never ask you to…" anti-scam message.

## Application security baseline

- OWASP ASVS Level 2 (Level 3 for auth and claim flows); annual independent penetration test; bug bounty or vulnerability-disclosure policy.
- Strict Content-Security-Policy and security headers (already in the prototype via `vercel.json`: no inline scripts or styles, `frame-ancestors 'none'`), HSTS preload, no third-party trackers or ad scripts on child pages.
- Encryption in transit (TLS 1.2+) and at rest; keys in a managed KMS/HSM.
- Data hosted in a jurisdiction approved by the Data Protection Commissioner; documented backups and restore tests.
- Audit log of every view of a child's account by staff.
- Dependency scanning and signed builds in CI.

## Out of scope for the portal (deliberately)

- Moving money
- Changing bank details
- Uploading identity documents

These remain bank-side, which keeps the portal's attack surface small.
