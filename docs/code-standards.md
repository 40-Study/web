# Code Standards

## Layout and navigation patterns
- Admin surfaces live under `src/app/(admin)` and are wrapped inside `RoleGuard` so that only `SYSTEM_ADMIN` and `ORG_OWNER` can render anything inside the shell (`src/app/(admin)/layout.tsx`). The layout builds its navigation from the `adminMenu` array and uses a responsive combination of a desktop sidebar and a mobile horizontal tab bar so the same menu definition powers both experiences.
- Student/teacher/public flows share `src/app/(app)/layout.tsx`. It waits for `useAuthStore` to hydrate and then either renders `AppShellLayout` (inside `<RoleGuard roles={["STUDENT","TEACHER","PARENT"]}>`) or short-circuits to `null` while an admin route replacement occurs (`router.replace("/admin")`). Keep this pattern: `normalizeRole(activeRole)` determines redirection, `RoleGuard` protects specific sections, and `AppShellLayout` keeps headers/footers consistent.
- Navigation links use the `cn()` helper (`src/lib/utils.ts`) to build Tailwind-safe conditional classes and rely on tokens such as `bg-primary-100`/`dark:bg-gray-950` to keep light/dark parity.

## Styling and accessibility
- Tailwind CSS is the styling system. Prefer semantic spacing utilities (`px-4`, `py-2`, `max-w-7xl`, `min-h-screen`) instead of inline styles so layout components stay responsive. Use `text-sm font-medium` plus focus-visible outlines from the default `<Link>` styles for accessibility.
- Keep text hierarchies consistent: `text-base font-semibold` for section headings, `text-xs uppercase tracking-wide` for labels, and `text-gray-*`/`dark:text-gray-*` tokens for tone adjustments across themes.

## Access control and error handling
- Guards live under `src/components/guards`. Reuse `<RoleGuard>` every time a page can be reached only by a specific role set. Guarded layouts should be wrapped in `<RoleGuard roles={[...]}>` and render fallback content or `null` during hydration to avoid flashes of unauthorized content.
- Authentication state relies on `src/stores/auth.store.ts`. Always destructure `hasHydrated`, `isAuthenticated`, `activeRole`, and `user` from the store before rendering layout chrome or making redirects.
- When a guarded layout fails (e.g., missing permission), rely on RoleGuard’s internal fallback or redirect logic instead of throwing runtime errors. Each route handler should either redirect, render a `<Forbidden />` page, or gracefully show placeholder text.

## API contracts and data fetching
- Services under `src/services/*.service.ts` extend a shared `BaseService<T>` and expose CRUD helpers (`getAll`, `getById`, `create`, `update`, `delete`). Keep API routes consistent with the backend (see `src/lib/routes.ts` for canonical path segments).
- Hook files (`src/hooks/queries/use-*.ts`) wrap TanStack Query hooks. Prefer `useSuspenseQuery` when the UI suspends, and keep `queryKey` values stable strings (`['admin', 'roles']`, etc.) so cache invalidation works predictably.
- Avoid duplicating API URLs; import `routes` constants and reuse them in services/hooks stitching.

## Testing and observability
- Layout changes should be covered by integration or visual regression tests that assert the admin layout renders both sidebar and mobile nav states from the single `adminMenu` data source.
- Use console barriers (try/catch) around async service calls and log errors to the centralized client logger `src/lib/errors.ts` before re-throwing so UI fallback content can display.
