/**
 * Code draft service — bản nháp code phía server (contract sec. 4, E12-E15).
 * Scope: `exercise:<uuid>` (trình soạn của bài tập) hoặc `sandbox:<path>` (một tệp trong cây tệp sandbox).
 * Endpoints: /code-drafts (envelope `{message, data}`)
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CodeDraft {
  scope: string;
  /** "" hoặc khoá trong `RUNNABLE_LANGUAGES` */
  language: string;
  code: string;
  updated_at: string;
}

/** Một dòng của danh sách (E14): không có code; `size` là số byte của code. */
export interface CodeDraftSummary {
  scope: string;
  language: string;
  size: number;
  updated_at: string;
}

export interface SaveCodeDraftDTO {
  scope: string;
  language: string;
  code: string;
}

/** Xoá đúng một scope, hoặc mọi bản nháp dưới một prefix (`sandbox:` / `sandbox:<path>/`). */
export type CodeDraftTarget = { scope: string } | { prefix: string };

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const codeDraftService = {
  /** GET /code-drafts?scope= (E12) — `null` (vẫn 200) khi chưa có nháp */
  get: (scope: string) =>
    api.get<R<CodeDraft | null>>("/code-drafts", { params: { scope } }).then((r) => r.data.data),

  /** PUT /code-drafts (E13) — upsert theo (người dùng, scope) */
  save: (body: SaveCodeDraftDTO) =>
    api.put<R<CodeDraft>>("/code-drafts", body).then((r) => r.data.data),

  /** GET /code-drafts/list?prefix= (E14) */
  list: (prefix: string) =>
    api
      .get<R<CodeDraftSummary[]>>("/code-drafts/list", { params: { prefix } })
      .then((r) => r.data.data),

  /** DELETE /code-drafts?scope= | ?prefix= (E15) */
  remove: (target: CodeDraftTarget) =>
    api
      .delete<R<{ deleted: number }>>("/code-drafts", { params: target })
      .then((r) => r.data.data),
};
