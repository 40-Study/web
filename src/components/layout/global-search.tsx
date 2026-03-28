"use client";

/**
 * GlobalSearch - Cmd+K / Ctrl+K search modal
 * Searches courses by keyword via courseService.searchCourses
 * Shows grouped results with keyboard navigation (arrows + enter)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { courseService, type ApiCourse } from "@/services/course.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "course";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function courseToResult(course: ApiCourse): SearchResult {
  return {
    id: course.id,
    title: course.title,
    subtitle: course.instructor?.name ?? "Khóa học",
    href: `/courses/${course.slug ?? course.id}`,
    type: "course",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Open / close ──────────────────────────────────────────────────────────

  const openModal = useCallback(() => {
    setOpen(true);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  }, []);

  // ── Keyboard: Cmd+K / Ctrl+K to open ─────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) {
          closeModal();
        } else {
          openModal();
        }
      }
      if (e.key === "Escape" && open) {
        closeModal();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, openModal, closeModal]);

  // ── Focus input when modal opens ─────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ── Debounced search ─────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const courses = await courseService.searchCourses(query.trim(), 8);
        setResults(courses.map(courseToResult));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Keyboard navigation inside results ───────────────────────────────────

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        navigateTo(results[activeIndex].href);
      } else if (query.trim()) {
        navigateTo(`/courses?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  function navigateTo(href: string) {
    router.push(href);
    closeModal();
  }

  if (!open) {
    return (
      // Trigger button shown in header — clicking opens the modal
      <button
        onClick={openModal}
        className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-full px-4 py-2 w-64 lg:w-96 transition-colors text-left"
        aria-label="Mở tìm kiếm (Cmd+K)"
      >
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm text-slate-400 flex-1">Tìm kiếm khóa học...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
          <span>⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    // ── Modal backdrop ────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm toàn cục"
    >
      <div className="w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm kiếm khóa học..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
          <button
            onClick={closeModal}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Khóa học
            </p>
            {results.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.href)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  idx === activeIndex ? "bg-primary-50" : "hover:bg-slate-50"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state — only shown after user types and no results */}
        {!loading && query.trim() && results.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 text-[11px] text-slate-400">
          <span><kbd className="font-mono">↑↓</kbd> điều hướng</span>
          <span><kbd className="font-mono">↵</kbd> chọn</span>
          <span><kbd className="font-mono">Esc</kbd> đóng</span>
        </div>
      </div>
    </div>
  );
}
