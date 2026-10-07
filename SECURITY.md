# Security and privacy

## Implemented boundary

Server-backed workout data requires authentication. Owner enrollment uses a setup secret and is closed after creation. Passwords use scrypt with unique salts. Opaque sessions are server-side and use HttpOnly, SameSite cookies (Secure in production). State is scoped to the authenticated owner. Mutation requests enforce same-origin checks. Request size, state validation and authentication rate limits constrain abuse. Static path handling and CSP restrict executable content. The service worker must never cache authenticated API responses.

## Important limits

Device-local data is accessible to scripts on this origin and anyone using the unlocked browser profile; it is not encrypted. Export files contain private workout data. Server backups require separate protection. Rate limiting is process-local and is not a replacement for an edge abuse service. No independent penetration test has been performed. No passkeys, MFA, password reset, public registration, or automatic conflict merging are claimed. Atomic revision checks reject stale saves; export pending edits before manually reloading server data. Single-instance SQLite needs a persistent Railway volume. Do not scale multiple instances against separate volumes.

## Before public launch

Use HTTPS, canonical APP_ORIGIN, production cookie configuration, strong unique secrets, persistent storage and tested backups. Test the actual iOS/Android install lifecycle and offline behavior. Review logs for accidental private information. Add tested recovery and conflict resolution before marketing this as a multi-user cloud service.

Report vulnerabilities privately to the repository owner; never post user data or secrets in public issues.
