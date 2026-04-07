# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### GymLink (`artifacts/gymlink`)
- React + Vite web app at `/`
- Dark-themed gym social networking platform
- Pages: Dashboard, Members, Member Detail, Connections, Notifications, Profile
- Connection types: crush (pink), buddy (blue), advisor (green), spotter (amber)

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- Routes: /users, /connections, /notifications, /stats
- Seeded with 7 demo users at Iron Temple Fitness

## Database Schema

- `users` — gym member profiles (id, name, age, avatar, bio, gym, schedule, interests, verified, distance, isMe, activeNow)
- `connections` — connection requests between users (crush/buddy/advisor/spotter)
- `notifications` — incoming connection alerts for current user ("me")

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
