import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Only apply dark mode when .dark class is present
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // Heading/display: Plus Jakarta Sans (có subset vietnamese), rơi về Inter nếu font chưa nạp.
        heading: ["var(--font-heading)", "var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-heading)", "var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // 'Geist Mono' chưa từng được nạp -> dùng system mono stack (không thêm package).
        code: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        ui: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Text'", "system-ui", "sans-serif"],
      },
      colors: {
        // Educational Platform - Clean Blue & White
        primary: {
          // DEFAULT đọc từ --primary (blue-600, trắng/blue-600 = 5.17:1 đạt AA);
          // <alpha-value> để dùng được ring-primary/40, bg-primary/10...
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        // Cool slate for neutral tones
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Gamification colors — DEFAULT dùng được làm chữ/nền chip có chữ trắng:
        // green-700 (5.02:1) / orange-700 (5.18:1) trên trắng. `light` dành cho nền tối.
        xp: {
          DEFAULT: "#15803d",
          light: "#86efac",
          dark: "#166534",
        },
        streak: {
          DEFAULT: "#c2410c",
          light: "#fdba74",
          dark: "#9a3412",
        },
        achievement: {
          gold: "#fbbf24",
          silver: "#9ca3af",
          bronze: "#d97706",
        },
        league: {
          bronze: "#cd7f32",
          silver: "#c0c0c0",
          gold: "#ffd700",
          diamond: "#00d4ff",
          champion: "#9333ea",
        },
        // Semantic colors
        success: "#10B981",
        warning: "#F59E0B",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        info: "#0EA5E9",
        surface: "#f5f5f5",

        // Design-system tokens — đọc từ biến CSS trong globals.css (:root / .dark)
        // để mọi class bg-*/text-*/border-* đổi màu đúng theo dark mode (H-01/H-02/H-03).
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        border: "hsl(var(--border))",
      },
      borderRadius: {
        // Thang radius: control 10px (lg) · card 16px (2xl / card) · modal 24px (3xl) · pill.
        lg: "var(--radius)", // 10px — Button, Input, Select, Textarea
        md: "calc(var(--radius) - 2px)", // 8px
        sm: "calc(var(--radius) - 4px)", // 6px
        pill: "9999px",
        // Key cũ giữ lại cho tương thích, giá trị đã căn theo thang mới.
        "warm-btn": "var(--radius)",
        card: "1rem", // 16px
        "card-lg": "1.5rem", // 24px
        section: "1.5rem", // 24px
      },
      // 4 cấp elevation duy nhất (giá trị ở globals.css, tự đổi theo dark mode):
      // xs (input/nút) · card · raised (hover card, popover) · overlay (modal).
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        overlay: "var(--shadow-overlay)",
        // Alias giữ cho 2 chỗ dùng ở header.tsx.
        subtle: "var(--shadow-card)",
      },
      letterSpacing: {
        "body": "0.16px",
        "body-wide": "0.18px",
      },
      fontSize: {
        // Tiếng Việt có dấu chồng: body >= 1.5, heading >= 1.15 (tránh cắt dấu).
        xs: ["0.75rem", { lineHeight: "1.125rem" }], // 12/18
        sm: ["0.875rem", { lineHeight: "1.375rem" }], // 14/22
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.75rem" }], // 36/44 (trước 40 = 1.11)
        "5xl": ["3rem", { lineHeight: "3.5rem" }], // 48/56 (trước 1 = 1.0)
      },
      animation: {
        "float-up": "float-up 1s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "bounce-in": "bounce-in 0.5s ease-out",
        shake: "shake 0.5s ease-in-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-up": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(1.2)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(251, 191, 36, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(251, 191, 36, 0.8)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
