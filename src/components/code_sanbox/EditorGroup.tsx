"use client";
import { memo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
const EditorPane = dynamic(() => import("./EditorPane"), { ssr: false });
import { fileIconData } from "./lib/fileIcons";
import { BOILERPLATES, LANGUAGES } from "./config/languages";
import type { Theme, EditorState, TabItem } from "./types";

interface Props {
  T: Theme;
  dark: boolean;
  paneId: 0 | 1;
  state: EditorState;
  setState: (updater: (s: EditorState) => EditorState) => void;
  /** Called when a tab is dropped onto the right-half drop zone of this pane */
  onSplitDrop: (fromPane: 0 | 1, tabId: string, toPane: 0 | 1) => void;
  /** Called when the last tab in this pane is closed */
  onEmpty?: () => void;
  focused: boolean;
  onFocus: () => void;
}

const DRAG_KEY = "code-editor-drag";

const EditorGroup = memo(({  T, dark, paneId, state, setState,
  onSplitDrop, onEmpty,
  focused, onFocus,
}: Props) => {
  // drag-over-right-half indicator
  const [dropSide, setDropSide] = useState<"right" | "left" | null>(null);

  const activeTab: TabItem =
    state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0];

  const setCode = useCallback((code: string) => {
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === s.activeTabId ? { ...t, code } : t)),
    }));
  }, [setState]);

  const switchTab = useCallback((id: string) => {
    setState((s) => ({ ...s, activeTabId: id }));
  }, [setState]);

  const closeTab = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState((s) => {
      const newTabs = s.tabs.filter((t) => t.id !== id);
      if (newTabs.length === 0) {
        // defer so setState finishes before parent callback
        setTimeout(() => onEmpty?.(), 0);
        return { tabs: [], activeTabId: "" };
      }
      const closedIdx = s.tabs.findIndex((t) => t.id === id);
      const newActiveId =
        s.activeTabId === id
          ? (newTabs[Math.min(closedIdx, newTabs.length - 1)]?.id ?? newTabs[0].id)
          : s.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    });
  }, [setState, onEmpty]);

  const newTab = useCallback(() => {
    const lang = LANGUAGES[0];
    const uid = `untitled-${Date.now()}`;
    setState((s) => ({
      tabs: [...s.tabs, { id: uid, fileName: `untitled${lang.ext}`, filePath: "", code: BOILERPLATES[lang.id] || "", lang }],
      activeTabId: uid,
    }));
  }, [setState]);

  // ── Drag helpers ───────────────────────────────────────────────────────────
  const onTabDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ fromPane: paneId, tabId }));
    // ghost image
    const el = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  }, [paneId]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_KEY)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const side = e.clientX > rect.left + rect.width * 0.5 ? "right" : "left";
    setDropSide(side);
  }, []);

  const onDragLeave = useCallback(() => setDropSide(null), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    setDropSide(null);
    if (!e.dataTransfer.types.includes(DRAG_KEY)) return;
    e.preventDefault();
    try {
      const { fromPane, tabId } = JSON.parse(e.dataTransfer.getData(DRAG_KEY)) as {
        fromPane: 0 | 1;
        tabId: string;
      };
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const side = e.clientX > rect.left + rect.width * 0.5 ? "right" : "left";
      // drop on opposite side → split
      if (side === "right") {
        onSplitDrop(fromPane, tabId, paneId === 0 ? 1 : 0);
      } else {
        // drop on same pane left half → bring here (move tab here)
        onSplitDrop(fromPane, tabId, paneId);
      }
    } catch {}
  }, [onSplitDrop, paneId]);

  if (!activeTab) {
    return (
      <div
        onClick={onFocus}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          flex: 1, display: "flex", position: "relative",
          alignItems: "center", justifyContent: "center",
          background: T.bg, color: T.textMuted,
        }}
      >
        {/* Drop overlay on empty pane */}
        {dropSide && (
          <div style={{
            position: "absolute", inset: 0,
            left: dropSide === "right" ? "50%" : 0,
            right: dropSide === "left" ? "50%" : 0,
            background: `${T.accent}28`,
            border: `2px solid ${T.accent}`,
            borderRadius: 4, pointerEvents: "none", zIndex: 10,
          }} />
        )}
        <div style={{ textAlign: "center" }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none"
            style={{ marginBottom: 20, opacity: 0.25, display: "block", margin: "0 auto 20px" }}>
            <rect x="3" y="3" width="50" height="50" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="6 3" />
            <path d="M14 18h28M14 28h18M14 38h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 15, color: T.text, marginBottom: 8, fontWeight: 500 }}>No editor is open</div>
          <div style={{ fontSize: 12, marginBottom: 20 }}>Open a file from the explorer or create a new one</div>
          <button
            onClick={newTab}
            style={{
              background: `${T.accent}22`,
              border: `1px solid ${T.accent}66`,
              color: T.accent, cursor: "pointer",
              padding: "6px 20px", borderRadius: 4,
              fontSize: 12, fontFamily: "var(--font-mono)",
            }}
          >
            + New File
          </button>
          <div style={{ marginTop: 24, fontSize: 11, color: T.textMuted, lineHeight: 2 }}>
            <div>Ctrl+S &nbsp;&middot;&nbsp; Save</div>
            <div>Ctrl+Enter &nbsp;&middot;&nbsp; Run</div>
            <div>Ctrl+\ &nbsp;&middot;&nbsp; Split vertical</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onFocus}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", position: "relative",
      }}
    >
      {/* Drop preview overlay */}
      {dropSide && (
        <div style={{
          position: "absolute",
          top: 0, bottom: 0,
          left: dropSide === "right" ? "50%" : 0,
          right: dropSide === "left" ? "50%" : 0,
          background: `${T.accent}22`,
          border: `2px solid ${T.accent}`,
          borderRadius: 4, pointerEvents: "none", zIndex: 10,
        }} />
      )}
      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex", alignItems: "flex-end",
          background: T.tabInactive,
          borderBottom: `1px solid ${T.border}`,
          overflowX: "auto", flexShrink: 0, height: 35,
          scrollbarWidth: "none",
        }}
      >
        {state.tabs.map((tab) => {
          const isActive = tab.id === state.activeTabId;
          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => onTabDragStart(e, tab.id)}
              onClick={(e) => { e.stopPropagation(); switchTab(tab.id); onFocus(); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 10px", height: "100%",
                background: isActive ? T.tabActive : T.tabInactive,
                borderTop: `2px solid ${isActive ? T.tabBorder : "transparent"}`,
                borderRight: `1px solid ${T.border}`,              borderRadius: "6px 6px 0 0",                cursor: "pointer", flexShrink: 0,
                color: isActive ? T.text : T.textDim,
                fontSize: 12, userSelect: "none",
                transition: "background .1s",
              }}
            >
              {/* SVG file icon */}
              <span
                dangerouslySetInnerHTML={{ __html: fileIconData(tab.fileName).svg }}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.55 }}
              />
              <span style={{
                maxWidth: 110, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {tab.fileName}
              </span>
              <span
                onClick={(e) => closeTab(e, tab.id)}
                title="Close"
                style={{
                  color: T.textMuted, cursor: "pointer",
                  fontSize: 15, lineHeight: 1,
                  flexShrink: 0, padding: "0 2px",
                  borderRadius: 2, opacity: 0.7,
                }}
              >
                ×
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Editor – key resets scroll on tab switch ──────────── */}
      <EditorPane
        key={activeTab.id}
        T={T} dark={dark}
        code={activeTab.code}
        setCode={setCode}
        lang={activeTab.lang}
        focused={focused}
        onFocus={onFocus}
      />


    </div>
  );
});
EditorGroup.displayName = "EditorGroup";
export default EditorGroup;
