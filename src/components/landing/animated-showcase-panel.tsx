"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal, Cpu, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Code lines for typewriter effect
const CODE_LINES = [
  { text: 'import', cls: "text-pink-400" },
  { text: ' { ThemeProvider } ', cls: "text-slate-300" },
  { text: 'from', cls: "text-pink-400" },
  { text: ' "next-themes";\n', cls: "text-green-300" },
  { text: 'import', cls: "text-pink-400" },
  { text: ' { Inter } ', cls: "text-slate-300" },
  { text: 'from', cls: "text-pink-400" },
  { text: ' "next/font/google";\n\n', cls: "text-green-300" },
  { text: 'export default function', cls: "text-primary-400" },
  { text: ' RootLayout', cls: "text-yellow-200" },
  { text: '({\n  children,\n}: { children: React.ReactNode }) {\n', cls: "text-slate-300" },
  { text: '  return', cls: "text-pink-400" },
  { text: ' (\n', cls: "text-slate-300" },
  { text: '    <html lang="en">\n', cls: "text-primary-400" },
  { text: '      <body>\n', cls: "text-primary-400" },
  { text: '        <ThemeProvider>\n', cls: "text-primary-400" },
  { text: '          {children}\n', cls: "text-slate-300" },
  { text: '        </ThemeProvider>\n', cls: "text-primary-400" },
  { text: '      </body>\n', cls: "text-primary-400" },
  { text: '    </html>\n', cls: "text-primary-400" },
  { text: '  );\n}', cls: "text-slate-300" },
];

// Flatten all characters with their colors for typewriter
function buildCharList() {
  const chars: { char: string; cls: string }[] = [];
  for (const line of CODE_LINES) {
    for (const char of line.text) {
      chars.push({ char, cls: line.cls });
    }
  }
  return chars;
}

const ALL_CHARS = buildCharList();
const TOTAL_CHARS = ALL_CHARS.length;

// Easing function for smooth counter animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedShowcasePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fpsCount, setFpsCount] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const hasAnimated = useRef(false);
  const hasScrolled = useRef(false);
  const isInViewport = useRef(false);

  // Scroll gate — only allow animation after user has scrolled
  useEffect(() => {
    const onScroll = () => {
      hasScrolled.current = true;
      // If element was already in viewport, trigger now
      if (isInViewport.current && !hasAnimated.current) {
        setIsVisible(true);
        hasAnimated.current = true;
      }
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection Observer — trigger only when scroll gate is open
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewport.current = entry.isIntersecting;
        if (entry.isIntersecting && hasScrolled.current && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate FPS counter 0→60 with easing (1.5s duration)
  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setFpsCount(Math.round(eased * 60));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  // Typewriter effect for code (30ms per character)
  useEffect(() => {
    if (!isVisible) return;

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setTypedCount(idx);
      if (idx >= TOTAL_CHARS) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [isVisible]);

  // SVG stroke: full circle = 276, target offset = 20
  // Animate from 276 (empty) → 20 (nearly full) based on fpsCount
  const strokeOffset = 276 - (fpsCount / 60) * (276 - 20);

  // Build typed code spans
  const renderTypedCode = useCallback(() => {
    if (typedCount === 0) {
      return <span className="text-slate-600">|</span>;
    }

    const segments: { cls: string; text: string }[] = [];
    for (let i = 0; i < typedCount && i < TOTAL_CHARS; i++) {
      const { char, cls } = ALL_CHARS[i];
      const last = segments[segments.length - 1];
      if (last && last.cls === cls) {
        last.text += char;
      } else {
        segments.push({ cls, text: char });
      }
    }

    return (
      <>
        {segments.map((seg, i) => (
          <span key={i} className={seg.cls}>
            {seg.text}
          </span>
        ))}
        {typedCount < TOTAL_CHARS && (
          <span className="text-primary-400 animate-pulse">|</span>
        )}
      </>
    );
  }, [typedCount]);

  return (
    <div
      ref={panelRef}
      className="w-full max-w-5xl rounded-3xl bg-slate-900 shadow-2xl shadow-primary-900/20 border border-slate-800 p-2 md:p-4 overflow-hidden relative"
    >
      {/* Window Controls */}
      <div className="flex items-center gap-2 px-4 py-3 mb-2 border-b border-slate-800">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left: Code Editor with typewriter */}
        <div className="flex-1 bg-slate-950 rounded-xl p-6 border border-slate-800/60 font-mono text-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs">app/layout.tsx</span>
            <Terminal className="w-4 h-4 text-slate-500" />
          </div>
          <pre className="text-slate-300 whitespace-pre-wrap min-h-[280px]">
            <code className="block">{renderTypedCode()}</code>
          </pre>

          {/* AI Prompt Box */}
          <div className="mt-6 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-300">
                Optimize this component for better hydration...
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 hover:bg-slate-700"
            >
              <Play className="w-4 h-4 text-primary-400" />
            </Button>
          </div>
        </div>

        {/* Right: Performance Panel with animated counter */}
        <div className="flex-1 bg-white rounded-xl p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-slate-800">Performance Metrics</h3>
            <Badge variant="success" className="bg-green-100 text-green-700">
              Live
            </Badge>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Animated FPS Circle */}
            <div className="w-32 h-32 rounded-full border-8 border-primary-100 flex flex-col items-center justify-center relative">
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-primary-500 transition-none"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 276,
                    strokeDashoffset: strokeOffset,
                  }}
                />
              </svg>
              <span className="text-3xl font-black text-slate-800 tabular-nums">
                {fpsCount}
              </span>
              <span className="text-xs font-bold text-slate-500">FPS</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 w-full">
              <div className="bg-slate-50 rounded-xl p-3 text-left">
                <span className="text-xs text-slate-500 block mb-1">
                  Time to Interactive
                </span>
                <span className="text-lg font-bold text-slate-800">0.8s</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-left">
                <span className="text-xs text-slate-500 block mb-1">
                  Bundle Size
                </span>
                <span className="text-lg font-bold text-slate-800">42kb</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
