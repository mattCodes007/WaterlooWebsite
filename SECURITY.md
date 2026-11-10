# Security and recovery

This is a public, account-free static restaurant website. No customer authentication,
payments, database, analytics, or form-submission service runs here. Do not add a login
or CAPTCHA to menu browsing. External job and gift-card pages manage their own data.

## Deployed protections

- `_headers` enforces a same-origin Content Security Policy, blocks framing and form
  submission, disables unused browser permissions, prevents MIME sniffing, and suppresses
  referrers. HTTPS is already enforced by Pages; HSTS is enabled without preload or a
  subdomain-wide directive. Recheck HTTPS before moving to any custom domain.
- Fonts and images are local, including the required open font licenses. No Google
  Fonts request or embedded map is needed. Privacy information is at `/#privacy`.
- `scripts/build.mjs` publishes an explicit public-file list and validates photo paths
  and resolved asset paths. Development files, backups, and credentials are excluded.
- `npm run build` runs security checks on its output. A build failure must be resolved
  before uploading. The CLI deploy command also runs syntax and menu/calendar tests.
- `npm run security:live` checks HTTPS, live security headers, and every published file
  against the most recent local build. This is an on-demand check, not continuous monitoring.

## Account protection

On November 10, 2026, the Cloudflare authentication screen showed email two-factor
authentication already active. Security-key and authenticator-app enrollment were not
configured by the agent. Enrollment and recovery codes must be completed by the owner,
who should keep credentials and recovery codes out of this repository and chat.

Use unique passwords and MFA for Cloudflare, its controlling email account, and any
future Git provider. Give collaborators individual accounts and only the access needed.
Do not share admin credentials. No collaborators or API tokens were added by this change.

## Back up and recover

1. Run `npm run backup` before publishing a reviewed update. This validates the build
   and saves its public output plus explicit editable sources under `backups/<timestamp>/`.
   Backups are ignored by Git and excluded from deployment. Keep a copy on a trusted
   separate device or private backup service; local snapshots do not protect against disk loss.
2. For immediate production recovery, open Cloudflare → Workers & Pages →
   waterloo-louisville → Deployments. Use the previous successful production deployment's
   More actions → Rollback. Keep the prior deployment; do not delete it after an update.
3. To restore editable files, compare the saved `source/` snapshot and copy the intended
   files back into the project, then run `npm run check`, `npm test`, and `npm run build`.
   Upload only the restored `dist/` and verify with `npm run security:live`.

The production checkpoint before security changes was `1e15d78e-55e2-49ee-886d-b7a615b9d2ee`.
Cloudflare deployment history is useful for restoring the public site; it does not replace
an editable-source backup.

## Future changes

If adding a backend or forms, revisit CSP `connect-src` and `form-action` deliberately.
Validate submissions server-side, rate-limit abusive traffic, and use Turnstile only
where submissions need protection, with server-side token verification. Keep secrets
server-side. Use hosted checkout for payments rather than collecting card details here.

Continuous uptime alerts and new external services are not enabled. The project remains
on its existing Pages plan; no paid add-ons or subscriptions were activated.
