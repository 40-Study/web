"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { LANGUAGES, BOILERPLATES } from "./config/languages";
import { THEMES } from "./config/themes";
import { getActiveTab, makeDefaultEditorState, langFromFilename } from "./lib/editorHelpers";
import { apiGetFile, apiSaveFile } from "./api/filesApi";
import { useToast } from "./hooks/useToast";
import { useCodeRunner } from "./hooks/useCodeRunner";
import TitleBar     from "./TitleBar";
import Sidebar      from "./Sidebar";
import EditorGroup  from "./EditorGroup";
import SplitView    from "./SplitView";
import OutputPanel  from "./OutputPanel";
import StatusBar    from "./StatusBar";
import SaveDialog   from "./SaveDialog";
import Toast        from "./Toast";
import type {
  ThemeKey, Language, FileEntry,
  SplitDirection, EditorState, TabItem,
} from "./types";

// ─── Global CSS ──────────────────────────────────────────────────────────────
const GLOBAL_CSS = (scrollThumb: string, dark: boolean, accent: string, selectBg: string, text: string) => `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --font-mono: 'Consolas','Cascadia Code','Menlo','Monaco','Courier New',monospace; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${scrollThumb}; border-radius: 0; }
  ::-webkit-scrollbar-thumb:hover { background: ${dark ? "#555" : "#aaa"}; }
  @keyframes toastIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .frow { border-radius: 6px; }
  .frow:hover { background: ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} !important; }
  .frow.sel  { background: ${dark ? accent + "28" : accent + "18"} !important; }
  .ibtn:hover { background: ${dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)"} !important; }
  select option { background: ${selectBg}; color: ${text}; }
  textarea:focus, input:focus, select:focus { outline: none; }
`;


