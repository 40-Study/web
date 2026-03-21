"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const themes: Array<{ id: Theme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const languages = [
  { id: "vi", label: "Tieng Viet" },
  { id: "en", label: "English" },
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
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Appearance
        </h2>
        <p className="text-muted-foreground">Customize how 40Study looks</p>
      </div>

      {/* Theme */}
      <Card className="p-4">
        <p className="font-medium mb-4 text-gray-900 dark:text-white">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  currentTheme === theme.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div
                  className={cn(
                    "w-full aspect-video rounded mb-3 flex items-center justify-center",
                    theme.id === "light" && "bg-white border border-gray-200",
                    theme.id === "dark" && "bg-gray-900",
                    theme.id === "system" &&
                      "bg-gradient-to-r from-white to-gray-900 border border-gray-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      theme.id === "light" && "text-yellow-500",
                      theme.id === "dark" && "text-blue-400",
                      theme.id === "system" && "text-gray-500"
                    )}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {theme.label}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Font Size */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-gray-900 dark:text-white">Font Size</p>
          <span className="text-sm text-muted-foreground">{fontSize}%</span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={handleFontSizeChange}
          min={80}
          max={150}
          step={10}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Small</span>
          <span>Normal</span>
          <span>Large</span>
        </div>
      </Card>

      {/* Language */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Language</p>
            <p className="text-sm text-muted-foreground">
              Choose your display language
            </p>
          </div>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}
