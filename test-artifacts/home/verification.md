# Home widget dashboard verification — 2026-10-16

Changed files:
- src/app/(app)/home/page.tsx
- src/components/dashboard/home-dashboard.tsx
- src/components/dashboard/home-widget-layout.ts

Design: widget dashboard based on the supplied HTML reference; existing ForteX typography, semantic colors, card/control radii, shadows and shared UI primitives. User-specific browser storage stores visibility and ordering. Parent route branching is retained.

Code checks:
- npm run typecheck: passed.
- next lint for all three changed/new source files: passed without warnings.
- Existing dashboard suites (home-cards, greeting, streak-card, today-schedule .ts and .tsx): 5 files, 21 tests passed.

Browser checks with the local seeded student account and real backend:
- Dashboard loads real enrollments, progress, XP, streak, profile activity and timetable.
- Desktop and mobile layouts inspected; document scrollWidth equals clientWidth on mobile.
- Hide activity widget, change widget order, save: success feedback and correct UI state.
- Cancel discards checkbox changes.
- Layout retained after opening another authenticated session.
- Restore defaults displays every widget in its original order.
- Continue learning resolves to /learn/flutter-mobile-development/ca06293e-8e82-407a-b0f6-a4b920cb7469 and renders the lesson player/content.

Chrome DevTools Network after a clean home reload:
- GET /api/enrollments?page=1&page_size=100: one request, 200.
- GET /api/me/timetable: one request, 200.
- GET /api/courses?is_featured=true&page_size=6: one request, 200.
- GET /api/users/:id/public-profile: one request, 200.
- Opening, cancelling and saving customization did not refetch these APIs or create a mutation.
- /api/friends/summary repeat traced to existing useFriendSummary / FRIEND_SUMMARY_POLL_MS = 30000, used by navigation badges. It is existing intentional polling, independent of widget customization. Notification polling is also pre-existing.
- Console in this successful test session showed development/socket informational logs and no errors.

Limits:
- API failure/retry, unavailable localStorage, dark mode and parent UI were not exercised in the browser.
- Initial login while backend was offline failed; local backend was then started and the functional checks above ran successfully. Backend RabbitMQ workers are disabled for this test process via RABBITMQ_PORT=1.
- No production deploy or commit performed.

Screenshots: home-desktop.jpg and home-mobile.jpg.
