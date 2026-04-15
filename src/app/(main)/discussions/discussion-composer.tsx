"use client";

/**
 * Discussion post composer — title + rich text content + category selector
 */

import { useState } from "react";
import { Send } from "lucide-react";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "programming", label: "Lập trình" },
  { value: "design", label: "Thiết kế" },
  { value: "learning-tips", label: "Mẹo học" },
  { value: "project", label: "Dự án" },
];

interface DiscussionComposerProps {
  onSubmit: (data: { title: string; content: string; category: string }) => void;
  isSubmitting?: boolean;
}

export function DiscussionComposer({ onSubmit, isSubmitting }: DiscussionComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("programming");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title: title.trim(), content, category });
    setTitle("");
    setContent("");
    setCategory("programming");
    setExpanded(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
      <input
        type="text"
        placeholder="Bắt đầu một cuộc thảo luận..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setExpanded(true)}
        className="w-full text-sm font-medium placeholder:text-slate-400 outline-none text-slate-800 mb-0"
      />

      {expanded && (
        <div className="mt-4 space-y-3">
          <TiptapEditor
            value={content}
            onChange={setContent}
            placeholder="Nội dung bài viết..."
            minHeight={120}
          />

          {/* Category selector */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                  category === cat.value
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-slate-200 text-slate-500 hover:border-primary-300"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setExpanded(false)}
              className="text-sm text-slate-400 hover:text-slate-600 px-4 py-2"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className={cn(
                "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors",
                "bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
