# Project Overview & PDR

## Context
- ForteX Web is a Next.js 14 App Router application that surfaces student, teacher, and system administration flows in parallel. The platform uses shared services, TanStack Query hooks, and Zustand stores to keep auth, permissions, and data fetching centralized.
- Recent work introduced a dedicated admin shell (sidebar + header UX) under `src/app/(admin)/layout.tsx`. The layout is guarded so only `SYSTEM_ADMIN` and `ORG_OWNER` roles can enter, while the main app layout (`src/app/(app)/layout.tsx`) redirects admins away from student/teacher flows.

## Product Development Requirements

### Functional Requirements
1. Provide a distinct admin navigation that highlights the two landing destinations (`/admin/roles`, `/admin/organizations`) side-by-side on desktop and collapses into a horizontal tab list on mobile.
2. Surface the admin user’s avatar, name, and context copy (`ForteX Admin`, `Admin Dashboard`) in a sticky header so administrators always know they are in the correct environment.
3. Keep admin content constrained to a max width (`max-w-7xl`) with consistent padding and safe dark-mode colors.
4. Automatically route authenticated admin roles into `/admin` when they land on the public shell, preventing students/teachers from seeing admin-only screens.

### Non-functional Requirements
- Tailwind CSS must be used with the shared `cn()` helper for conditional styling and `bg-primary-100`, `dark:bg-gray-950` tokens for day/night parity.
- The navigation bar should reuse the `adminMenu` array (labels, hrefs, icons) to avoid duplicated definitions and ensure the same order everywhere.
- Layout must render quickly (`min-h-screen`) and maintain accessibility-friendly focus states through the default Link styles.

### Acceptance Criteria
- Webpack/Next build targets the admin layout without runtime errors.
- RoleGuard rejects unauthorized access and the main `(app)` layout instantly redirects admin roles to `/admin` after hydration.
- Admin pages retain the new sidebar/header layout on desktop and the overflow nav on mobile, mirroring the `adminMenu` state.

### Success Metrics
- Admin navigation loads within one render cycle and does not trigger CSS reflow beyond the layout component.
- No student/teacher flows accidentally expose admin menu entries.
- Documentation (code standards, architecture, PDRs) stays in sync with the new admin shell, ensuring future updates follow the same pattern.

### Risks & Mitigations
- Role mismatch or unauthorized roles: mitigate by keeping the `adminMenu` hardcoded to two entries and gating with `RoleGuard`.
- Layout drift: pin container widths in the layout component (`max-w-7xl`, `min-h-screen`) and avoid inline overrides elsewhere.
