---
name: Dev and production databases are separate
description: GymLink's development and deployment databases are distinct; production data changes cannot be made directly and must ship via app code + redeploy.
---

# Dev DB ≠ Production DB

The development database (what `executeSql` writes to by default) and the
deployed app's production database are **separate** in this project. A write to
dev does NOT appear in production, even after waiting (verified: dev row showed
`hidden=true` while the production read-replica and the live API kept
`hidden=false` long after).

**Why:** the deployment uses its own production database. `executeSql` with
`environment:"production"` is READ-ONLY (a replica), so the agent cannot write
production data directly.

**How to apply:** To change production *data* (not schema), put the change in the
deployed app's code as an idempotent operation and have the user redeploy the
backend. Example used here: an idempotent startup cleanup in the API server
(`artifacts/api-server/src/lib/cleanupDemoData.ts`) that hides demo seed users;
it runs on boot and takes effect in production only after the API is republished.
Publishing migrates schema, not data — so data fixes need this app-code path.

**Verify live state** by curling the production API domain
(`https://gym-tracker-mindydvs.replit.app/api/...`), not the dev preview. Note:
`gymlink.fit` is GitHub Pages, NOT the API.

**Prefer hide over delete** for seed users: `connections` and other tables have
FK references to `users.id`, so deleting users risks FK errors. The `users.hidden`
flag already drives the `/api/users` list filter and is reversible.
