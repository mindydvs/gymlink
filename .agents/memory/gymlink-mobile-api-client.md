---
name: GymLink mobile API client (hand-mirrored hooks)
description: Codegen does not write to the mobile app — new API hooks must be hand-mirrored
---

# Mobile API hooks must be hand-mirrored after spec changes

GymLink mobile aliases `@workspace/api-client-react` to its OWN local copy at
`artifacts/gymlink-mobile/lib/api-client/`, NOT the shared generated lib.

**Consequence:** `pnpm --filter @workspace/api-spec run codegen` regenerates the
shared web client only. It does **not** touch the mobile client. After adding an
operation to the OpenAPI spec, you must hand-mirror the new hooks into
`artifacts/gymlink-mobile/lib/api-client/manual.ts` and export them from that
dir's `index.ts`.

**How to apply:**
- The mobile `custom-fetch.ts` exposes `customFetch<T>(url, options)`, `BodyType`,
  `ErrorType` — same shape as the shared mutator, so hooks can be written by hand
  mirroring the generated pattern (useQuery/useMutation wrappers).
- Reuse generated schema types (e.g. `Gym`) from `./generated/api.schemas` instead
  of redeclaring them — re-exporting a duplicate `interface Gym` from both
  `generated` and `manual` via the barrel `index.ts` is a duplicate-export error.
