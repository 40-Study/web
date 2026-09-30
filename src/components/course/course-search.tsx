"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CourseSearchResult } from "@/types/course";

interface CourseSearchProps {
  onSearch?: (query: string) => void;
  suggestions?: CourseSearchResult[];
  className?: string;
  placeholder?: string;
  isLoading?: boolean;
}

// Mặc định phải là hằng ổn định: `= []` trong tham số tạo mảng mới mỗi lần render, làm effect lọc
// gợi ý (phụ thuộc `suggestions`) chạy lại và setState liên tục -> render vô hạn khi không truyền.
const NO_SUGGESTIONS: CourseSearchResult[] = [];

export function CourseSearch({
  onSearch,
  suggestions = NO_SUGGESTIONS,
  className,
  placeholder = "Tìm trong danh sách…",
  isLoading = false,
}: CourseSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // URL là nguồn sự thật cho từ khóa: điền sẵn khi tải trang và cập nhật khi back/forward.
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const lastNotifiedRef = useRef(urlQuery);

  // Đồng bộ khi URL đổi (back/forward, link tìm kiếm ở header). Chỉ chạy khi `q` trên URL đổi,
  // nên không ghi đè thứ người dùng đang gõ dở.
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<CourseSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.length >= 2) {
      const filtered = suggestions.filter(
        (course) =>
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.instructor.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, suggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Báo từ khóa cho trang cha sau 300ms. Khóa theo `query` (onSearch lấy qua ref) để một lần
  // render lại của cha không kích hoạt lại và không reset "Tải thêm". Từ khóa < 2 ký tự coi như
  // rỗng: nếu không, xóa ô/xóa từ khóa sẽ để lại kết quả đã lọc cũ.
  useEffect(() => {
    const effective = query.length >= 2 ? query : "";
    if (effective === lastNotifiedRef.current) return;
    const timer = setTimeout(() => {
      lastNotifiedRef.current = effective;
      onSearchRef.current?.(effective);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (course: CourseSearchResult) => {
    setQuery("");
    setShowSuggestions(false);
    router.push(`/courses/${course.slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery("");
    // Bỏ luôn `q` trên URL, nếu không tải lại trang sẽ điền lại từ khóa cũ.
    if (urlQuery) router.replace("/courses");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {isLoading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            aria-label="Tìm khóa học"
            type="text"
            placeholder={placeholder}
            className="h-11 pl-10 pr-11 text-base rounded-lg border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-400 dark:hover:text-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSuggestions && isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-raised z-50 p-4 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Đang tìm kiếm...</span>
        </div>
      )}
      {showSuggestions && !isLoading && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-raised z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {filteredSuggestions.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-50 line-clamp-1">{course.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{course.instructor}</p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-slate-800 text-left border-t border-slate-100 dark:border-slate-800 transition-colors"
          >
            Xem tất cả kết quả cho &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
