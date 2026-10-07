# Storage limit and Railway volume

Forge will enforce a **15,000,000,000-byte logical data ceiling** for the account database. Workout history is compact structured data; images and videos are not uploaded to account storage. The offline movement demos, SVG illustration and supplement catalog are static app assets in the repository and service-worker cache.

The current Railway production volume is **50,000 MB** at `/data`. Railway cannot shrink that volume in place. A physical 15GB volume requires a new 15,000 MB volume and a data-preserving migration/cutover; deleting the old volume destroys its database. The logical cap does not change the provider's 50GB volume allocation or billing. Do not remove the existing volume until an owner-approved backup/migration and the new service health check are complete.

See `docs/SYNC_AND_NOTIFICATIONS.md` for sync and export behavior. The app's quota reports database usage, not the exact provider volume's billable capacity.
