import { LANGUAGES, BOILERPLATES } from "../config/languages";
import type { EditorState, Language, TabItem } from "../types";

export function getActiveTab(state: EditorState): TabItem | null {
  if (state.tabs.length === 0) return null;
  return state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0];
}

export function makeDefaultEditorState(lang: Language): EditorState {
  return {
    tabs: [{
      id: "untitled",
      fileName: `untitled${lang.ext}`,
      filePath: "",
      code: BOILERPLATES[lang.id] || "",
      lang,
    }],
    activeTabId: "untitled",
  };
}

/** Map file extension → Language id */
export const EXT_TO_LANG_ID: Record<string, number> = {
  py: 71, js: 63, cpp: 54, cc: 54, cxx: 54, c: 50, sql: 82, html: 0, htm: 0,
};

/** Resolve Language from a filename, falling back to LANGUAGES[0] */
export function langFromFilename(filename: string): Language {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const lid = EXT_TO_LANG_ID[ext];
  return (lid !== undefined ? LANGUAGES.find((x) => x.id === lid) : null) ?? LANGUAGES[0];
}
