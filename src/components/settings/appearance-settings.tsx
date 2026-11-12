"use client";

import { useState } from "react";
import { Monitor, Moon, Sun, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
type Language = "vi" | "en";

interface AppearanceSettingsProps {
  initialTheme?: Theme;
  initialFontSize?: number;
  initialLanguage?: Language;
  onThemeChange?: (theme: Theme) => void;
  onFontSizeChange?: (fontSize: number) => void;
  onLanguageChange?: (language: Language) => void;
}

const themes: Array<{
  id: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
}> = [
  // Ô xem trước là mẫu của TỪNG chế độ nên dùng màu cố định (trắng/xám đậm), không dùng token đổi theo dark.
  { id: "light", label: "Sáng", icon: Sun, bg: "bg-white border border-slate-200", iconColor: "text-amber-400" },
  { id: "dark", label: "Tối", icon: Moon, bg: "bg-gray-900", iconColor: "text-blue-400" },
  {
    id: "system",
    label: "Hệ thống",
    icon: Monitor,
    bg: "bg-gradient-to-r from-white to-gray-900 border border-border",
    iconColor: "text-muted-foreground",
  },
];

/** Thang cỡ chữ: nhãn "Bình thường" phải nằm đúng vị trí 100% trên thanh trượt, không phải giữa thanh (QA3 Q13). */
const FONT_MIN = 80;
const FONT_MAX = 150;
const FONT_NORMAL = 100;
const FONT_NORMAL_PCT = ((FONT_NORMAL - FONT_MIN) / (FONT_MAX - FONT_MIN)) * 100;

const languages = [
  { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { id: "en", label: "English", flag: "🇬🇧" },
];

export function AppearanceSettings({
  initialTheme = "system",
  initialFontSize = 100,
  initialLanguage = "vi",
  onThemeChange,
  onFontSizeChange,
  onLanguageChange,
}: AppearanceSettingsProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialTheme);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const selectedLanguage = languages.find((l) => l.id === language);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    onThemeChange?.(theme);
  };

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
    onFontSizeChange?.(value[0]);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
    onLanguageChange?.(value as Language);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Giao diện</h2>
        <p className="text-sm text-muted-foreground mt-1">Tuỳ chỉnh giao diện ForteX theo ý bạn</p>
      </div>

      {/* Theme */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <p className="font-medium text-foreground mb-4">Chủ đề</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleThemeChange(theme.id)}
                className={cn(
                  "relative p-4 rounded-2xl border-2 transition-all duration-200",
                  isActive
                    ? "border-primary-500 bg-primary-50 shadow-md shadow-primary-100 dark:bg-primary-500/10"
                    : "border-border hover:border-border hover:shadow-sm"
                )}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 p-1 bg-primary-500 rounded-full">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn("w-full aspect-video rounded-xl mb-3 flex items-center justify-center", theme.bg)}
                >
                  <Icon className={cn("h-6 w-6", theme.iconColor)} />
                </div>
                <p className="text-sm font-medium text-foreground">{theme.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-foreground">Cỡ chữ</p>
          <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full dark:text-primary-400 dark:bg-primary-500/10">
            {fontSize}%
          </span>
        </div>
        <Slider value={[fontSize]} onValueChange={handleFontSizeChange} min={FONT_MIN} max={FONT_MAX} step={10} />
        <div className="relative mt-2 h-4 px-1 text-xs text-muted-foreground" data-testid="font-scale-labels">
          <span className="absolute left-1">Nhỏ</span>
          <span
            data-testid="font-scale-normal"
            className="absolute -translate-x-1/2"
            style={{ left: `${FONT_NORMAL_PCT}%` }}
          >
            Bình thường
          </span>
          <span className="absolute right-1">Lớn</span>
        </div>
      </div>

      {/* Language */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Ngôn ngữ</p>
            <p className="text-sm text-muted-foreground">Chọn ngôn ngữ hiển thị</p>
          </div>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-44 rounded-xl" aria-label="Ngôn ngữ hiển thị">
              {/* SelectItem chứa <span> nên Select không tự tra được nhãn: hiện nhãn tường minh thay vì mã "vi" */}
              <span>{selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.label}` : language}</span>
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    {lang.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
