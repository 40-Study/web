---
status: completed
created: 2026-03-28
completed: 2026-03-28
approach: hybrid-option-c
mode: parallel
---

# UI Modernization — Hybrid Option C

Modern UI: clean white, rounded-2xl cards, soft shadows, bright blue accent, spacious, elegant typography.

## Phases

| # | Phase | Status | Owner |
|---|-------|--------|-------|
| 1 | UI Primitives | completed | agent-1 |
| 2 | Layout Components | completed | agent-2 |
| 3 | Student Pages | completed | agent-3 |

## Phase Details

### Phase 1: UI Primitives (Global Impact)
Update base components → auto-affects entire app.

**Files:**
- `src/components/ui/card.tsx` → `rounded-2xl border-gray-100 shadow-sm` default
- `src/components/ui/button.tsx` → `rounded-xl` default
- `src/components/ui/input.tsx` → `rounded-xl` default
- `src/components/ui/textarea.tsx` → `rounded-xl` default
- `src/components/ui/dialog.tsx` → `rounded-2xl` default
- `src/components/ui/badge.tsx` → `rounded-full` default
- `src/components/ui/select.tsx` → `rounded-xl` default
- `src/components/ui/tabs.tsx` → rounded pill style

### Phase 2: Layout Components
**Files:**
- `src/components/layout/app-shell-layout.tsx` → `bg-gray-50/50`
- `src/components/layout/header.tsx` → softer border, backdrop-blur, rounded search
- `src/components/layout/sidebar.tsx` → rounded-xl icons, softer hover, remove border-r → shadow
- `src/components/layout/footer.tsx` → cleaner, brighter
- `src/components/layout/bottom-nav.tsx` → rounded pill active, floating style
- `src/components/layout/dashboard-header.tsx` → match new style

### Phase 3: Student-Facing Pages
**Files:**
- `src/app/(app)/home/page.tsx` → rounded cards, brighter hero
- `src/app/(app)/leaderboard/page.tsx` → rounded, colorful ranks
- `src/app/(app)/profile/[userId]/page.tsx` → rounded avatar, card sections
- `src/app/(app)/schedule/page.tsx` → rounded calendar cards
- `src/app/(app)/my-courses/page.tsx` → match new course card style
- `src/app/(app)/my-assignments/page.tsx` → rounded cards
- `src/app/(main)/page.tsx` → landing page hero + sections
- `src/app/(main)/discussions/page.tsx` → rounded thread cards

### Skip (low priority)
- Admin pages (internal only)
- Teacher pages (separate redesign later)
- Auth pages (already decent)

## Design Tokens
- Border radius: `rounded-2xl` (cards), `rounded-xl` (buttons/inputs), `rounded-full` (badges/pills)
- Shadows: `shadow-sm` (cards), `shadow-xl` (dropdowns/modals)
- Borders: `border-gray-100` (subtle), no harsh borders
- Backgrounds: `bg-gray-50/50` or `bg-white` (sections)
- Primary: Sky-500 `#0EA5E9` (already set)
- Typography: Inter font, `font-bold` headers, `text-gray-900` / `text-gray-500`
