# Security and privacy

## Implemented boundary

- The public PWA supports local device mode. Server-backed data requires the single owner to authenticate. First-owner registration requires a strong one-time setup token and closes after account creation.
- Passwords use scrypt with unique salts and remain out of browser journal snapshots. Opaque server-side sessions use `HttpOnly`, `SameSite=Strict` cookies, Secure in production, and can be remembered for up to 30 days. Password change invalidates the other sessions.
- Account writes enforce same-origin checks, revision validation and a 4 MiB request-body ceiling. Stale snapshots are merged against the last acknowledged base; simultaneous edits are preserved as marked copies rather than silently discarded. The 15,000,000,000-byte logical account-data cap is separate from the Railway volume allocation.
- The optional Web Push sender stores subscriptions per owner/device, validates known push-service hosts, uses VAPID keys supplied only through server environment variables, and sends generic lock-screen text. Push permission and device subscriptions can be removed per device. The service worker never caches authenticated API responses.
- Static path handling, restrictive CSP, request validation and process-local authentication rate limits provide additional boundaries. SQLite requires one app instance on its persistent Railway volume.

## Important limits

Device-local data and exported JSON are not encrypted; anyone with access to an unlocked browser profile/export can read them. Server backups must be protected independently. Password reset, passkeys, MFA, multiple owner accounts and independent recovery contacts are not implemented. Rate limiting is process-local and not a replacement for edge protection. Closed-app push is best effort—not a safety alarm, medication reminder guarantee or emergency service. Push payloads are intentionally generic. No independent penetration test, third-party security audit or accessibility certification has been performed.

Movement-limitation notes are part of the account profile and can sync to the owner server; never enter private medical details there. Diet notes remain local unless the explicit sync option is enabled. BMI measurements are never persisted.

## Deployment and operations

Use HTTPS, the exact canonical `APP_ORIGIN`, a strong unique setup token, a persistent volume, the 15GB `FORGE_MAX_DATA_BYTES` cap and a stable VAPID key pair. Keep all real values in Railway—not Git, `.env.example`, the PWA or logs. Remove `SETUP_TOKEN` after first-owner enrollment. Restrict who can read Railway variables and backups. Rotate push keys only with a plan to re-subscribe devices.

The current physical Railway volume is 50,000 MB while Forge's account database stops at 15,000,000,000 bytes. Railway cannot reduce an existing volume in place. A new smaller physical volume needs a verified backup, stopped-write copy/cutover and health check; do not delete the old volume as a shortcut. One running service must use one mounted database volume; do not scale parallel instances.

Before clearing browser data, sign out, or replacing storage, make an export and verify the server reports a successful sync. Before any production security change, use a staging environment. Review dependency updates and monitor auth failures without logging credentials, passwords, workout payloads or notification labels.

Report vulnerabilities privately to the repository owner; never post user data or secrets in public issues.
