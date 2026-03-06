export interface Language {
  id: number;
  name: string;
  ext: string;
  monacoLang?: string;
}

export interface FileEntry {
  name: string;
  isFolder: boolean;
  size?: number;
}

export interface JudgeResult {
  status?: { id: number; description: string };
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  time?: string;
  memory?: number;
}

export interface ToastData {
  message: string;
  type: "success" | "error" | "info";
}

export interface Theme {
  bg: string;
  sidebar: string;
  panel: string;
  titlebar: string;
  tabActive: string;
  tabInactive: string;
  tabBorder: string;
  border: string;
  text: string;
  textDim: string;
  textMuted: string;
  accent: string;
  runBtn: string;
  runHover: string;
  success: string;
  error: string;
  inputBg: string;
  selectBg: string;
  statusBar: string;
  lineNum: string;
  scrollThumb: string;
  folderIcon: string;
}

export type ThemeKey = "dark" | "light";

export interface TabItem {
  id: string;
  /** Display name, e.g. "main.py" */
  fileName: string;
  /** Full API path, empty string = untitled */
  filePath: string;
  code: string;
  lang: Language;
}

export interface EditorState {
  tabs: TabItem[];
  activeTabId: string;
}

export type SplitDirection = "horizontal" | "vertical";
