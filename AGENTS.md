# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-18
**Commit:** fed405b
**Branch:** test

## OVERVIEW

40Study — Next.js 14 App Router education platform with gamification (XP, streaks, leagues, achievements). Multi-role auth (student/teacher/parent/admin), org-scoped permissions, code sandbox IDE.

## STRUCTURE

```
40study-web/
├── src/
│   ├── app/                    # Next.js App Router (6 route groups)
│   │   ├── (auth)/             # Login, register, password flows
│   │   ├── (main)/             # Public: courses, leaderboard, profile
│   │   ├── (dashboard)/        # Protected: teacher/parent/admin panels
│   │   ├── (lesson)/           # Learning experience pages
│   │   ├── (classroom)/        # Live classroom
│   │   └── (ide)/              # Code editor
│   ├── components/
│   │   ├── code_sanbox/        # Self-contained IDE module (see subdirectory AGENTS.md)
│   │   ├── ui/                 # shadcn-style primitives
│   │   ├── gamification/       # XP, streaks, achievements, leaderboards
│   │   ├── course/             # Course cards, search, syllabus
│   │   ├── lesson/             # Video player, quiz, notes, progress
│   │   ├── auth/               # OTP, role cards, password checklist
│   │   ├── guards/             # RoleGuard, Can (permission checks)
│   │   ├── layout/             # Header, sidebar, footer, bottom nav
│   │   └── providers/          # QueryClient, Toaster wrappers
│   ├── hooks/                  # Custom hooks + queries/ subfolder
│   ├── services/               # API service classes (BaseService pattern)
│   ├── stores/                 # Zustand stores (auth, sidebar)
│   ├── lib/                    # api-client, errors, permissions, utils
│   ├── types/                  # TypeScript definitions
│   └── middleware.ts           # Edge middleware (route filtering only)
├── docker/                     # Container configs
└── public/                     # Static assets
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new page | `src/app/(group)/path/page.tsx` | Use appropriate route group |
| Add API service | `src/services/*.service.ts` | Extend `BaseService<T>` |
| Add React Query hook | `src/hooks/queries/use-*.ts` | Follow existing pattern |
| Add UI component | `src/components/ui/*.tsx` | shadcn-style, use `cn()` for classes |
| Add permission | `src/lib/permissions.ts` | Must match backend |
| Modify auth state | `src/stores/auth.store.ts` | Zustand with persist |
| Add route protection | Wrap with `<RoleGuard>` | Client-side only |
| Modify global providers | `src/components/providers/index.tsx` | QueryClient + Toaster |

## CONVENTIONS

**Deviations from standard Next.js:**

- Route groups `(name)/` used for layout isolation, not URL prefixes
- Auth protection is CLIENT-SIDE via `RoleGuard`, not middleware (middleware can't access localStorage)
- `apiClient` wrapper returns `data` directly, not wrapped `ApiResponse`
- Services extend `BaseService<T>` abstract class
- Path alias: `@/*` → `./src/*`

**Naming:**

- Services: `*.service.ts` with class extending BaseService
- Hooks: `use-*.ts` (kebab-case) or `use*.ts` (camelCase) — mixed, prefer kebab
- Components: PascalCase folders and files
- Route handlers: Not present — app uses external API

**Styling:**

- Tailwind with custom theme in `tailwind.config.ts`
- Custom colors: `primary`, `secondary`, `xp`, `streak`, `achievement`, `league`
- Custom animations: `float-up`, `pulse-glow`, `bounce-in`, `shake`
- Font families: `sans` (Inter), `code` (Consolas), `ui` (SF Pro)

## ANTI-PATTERNS (THIS PROJECT)

```
NEVER:
- Use middleware for auth checks (can't access localStorage)
- Skip RoleGuard on protected routes
- Use `as any` or `@ts-ignore`
- Import from node_modules paths directly for UI components

DEPRECATED:
- `ApiClient` class in api-client.ts → use `apiClient` object instead

TECHNICAL DEBT (TODOs in code):
- Gamification API not wired (dashboard/page.tsx)
- Lesson progress save/complete not implemented (lesson page)
- Course enrollment logic missing (course detail page)
```

## UNIQUE STYLES

**Auth Flow:**

1. Login → role selection (if multi-role) → org selection (if multi-org) → dashboard
2. Parent flow: select child before dashboard
3. Token refresh handled automatically by axios interceptor

**Permission System:**

- `SystemRole`: SYSTEM_ADMIN, ORG_OWNER, TEACHER, STUDENT, PARENT, TEACHER_APPLICANT
- `Permission`: granular permissions loaded from backend
- Check with `<Can permission="..." />` or `<RoleGuard roles={[...]} />`

**Gamification:**

- XP earned on lesson completion
- Daily streaks with freeze option
- League tiers: bronze → silver → gold → diamond → champion
- Achievements with unlock animations

## COMMANDS

```bash
npm run dev       # Start dev server (Next.js)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint (next lint)
npm run format    # Prettier format all
```

## NOTES

- Vietnamese locale (`lang="vi"`, Inter font includes Vietnamese subset)
- `printWidth: 100` in Prettier (wider than default 80)
- `strict: true` in TypeScript
- No tests configured (no vitest/jest/playwright found)
- No CI/CD workflows in repo
- HLS video streaming via hls.js
- Monaco editor for code sandbox
