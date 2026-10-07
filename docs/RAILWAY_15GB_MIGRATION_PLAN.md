# Railway 15 GB volume migration plan

**Status: plan only.** No new volume, backup, mount, production deployment, or deletion has been performed for the physical-size migration. A separate confirmation is required before replacing the live volume or deleting the old copy.

## Current and target state

| Item | Current | Target |
|---|---|---|
| Railway project | `Gym` (`ee0c1e27-8316-435d-b8d7-df91324e8f04`) | Same project |
| Environment | `production` (`71e520e7-9578-4c85-947b-e93d80f164d8`) | Same environment |
| Service | `gym-pwa` (`3518dea0-2aa2-47c3-8129-007988161926`), one replica in `sfo` | Same service and region, one replica |
| Volume | `gym-data` (`1d838ca4-1abc-4542-a2fc-766d7fd98cc1`), 50,000 MB at `/data` | New 15,000 MB volume at `/data` |
| Application-data ceiling | Forge is configured for a decimal 15,000,000,000-byte logical ceiling | Keep the same ceiling and report the physical size accurately |

The account database is `/data/forge.sqlite`; SQLite may also have `forge.sqlite-wal` and `forge.sqlite-shm` files. It contains the owner account hash, sessions, workout/profile state, reminder schedules, push-subscription records, and reminder delivery records. Treat a volume backup or copy as sensitive data.

## Important limits

Railway documents live volume resizing as growth-only; an existing 50,000 MB volume cannot be reduced in place. The safe route is a new 15,000 MB volume, a verified copy/restore, a service cutover, and only later cleanup of the old volume. Railway manual volume backups are limited to 50% of the source volume capacity; for the current 50,000 MB volume, verify that the selected backup method accepts the database before scheduling the migration.

During a copy, both volumes may temporarily exist (50,000 MB + 15,000 MB). The final mounted capacity can be 15,000 MB, but this does not cap container images, logs, or separate backup storage. Railway's published pricing is based on stored usage, so a lower capacity does not necessarily reduce the bill if the database already uses less than 15 GB.

## Proposed cutover

1. **Preflight and consent.** Merge and deploy the reviewed Forge sync/reminders release first. Confirm account setup, a successful sync from two devices, reminder opt-in, and an owner-created export. Record the measured database, WAL, and SHM sizes. Confirm the database plus safety headroom fits within 15,000 MB.
2. **Protect the source.** In the Railway dashboard, make a recoverable volume backup and verify its restore point. Keep the current `gym-data` volume attached and untouched. Do not copy credentials or database contents to GitHub, chat, or a public artifact.
3. **Schedule a write freeze.** Choose a short maintenance window. Stop public account writes and the reminder sender before copying. Do not make a live byte-for-byte copy of an active SQLite WAL database.
4. **Create the target.** Provision a new volume named `forge-data-15gb` with `sizeMB: 15000` in `sfo`. For copying, mount the source and target at distinct temporary paths (for example `/source` and `/target`) in a one-off migration service or a reviewed maintenance setup; do not mount two databases at the same path.
5. **Copy and validate.** With the production writer stopped, use SQLite's backup/restore facilities (or checkpoint WAL, then copy the closed database as a unit). Run `PRAGMA integrity_check` on the target, compare required table counts, confirm the target size and ownership/permissions, and retain the source volume unchanged.
6. **Switch the service.** Detach the old mount from `gym-pwa`, mount the new volume at `/data`, keep `DATA_DIR=/data`, and set the truthful label to `15 GB Railway volume; 15 GB app-data cap`. Keep `APP_ORIGIN`, account setup state, VAPID keys, and other Railway-only secrets unchanged. Deploy one replica.
7. **Verify before cleanup.** Check `/health`, owner sign-in, saved workout/profile history, the latest cross-device revision, reminder schedules, push-subscription state, and generic push delivery. Check the app's reported database usage and review Railway service logs for errors. If any check fails, stop writes and restore the old volume/mount and prior deployment.
8. **Retain rollback.** Leave `gym-data` intact and detached after a successful cutover. Monitor the service through an agreed validation window. Delete the old 50 GB volume only after a separate, explicit owner confirmation; that deletion is irreversible.

## Secret and account handling

Real `APP_ORIGIN`, `SETUP_TOKEN`, VAPID private key, and other deployment values must remain in Railway variables, never in this plan or the source repository. The browser login password is not part of the synchronized workout data and must not be written to the volume-copy notes. After the owner creates the Forge account, remove the one-time `SETUP_TOKEN` from Railway.

## Official Railway references

- [Project members and roles](https://docs.railway.com/projects/project-members)
- [Railway volumes](https://docs.railway.com/volumes)
- [Volume reference and resize limits](https://docs.railway.com/volumes/reference)
- [Volume backups](https://docs.railway.com/volumes/backups)
