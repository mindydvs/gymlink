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
- Deep navy Nike Training Club/Shred-inspired design (`--background: 229 45% 7%`, brand red `#E8193C`, cyan `#00C4E8`)
- Pages: Welcome (onboarding), Dashboard, Members, Member Detail, Connections, Notifications, Profile
- Connection types: crush `#E8193C`, buddy `#0B9ED9`, advisor `#12B76A`, spotter `#F79009`
- Auth: `AuthContext` persists `userId` to `localStorage:gymlink_user_id`; sent via `Authorization: Bearer <userId>` header
- Logo: `/logo.png` in `artifacts/gymlink/public/`

### GymLink Mobile (`artifacts/gymlink-mobile`)
- Expo (React Native) mobile app at `/gymlink-mobile/`
- Same deep navy brand palette as the web app (synced from index.css to `constants/colors.ts`)
- 4 tabs: Feed (gym stats + member list), Members (search), Connections (requests + accepted), Profile
- Stack route: `app/member/[id].tsx` — member detail with connect sheet
- Auth: AsyncStorage `gymlink_user_id`, sent via `Authorization: Bearer <userId>` (default: `"me"`)
- Uses `@workspace/api-client-react` generated hooks with `setBaseUrl` + `setAuthTokenGetter`
- `context/UserContext.tsx` — manages current user ID via AsyncStorage
- Components: AvatarImage, ConnectionBadge, VideoCard (with like button), MemberCard, NotificationCard

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- Auth middleware reads `Authorization: Bearer <userId>` header; defaults to `"me"` if absent
- Routes: `/api/users`, `/api/connections`, `/api/notifications`, `/api/stats`, `/api/gyms`, `/api/users/me/checkin`, `/api/auth/register`, `/api/auth/login`, `/api/auth/users`
- Seeded with 7 demo users at Iron Temple Fitness

## Database Schema

- `users` — gym member profiles (id, name, age, avatar, avatarUrl, bio, gym, gymId, schedule, interests, verified, distance, isMe, activeNow, checkedIn)
- `gyms` — gym locations (id, name, address, city, memberCount); seeded with 10 Austin gyms
- `connections` — connection requests between users (crush/buddy/advisor/spotter)
- `notifications` — incoming connection alerts for current user
- `workout_videos` — uploaded workout form videos (id, userId, objectPath, title, description, createdAt)

## Frontend Components

- `context/auth.tsx` — AuthContext with login/logout/register; localStorage persistence
- `pages/welcome.tsx` — multi-step join flow + sign-in; shows when no userId in localStorage
- `components/gym-picker.tsx` — searchable gym dropdown using `/api/gyms`
- `components/interest-picker.tsx` — preset chip + custom interest input
- `components/avatar-uploader.tsx` — profile photo upload via presigned URL; shows image or emoji fallback
- `components/video-uploader.tsx` — workout video upload (max 2 min, client-side duration validation), list/delete; uses `useUpload` from `@workspace/object-storage-web`
- `pages/home.tsx` — Dashboard with check-in card, stats, notifications, member discovery
- `pages/profile.tsx` — Profile view/edit with GymPicker + InterestPicker + AvatarUploader + VideoUploader
- `pages/member-detail.tsx` — Member profile with avatar photo, connection picker, VideoUploader (view-only)

## Auth Pattern

- User ID stored in `localStorage` key `gymlink_user_id`
- Sent on every API request via `Authorization: Bearer <userId>` header
- Backend `authMiddleware` extracts userId from header, defaults to `"me"`
- All user routes use `req.userId` (dynamic, not hardcoded)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
