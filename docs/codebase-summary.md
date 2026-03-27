# Codebase Summary

Compiled from the repomix packing located at `./repomix-output.xml`, this document captures the high-level structure that matters for documentation or onboarding updates.

## Repository structure snapshot

| Area | Description |
| --- | --- |
| `src/app/` | Next.js App Router split into role-based folders: `(admin)`, `(app)`, `(auth)`, `(live)`, `(main)`, `(teacher)`, plus shared error/utility pages. Each group contains its own layout, pages, and nested segments (e.g., `(admin)/admin` with `roles` and `organizations`). |
| `src/components/` | UI primitives (`ui/`), role guards (`guards/`), layout pieces (`layout/`), auth-only helpers, gamification widgets, and the standalone code sandbox module. |
| `src/services/` | Axios-based services extending `BaseService<T>`, paired with `hooks/queries` for TanStack Query wrappers. |
| `src/stores/` | Zustand stores such as `auth.store.ts` with persisted session, active role, permissions, and org info. |
| `src/lib/` | Utilities (`utils.ts`, `routes.ts`, constants, permission helpers, and `domain-access-policy.ts`) that keep API contracts, routing helpers, and shared constants centralized. |

## Admin surface and UX

- `src/app/(admin)/layout.tsx` now drives a dedicated admin shell. It is wrapped in `<RoleGuard roles={['SYSTEM_ADMIN','ORG_OWNER']}>`, maintains a sidebar navigation built from the `adminMenu` array, and surfaces a sticky header with the user avatar, admin title, and responsive tab strip for mobile enumerating the same destinations (`/admin/roles`, `/admin/organizations`).
- The layout keeps a consistent max-width (`max-w-7xl`) content column with padding and ensures mobile users still access the same navigation via the horizontal overflow nav at the bottom of the header.
- Guarded admin entry points redirect from the public/app shell by checking `normalizeRole(activeRole)` in `src/app/(app)/layout.tsx`, preventing students/teachers from landing on the admin routes.

## Shared patterns to reference

- `AppShellLayout` (`src/components/layout/app-shell-layout.tsx`) is reused for student/teacher flows behind `RoleGuard` to keep header/footer consistent.
- Tailwind is used throughout with the `cn()` helper for conditional classes, and theme-aware color tokens (`bg-primary-100`, `dark:bg-gray-950`, etc.) keep dark/light parity.
- Authentication flows rely on centralized `useAuthStore` and `RoleGuard`/`Can` components found under `src/components/guards`, while API interactions flow through `services/*.service.ts` + `hooks/queries/use-*.ts`.

## References

- Pack format: `repomix-output.xml` (same directory)
- Landing entry: `/admin` route lives inside `(admin)/admin/page.tsx` and is subject to the guard/layout above.
