/**
 * Nhãn phím tắt theo hệ điều hành (contract §7) — web only.
 *
 * Cùng một phím "Cmd" trên macOS là "Ctrl" trên Windows/Linux. Hiển thị sai nhãn
 * khiến người học bấm sai phím rồi tưởng player hỏng, nên nhãn phải suy ra từ
 * nền tảng chứ không hardcode "⌘".
 */

export type ShortcutPlatform = "mac" | "other";

export interface ShortcutDefinition {
  /** Mã phím theo `KeyboardEvent.code` để so khớp. */
  code: string;
  /** Ký tự hiển thị, đã theo OS. */
  label: string;
  /** Mô tả tiếng Việt cho bảng phím tắt (`?`). */
  description: string;
  /** Có phải tổ hợp giữ phím bổ trợ không (Ctrl/⌘). */
  modifier?: boolean;
}

/** Nhãn phím bổ trợ theo nền tảng. */
export function modifierLabel(platform: ShortcutPlatform): string {
  return platform === "mac" ? "⌘" : "Ctrl";
}

/** Nhãn đã bản địa hoá cho một phím đơn. */
export function keyLabel(code: string, platform: ShortcutPlatform): string {
  if (code === "Mod") return modifierLabel(platform);
  return code;
}

/** Suy nền tảng từ `navigator.platform`/`userAgent`; mặc định `other`. */
export function detectPlatform(
  nav: Pick<Navigator, "platform" | "userAgent"> | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator
): ShortcutPlatform {
  if (!nav) return "other";
  const haystack = `${nav.platform ?? ""} ${nav.userAgent ?? ""}`.toLowerCase();
  return /mac|iphone|ipad|ipod/.test(haystack) ? "mac" : "other";
}

/**
 * Bảng phím tắt của player theo contract §7.
 * `Mod` được đổi nhãn theo OS; các phím còn lại giữ nguyên ký tự.
 */
export function shortcutDefinitions(platform: ShortcutPlatform): ShortcutDefinition[] {
  interface RawShortcut extends Omit<ShortcutDefinition, "label"> {
    labelKey: string;
    shift?: boolean;
  }

  const definitions: RawShortcut[] = [
    { code: "Space", labelKey: "Space", description: "Phát / tạm dừng" },
    { code: "ArrowLeft", labelKey: "←", description: "Tua lùi 5 giây" },
    { code: "ArrowRight", labelKey: "→", description: "Tua tới 5 giây" },
    { code: "KeyJ", labelKey: "J", description: "Tua lùi 10 giây" },
    { code: "KeyL", labelKey: "L", description: "Tua tới 10 giây" },
    { code: "ArrowUp", labelKey: "↑", description: "Tăng âm lượng" },
    { code: "ArrowDown", labelKey: "↓", description: "Giảm âm lượng" },
    { code: "Comma", labelKey: ",", description: "Giảm tốc độ phát" },
    { code: "Period", labelKey: ".", description: "Tăng tốc độ phát" },
    { code: "KeyB", labelKey: "B", description: "Thêm ghi chú tại giây hiện tại" },
    { code: "KeyN", labelKey: "N", description: "Mở / đóng panel ghi chú" },
    { code: "KeyC", labelKey: "C", description: "Bật / tắt phụ đề" },
    { code: "Slash", labelKey: "?", shift: true, description: "Mở bảng phím tắt" },
  ];

  return definitions.map(({ labelKey, shift, ...rest }) => ({
    ...rest,
    label: keyLabel(labelKey, platform),
    ...(shift ? { shift: true } : {}),
  })) as ShortcutDefinition[];
}

export interface ShortcutRow {
  keys: string[];
  description: string;
}

/** Bảng phím tắt dạng hàng để render (`?`). */
export function shortcutTable(platform: ShortcutPlatform): ShortcutRow[] {
  return shortcutDefinitions(platform).map((definition) => ({
    keys: definition.modifier
      ? [modifierLabel(platform), definition.label]
      : [definition.label],
    description: definition.description,
  }));
}

/** Nhãn đầy đủ cho tooltip nút, ví dụ `Ctrl + B`. */
export function shortcutHint(code: string, platform: ShortcutPlatform): string {
  const definition = shortcutDefinitions(platform).find((d) => d.code === code);
  if (!definition) return "";
  return definition.modifier
    ? `${modifierLabel(platform)} + ${definition.label}`
    : definition.label;
}
