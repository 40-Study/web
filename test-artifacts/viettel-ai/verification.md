# ViettelAI live verification — 2026-10-18

Local AI Studio: http://localhost:3000/teacher/ai

## Configuration

The existing backend OpenAI-compatible adapter uses the AIZ environment key, copied into the ignored backend `.env` as `VIETTEL_AI_API_KEY`. No secret is included in this report. Endpoint: `https://viettelai.vn/model-as-a-service/v1`; model: `DeepSeek-V4-Flash`. Authenticated provider GET `/models` returned 200 and listed this model. The sample `DeepSeek-V4-Flash-0731` was not listed.

## Real browser flows

1. Teacher login → generate 2 Vietnamese Python quiz questions → choose answers → submit preview. Two questions, four distinct options per question, correct answers/explanations, score 2/2 (100%). Preview scoring remains local, not a saved student grade. Screenshot: `quiz-result.jpg`.
2. Teacher login in Chrome → DevTools Network → reload AI Studio → generate 3 introductory Python slides with a double click on Send. One status 200, one generate 200 (~5 seconds); exactly three slides and version v1. Preview available.
3. Request expansion to 20 slides → double click Stop. Initial test exposed unintended resubmission after the button switched to Send. Fixed the Send click guard and added a regression test that failed before the fix and passed afterward.
4. Repeat cancellation after fix with clean Network: status 200 once; generate cancelled once; cancel 200 once. No extra generation, status refetch, or AI request appeared afterward. Previous v1 and its three slides remained intact, cancellation message appeared and composer unlocked. Screenshot: `cancel-network.png`.
5. Chrome DevTools Console after corrected cancellation: no runtime error; only React DevTools and WebSocket information. In-app browser warning/error log empty.

## Automated checks

- `go test ./internal/service ./internal/router -run 'TestOpenDesign' -count=1`: passed, including provider request contract, output validation, provider failures, permissions, concurrency and upstream cancellation.
- `npx vitest run src/components/open-design/studio-composer.test.tsx src/lib/open-design/project.test.ts src/lib/open-design/preview.test.ts`: 3 files, 7 tests passed.
- `npx next lint --file src/components/open-design/studio-composer.tsx --file src/components/open-design/studio-composer.test.tsx`: passed.
- `npm run typecheck`: passed.
- Backend `.env` ignored by Git, mode 0600. Exact secret scan of 206 frontend JavaScript chunks found zero matches.

## Scope

The live test covers quiz/slide generation, preview quiz scoring, double-click protection, and cancellation rollback. Uploads and exports with live-generated content, large generation completion, and every other platform flow were not re-tested. Drafts remain stored locally per user; no new durable background job queue or database persistence was added.
