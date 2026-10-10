"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { getErrorMessage } from "@/lib/error-messages";
import { isArticleBodyBlank, validateArticleForm } from "@/lib/add-content-validation";

export interface ArticleFormValue {
  title: string;
  /** HTML Tiptap — backend lưu nguyên, học viên đọc qua `sanitizeHtml`. */
  articleBody: string;
}

/** `void`/`true` = đã lưu. `false` = thất bại (đã báo ở nơi khác). `{ error }` = hiện ngay dưới form. */
export type ArticleSubmitResult = void | boolean | { error: string };

interface ArticleContentFormProps {
  initialTitle?: string;
  initialBody?: string;
  submitLabel: string;
  onSubmit: (value: ArticleFormValue) => ArticleSubmitResult | Promise<ArticleSubmitResult>;
  onCancel?: () => void;
  /** Khoá form khi cha đang bận (vd đang lưu bằng mutation riêng). */
  disabled?: boolean;
}

/**
 * Form viết bài: tiêu đề + nội dung Tiptap (QA 261008 T1/T7).
 *
 * Dùng chung cho modal "Thêm nội dung" (tạo mới) và trang bài học của giáo viên (sửa). Nút lưu bị vô
 * hiệu hoá khi nội dung trống — Tiptap trống là `<p></p>`, xem `isArticleBodyBlank`. Không đóng/xoá
 * form khi lưu lỗi: nội dung dài mất sạch vì một lần 400 là lỗi nặng nhất của form kiểu này.
 */
export function ArticleContentForm({
  initialTitle = "",
  initialBody = "",
  submitLabel,
  onSubmit,
  onCancel,
  disabled = false,
}: ArticleContentFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = validateArticleForm(title, body);
  const shownErrors = attempted ? errors : {};
  const bodyBlank = isArticleBodyBlank(body);

  const handleSubmit = async () => {
    if (submitting || disabled) return;
    setAttempted(true);
    setSubmitError(null);
    if (errors.title || errors.body) return;
    setSubmitting(true);
    try {
      const result = await onSubmit({ title: title.trim(), articleBody: body });
      if (typeof result === "object" && result !== null) setSubmitError(result.error);
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Không thể lưu bài viết"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Tiêu đề bài viết"
        placeholder="VD: Bài đọc - Giới thiệu Git"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={shownErrors.title}
        maxLength={255}
      />

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Nội dung</span>
        <TiptapEditor value={body} onChange={setBody} placeholder="Viết nội dung bài viết..." minHeight={240} />
        {shownErrors.body ? (
          <p role="alert" className="text-xs text-destructive">
            {shownErrors.body}
          </p>
        ) : bodyBlank ? (
          <p className="text-xs text-muted-foreground">Nhập nội dung bài viết để có thể lưu.</p>
        ) : null}
      </div>

      {submitError && (
        <p role="alert" data-testid="article-submit-error" className="text-xs text-destructive">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Hủy
          </Button>
        )}
        <Button type="button" onClick={handleSubmit} isLoading={submitting} disabled={disabled || bodyBlank}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
