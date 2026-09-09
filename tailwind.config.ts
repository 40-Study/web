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
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"], // Light weight for display
        code: ["'Geist Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        ui: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Text'", "system-ui", "sans-serif"],
      },
      colors: {
        // Educational Platform - Clean Blue & White
        primary: {
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
        // Gamification colors
        xp: {
          DEFAULT: "#22c55e",
          light: "#86efac",
          dark: "#16a34a",
        },
        streak: {
          DEFAULT: "#f97316",
          light: "#fdba74",
          dark: "#ea580c",
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
        // Surface colors - ElevenLabs style
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // ElevenLabs style
        pill: "9999px",
        "warm-btn": "30px",
        card: "16px",
        "card-lg": "20px",
        section: "24px",
      },
      boxShadow: {
        // ElevenLabs multi-layer shadow system
        "inset-border": "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
        "outline-ring": "rgba(0,0,0,0.06) 0px 0px 0px 1px",
        "soft-elevation": "rgba(0,0,0,0.04) 0px 4px 4px",
        "card": "rgba(0,0,0,0.4) 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 4px",
        "warm": "rgba(78,50,23,0.04) 0px 6px 16px",
        "warm-lg": "rgba(78,50,23,0.06) 0px 8px 24px",
        "subtle": "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px",
      },
      letterSpacing: {
        "body": "0.16px",
        "body-wide": "0.18px",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
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
