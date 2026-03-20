---
title: "Project Refactor & Testing"
description: "Fix 55 issues across auth, course, dashboard modules + setup Vitest"
status: in-progress
priority: P1
effort: 32h
branch: test
tags: [refactor, testing, bugfix, auth, courses]
created: 2026-03-20
updated: 2026-03-20
---

# Project Refactor & Testing Plan

## Overview

Refactor toàn diện và setup testing cho project. 55 issues được phát hiện qua scan: 15 critical, 9 high, 14 medium. API backend ~50-80% ready.

## Context

- **Brainstorm Report**: [brainstorm-260320-0913-refactor-and-testing.md](../reports/brainstorm-260320-0913-refactor-and-testing.md)
- **Timeline**: 3-5 days
- **Approach**: Incremental refactoring
- **Testing**: Vitest (unit tests only)

## Phases

| # | Phase | Status | Effort | Issues | Link |
|---|-------|--------|--------|--------|------|
| 1 | Setup Vitest | ✅ Done | 4h | - | [phase-01](./phase-01-setup-vitest.md) |
| 2 | Fix Auth Module | ✅ Done | 8h | 19 | [phase-02](./phase-02-fix-auth-module.md) |
| 3 | Fix Course/Lesson | ✅ Done | 8h | 20 | [phase-03](./phase-03-fix-course-lesson.md) |
| 4 | Fix Dashboard/Teacher | ✅ Done | 8h | 16 | [phase-04](./phase-04-fix-dashboard-teacher.md) |
| 5 | Testing & Polish | 🔄 In Progress | 4h | - | [phase-05](./phase-05-testing-polish.md) |

## Issue Distribution

```
Auth Module:        ████████████████████ 19 issues (4 critical)
Course/Lesson:      █████████████████████ 20 issues (3 critical)
Dashboard/Teacher:  ████████████████ 16 issues (8 critical)
```

## Success Criteria

- [x] All 15 critical bugs fixed
- [x] Vitest setup complete with baseline tests
- [ ] 80%+ coverage on services/hooks (partial - baseline tests only)
- [x] No TypeScript errors
- [x] All pages functional with real API (where available)

## Dependencies

- Backend API ~50-80% ready
- Mock fallback for unavailable endpoints

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API not ready | High | Conditional mock fallback |
| Breaking changes | Medium | Incremental commits per module |
| Timeline overrun | Medium | Prioritize critical fixes first |