// ─── Main component ───────────────────────────────────────────────────────────
export default function CodeEditor() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [themeKey, setThemeKey] = useState<ThemeKey>("dark");
  const T    = THEMES[themeKey];
  const dark = themeKey === "dark";

  // ── Split layout ───────────────────────────────────────────────────────────
  const [splitDirection, setSplitDirection] = useState<SplitDirection | null>(null);
  const [activePane, setActivePane] = useState<0 | 1>(0);

  // ── Pane states ───────────────────────────────────────────────────────────
  const [pane0, setPane0] = useState<EditorState>(() => makeDefaultEditorState(LANGUAGES[0]));
  const [pane1, setPane1] = useState<EditorState>(() => ({ tabs: [], activeTabId: "" }));

  // Stable setActiveState — does not change when activePane changes
  const activePaneRef = useRef(activePane);
  activePaneRef.current = activePane;
  const pane0Ref = useRef(pane0); pane0Ref.current = pane0;
  const pane1Ref = useRef(pane1); pane1Ref.current = pane1;

  const setActiveState = useCallback((updater: (s: EditorState) => EditorState) => {
    if (activePaneRef.current === 0) setPane0(updater);
    else setPane1(updater);
  }, []);

  const activeState = activePane === 0 ? pane0 : pane1;
  const activeTab   = getActiveTab(activeState);   // null when all tabs closed
  // currentFile is null for untitled tabs
  const currentFileName = activeTab?.filePath ? activeTab.fileName : null;

  // ── Shared lang (active pane) ──────────────────────────────────────────────
  const setLang = useCallback((l: Language) => {
    setActiveState((s) => ({
      ...s,
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId
          ? { ...t, lang: l, code: t.filePath ? t.code : (BOILERPLATES[l.id] || "") }
          : t
      ),
    }));
  }, [setActiveState]);

  // ── stdin / output (shared terminal) ────────────────────────────────────────
  const [stdin, setStdin] = useState("");
  const { running, result, setResult, runCode: executeCode } = useCodeRunner();

  // ── Sidebar / Files ────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [sidebarWidth, setSidebarWidth]     = useState(210);
  const [currentPath, setCurrentPath]       = useState("");
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  // ── Save dialog ────────────────────────────────────────────────────────────
  const [saving, setSaving]             = useState(false);
  const [saveDialog, setSaveDialog]     = useState(false);
  const [saveFileName, setSaveFileName] = useState("");

  // ── Output panel height ────────────────────────────────────────────────────
  const [outputH, setOutputH] = useState(180);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const { toast, setToast, showToast } = useToast();

  // ── Open file (được gọi từ Sidebar với folderPath đầy đủ) ────────────────
  const openFile = useCallback(async (f: FileEntry, folderPath: string) => {
    const filePath = folderPath ? `${folderPath}/${f.name}` : f.name;
    setCurrentPath(folderPath);

    // If already open in this pane → just switch to that tab
    const currentState = activePaneRef.current === 0 ? pane0Ref.current : pane1Ref.current;
    const existing = currentState.tabs.find((t: TabItem) => t.filePath === filePath);
    if (existing) {
      setActiveState((s) => ({ ...s, activeTabId: existing.id }));
      return;
    }

    const lang = langFromFilename(f.name);
    let code   = BOILERPLATES[lang.id] || "";

    try { code = await apiGetFile(filePath); } catch {}

    const newTab: TabItem = {
      id: `tab-${Date.now()}`,
      fileName: f.name,
      filePath,
      code,
      lang,
    };

    setActiveState((s) => ({ tabs: [...s.tabs, newTab], activeTabId: newTab.id }));
    showToast(`Opened ${f.name}`, "success");
  }, [setActiveState, showToast]);

  // ── Save file ──────────────────────────────────────────────────────────────
  const saveFile = useCallback(async () => {
    const tab = getActiveTab(activePaneRef.current === 0 ? pane0Ref.current : pane1Ref.current);
    if (!tab) return;
    const fn  = saveFileName.trim() || tab.fileName;
    const fp  = currentPath ? `${currentPath}/${fn}` : fn;
    setSaving(true);
    try {
      await apiSaveFile(fp, tab.code);
      showToast(`Saved ${fn}`, "success");
    } catch {
      showToast(`Saved ${fn} (demo)`, "info");
    }
    setActiveState((s) => ({
      ...s,
      tabs: s.tabs.map((t) =>
        t.id === s.activeTabId ? { ...t, fileName: fn, filePath: fp } : t
      ),
    }));
    setSaveDialog(false);
    setSaving(false);
    setSidebarRefreshTrigger((n) => n + 1);
  }, [saveFileName, currentPath, setActiveState, showToast]);

  // ── Run code (delegates to useCodeRunner hook) ───────────────────────────
  const runCode = useCallback(() => {
    const tab = getActiveTab(activePaneRef.current === 0 ? pane0Ref.current : pane1Ref.current);
    if (tab) executeCode(tab.lang.id, tab.code, stdin);
  }, [executeCode, stdin]);

  // ── Output resize ──────────────────────────────────────────────────────────
  const startDragOutput = useCallback((e: React.MouseEvent) => {
    const y0 = e.clientY;
    const h0 = outputH;
    const mv = (ev: MouseEvent) => setOutputH(Math.max(80, Math.min(520, h0 + (y0 - ev.clientY))));
    const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  }, [outputH]);

  // ── Sidebar resize ─────────────────────────────────────────────────────────
  const startDragSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = sidebarWidth;
    const mv = (ev: MouseEvent) => setSidebarWidth(Math.max(120, Math.min(500, w0 + (ev.clientX - x0))));
    const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  }, [sidebarWidth]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        const tab = getActiveTab(activePaneRef.current === 0 ? pane0Ref.current : pane1Ref.current);
        if (!tab) return;
        setSaveFileName(tab.filePath ? tab.fileName : `untitled${tab.lang.ext}`);
        setSaveDialog(true);
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
      if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        setSplitDirection((d) => (d === "vertical" ? null : "vertical"));
      }
      if (e.ctrlKey && e.shiftKey && e.key === "|") {
        e.preventDefault();
        setSplitDirection((d) => (d === "horizontal" ? null : "horizontal"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeState, runCode]);

  // ── Drag-tab-to-split ─────────────────────────────────────────────────────
  /**
   * fromPane: pane the tab came from
   * tabId:    the tab being dragged
   * toPane:   destination pane (may be same or different)
   *
   * Behaviour:
   *  - If fromPane === toPane → no-op (reorder within same pane, not implemented)
   *  - If toPane is the "other" pane:
   *      • Auto-open split if not already split
   *      • Move tab from source pane to dest pane
   *      • If source pane becomes empty keep it (user can see empty state)
   */
  const handleDropTab = useCallback((fromPane: 0 | 1, tabId: string, toPane: 0 | 1) => {
    if (fromPane === toPane) return;

    const srcRef = fromPane === 0 ? pane0Ref : pane1Ref;
    const tab = srcRef.current.tabs.find((t: TabItem) => t.id === tabId);
    if (!tab) return;

    const srcWillBeEmpty = srcRef.current.tabs.length <= 1;

    if (srcWillBeEmpty) {
      // Merge everything into pane0 and close split
      if (fromPane === 0) {
        // pane0 losing its last tab → move pane1 content + tab into pane0
        const p1tabs = pane1Ref.current.tabs;
        setPane0(() => ({ tabs: [...p1tabs, tab], activeTabId: tab.id }));
      } else {
        // pane1 losing its last tab → add tab to pane0
        setPane0((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      }
      setPane1({ tabs: [], activeTabId: "" });
      setSplitDirection(null);
      setActivePane(0);
    } else {
      // Normal move — source still has tabs remaining
      const removeSrc = (s: EditorState): EditorState => {
        const newTabs = s.tabs.filter((t) => t.id !== tabId);
        const closedIdx = s.tabs.findIndex((t) => t.id === tabId);
        const newActiveId =
          s.activeTabId === tabId
            ? (newTabs[Math.min(closedIdx, newTabs.length - 1)]?.id ?? newTabs[0]?.id ?? "")
            : s.activeTabId;
        return { tabs: newTabs, activeTabId: newActiveId };
      };
      const addDest = (s: EditorState): EditorState => ({ tabs: [...s.tabs, tab], activeTabId: tab.id });

      if (fromPane === 0) { setPane0(removeSrc); setPane1(addDest); }
      else               { setPane1(removeSrc); setPane0(addDest); }

      setSplitDirection((d) => d ?? "vertical");
      setActivePane(toPane);
    }
  }, []);

  // ── Close split ────────────────────────────────────────────────────────────
  const handleCloseSplit = useCallback(() => {
    // Merge pane1 tabs into pane0 before closing
    const p1 = pane1Ref.current;
    if (p1.tabs.length > 0) {
      setPane0((s) => ({
        tabs: [...s.tabs, ...p1.tabs],
        activeTabId: s.activeTabId || p1.activeTabId || p1.tabs[0]?.id || "",
      }));
    }
    setSplitDirection(null);
    setActivePane(0);
    setPane1({ tabs: [], activeTabId: "" });
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const lineCount = activeTab?.code.split("\n").length ?? 1;

  const sharedGroupProps = { T, dark };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        height: "100vh", background: T.bg, color: T.text,
        fontFamily: "var(--font-mono)", fontSize: 13, overflow: "hidden",
      }}
    >
      <style suppressHydrationWarning>{GLOBAL_CSS(T.scrollThumb, dark, T.accent, T.selectBg, T.text)}</style>

      <TitleBar
        T={T} dark={dark}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        lang={activeTab?.lang ?? LANGUAGES[0]} setLang={setLang}
        currentPath={currentPath} currentFile={currentFileName}
        setThemeKey={setThemeKey as any}
        setSaveDialog={setSaveDialog}
        setSaveFileName={setSaveFileName}
        runCode={runCode} running={running}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          T={T} dark={dark}
          sidebarOpen={sidebarOpen}
          sidebarWidth={sidebarWidth}
          currentFile={currentFileName}
          activeFilePath={activeTab?.filePath ?? ""}
          onOpenFile={openFile}
          refreshTrigger={sidebarRefreshTrigger}
          onStartDragResize={startDragSidebar}
        />

        {/* Column: editors (top, flex 1) + shared terminal (bottom) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {splitDirection ? (
          <SplitView
            direction={splitDirection}
            T={T} dark={dark}
            initialRatio={50}
            onClose={handleCloseSplit}
            first={
              <EditorGroup
                {...sharedGroupProps}
                paneId={0}
                onSplitDrop={handleDropTab}
                state={pane0}
                setState={setPane0}
                focused={activePane === 0}
                onFocus={() => setActivePane(0)}
              />
            }
            second={
              <EditorGroup
                {...sharedGroupProps}
                paneId={1}
                onSplitDrop={handleDropTab}
                onEmpty={handleCloseSplit}
                state={pane1}
                setState={setPane1}
                focused={activePane === 1}
                onFocus={() => setActivePane(1)}
              />
            }
          />
        ) : (
          <EditorGroup
            {...sharedGroupProps}
            paneId={0}
            onSplitDrop={handleDropTab}
            state={pane0}
            setState={setPane0}
            focused={true}
            onFocus={() => setActivePane(0)}
          />
        )}

        {/* ── Shared output resize handle ──────────────────────────── */}
        <div
          onMouseDown={startDragOutput}
          style={{ height: 4, background: T.border, cursor: "row-resize", flexShrink: 0, transition: "background .1s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.border)}
        />

        {/* ── Shared terminal ──────────────────────────────────────── */}
        <OutputPanel
          T={T} dark={dark}
          stdin={stdin} setStdin={setStdin}
          running={running} result={result} setResult={setResult}
          height={outputH}
        />
        </div>{/* end column wrapper */}
      </div>

      <StatusBar
        T={T} dark={dark}
        currentPath={currentPath}
        lang={activeTab?.lang ?? LANGUAGES[0]}
        lineCount={lineCount}
        setThemeKey={setThemeKey as any}
      />

      {saveDialog && (
        <SaveDialog
          T={T}
          currentPath={currentPath}
          saveFileName={saveFileName}
          setSaveFileName={setSaveFileName}
          saving={saving}
          saveFile={saveFile}
          setSaveDialog={setSaveDialog}
          lang={activeTab?.lang ?? LANGUAGES[0]}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
