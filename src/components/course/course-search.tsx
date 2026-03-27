"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { cn, debounce } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CourseSearchResult } from "@/types/course";

interface CourseSearchProps {
  onSearch?: (query: string) => void;
  suggestions?: CourseSearchResult[];
  className?: string;
  placeholder?: string;
  isLoading?: boolean;
}

export function CourseSearch({
  onSearch,
  suggestions = [],
  className,
  placeholder = "Tìm kiếm khóa học...",
  isLoading = false,
}: CourseSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
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

  // Debounced search callback
  useEffect(() => {
    if (onSearch && query.length >= 2) {
      const debouncedSearch = debounce(() => onSearch(query), 300);
      debouncedSearch();
    }
  }, [query, onSearch]);

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
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 text-base rounded-2xl border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSuggestions && isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-gray-500">Đang tìm kiếm...</span>
        </div>
      )}
      {showSuggestions && !isLoading && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          {filteredSuggestions.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                <p className="text-xs text-gray-500">{course.instructor}</p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 text-left border-t border-gray-100 transition-colors"
          >
            Xem tất cả kết quả cho &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
