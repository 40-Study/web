import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        code: ["Consolas", "'Cascadia Code'", "Menlo", "Monaco", "'Courier New'", "monospace"],
        ui: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Text'", "system-ui", "sans-serif"],
      },
      colors: {
        // Primary colors - Sky/Cyan (energetic, modern, student-friendly)
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0EA5E9", // Sky-500: main primary
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        // Gamification colors
        xp: {
          DEFAULT: "#22c55e", // Green for XP
          light: "#86efac",
          dark: "#16a34a",
        },
        streak: {
          DEFAULT: "#f97316", // Orange for streaks
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
        // Semantic colors from PDF
        success: "#10B981", // PDF: emerald-500
        warning: "#F59E0B", // PDF: amber-500
        destructive: "#EF4444", // PDF: red-500
        info: "#0EA5E9", // Sky-500
        // Surface colors from PDF
        surface: "#F8FAFC", // PDF: slate-50
        foreground: "#0F172A", // PDF: slate-900
        "muted-foreground": "#475569", // PDF: slate-600
        border: "#E2E8F0", // PDF: slate-200
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      keyframes: {
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
