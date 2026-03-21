"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn, debounce } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CourseSearchResult } from "@/types/course";

interface CourseSearchProps {
  onSearch?: (query: string) => void;
  suggestions?: CourseSearchResult[];
  className?: string;
  placeholder?: string;
}

export function CourseSearch({
  onSearch,
  suggestions = [],
  className,
  placeholder = "Tìm kiếm khóa học...",
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 text-base"
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
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
          {filteredSuggestions.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted text-left transition-colors"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium line-clamp-1">{course.title}</p>
                <p className="text-xs text-muted-foreground">
                  {course.instructor}
                </p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-2 text-sm text-primary-600 hover:bg-muted text-left border-t"
          >
            Xem tất cả kết quả cho &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
