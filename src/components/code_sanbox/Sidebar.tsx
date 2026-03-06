"use client";
import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { fileIconData } from "./lib/fileIcons";
import { useFileTree } from "./hooks/useFileTree";
import { useFileCRUD } from "./hooks/useFileCRUD";
import type { Theme, FileEntry } from "./types";



interface CtxState {
  x: number; y: number;
  /** null = right-clicked on background */
  fullPath: string | null;
  name: string;
  isFolder: boolean;
  parentPath: string;
}

interface Props {
  T: Theme;
  dark: boolean;
  sidebarOpen: boolean;
  sidebarWidth: number;
  currentFile: string | null;
  activeFilePath: string;
  onOpenFile: (f: FileEntry, folderPath: string) => void;
  refreshTrigger?: number;
  onStartDragResize: (e: React.MouseEvent) => void;
}

// ── macOS-style context menu ──────────────────────────────────────────────────
interface CtxItemDef { label?: string; action?: () => void; danger?: boolean; separator?: true; }

function ContextMenu({ ctx, items, dark, T, onClose }: {
  ctx: CtxState; items: CtxItemDef[]; dark: boolean; T: Theme; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    const down = (e: MouseEvent) => {
      if (!active) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // slight delay so the right-click that opened the menu doesn't immediately close it
    const t = setTimeout(() => {
      window.addEventListener("mousedown", down, true);
      window.addEventListener("keydown", key);
    }, 80);
    return () => { active = false; clearTimeout(t); window.removeEventListener("mousedown", down, true); window.removeEventListener("keydown", key); };
  }, [onClose]);

  const bg   = dark ? "rgba(40,40,44,0.97)"   : "rgba(248,248,250,0.97)";
  const bdr  = dark ? "1px solid rgba(255,255,255,0.11)" : "1px solid rgba(0,0,0,0.09)";
  const shad = dark ? "0 10px 40px rgba(0,0,0,0.6),0 2px 10px rgba(0,0,0,0.35)" : "0 10px 40px rgba(0,0,0,0.18),0 2px 10px rgba(0,0,0,0.1)";

  return (
    <div ref={ref} style={{
      position: "fixed", top: ctx.y, left: ctx.x, zIndex: 99999,
      minWidth: 196,
      background: bg, backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
      boxShadow: shad, border: bdr, borderRadius: 10, padding: "4px 0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
      fontSize: 13, userSelect: "none",
    }}>
      {items.map((item, i) => {
        if (item.separator) return (
          <div key={i} style={{ height: 1, margin: "3px 10px", background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
        );
        const isDanger = item.danger ?? false;
        const baseColor = isDanger ? (dark ? "#FF6B6B" : "#FF3B30") : (dark ? "#e5e5ea" : "#1c1c1e");
        return (
          <div
            key={i}
            onClick={() => { item.action?.(); onClose(); }}
            style={{ padding: "5px 14px", cursor: "default", borderRadius: 6, margin: "1px 4px", color: baseColor }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.accent; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = baseColor; }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({
  T, dark, sidebarOpen, sidebarWidth, currentFile, activeFilePath,
  onOpenFile, refreshTrigger = 0, onStartDragResize,
}: Props) {
  // ── Tree and CRUD state (delegated to custom hooks) ─────────────────────
  const {
    folderMap, expanded, loadFolder, toggleFolder,
    mutateFolder, addFolderEntry, expandFolder, removeFolderBranch,
  } = useFileTree(refreshTrigger, activeFilePath);

  const {
    creating, setCreating, createValue, setCreateValue,
    createInputRef, commitCreate, startCreate,
    renamingPath, setRenamingPath, renameValue, setRenameValue,
    renameInputRef, commitRename, startRename,
    handleDelete,
  } = useFileCRUD({ mutateFolder, addFolderEntry, expandFolder, removeFolderBranch, loadFolder });

  // ── UI-only state ─────────────────────────────────────────────────────────
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [ctxMenu,     setCtxMenu]     = useState<CtxState | null>(null);

  const closeCtx = useCallback(() => setCtxMenu(null), []);
  const openCtx  = useCallback((e: React.MouseEvent, item: Omit<CtxState, "x" | "y">) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth  - 210);
    const y = Math.min(e.clientY, window.innerHeight - 230);
    setCtxMenu({ x, y, ...item });
  }, []);

  // ── Tree renderer ─────────────────────────────────────────────────────────
  const renderTree = (folderPath: string, depth: number): ReactNode => {
    const data = folderMap[folderPath];
    if (!data) return null;
    if (data.loading) return (
      <div style={{ padding: `3px 12px 3px ${14 + depth * 14}px`, fontSize: 11, color: T.textMuted, fontStyle: "italic" }}>
        Loading…
      </div>
    );

    const pl = 10 + depth * 14;

    const createRow = creating?.parentPath === folderPath ? (
      <div key="__create__" style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: `3px 6px 3px ${pl}px`,
        margin: "1px 4px", borderRadius: 6,
        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      }}>
        {/* chevron placeholder */}
        <span style={{ width: 10, flexShrink: 0 }}/>
        {/* icon */}
        {creating.type === "folder" ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M0 4.5A1.5 1.5 0 011.5 3h4.086a1.5 1.5 0 011.06.44l.915.914A1.5 1.5 0 008.62 4.5H14.5A1.5 1.5 0 0116 6v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 010 13V4.5z" fill={T.folderIcon}/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M4 0h5.293L13 3.707V15a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1z" fill={T.accent + "33"} stroke={T.accent + "88"} strokeWidth="1"/>
          </svg>
        )}
        <input
          ref={createInputRef}
          value={createValue}
          onChange={(e) => setCreateValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitCreate(); }
            if (e.key === "Escape") { setCreating(null); setCreateValue(""); }
          }}
          onBlur={commitCreate}
          placeholder={creating.type === "folder" ? "folder name" : "file.py"}
          style={{
            flex: 1,
            background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
            border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
            boxShadow: `0 0 0 2px ${T.accent}44`,
            color: T.text, fontSize: 12.5,
            padding: "2px 7px", borderRadius: 5,
            fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          }}
        />
      </div>
    ) : null;

    if (data.loaded && data.children.length === 0 && !createRow) {
      if (depth === 0) return null;
      return (
        <div style={{ padding: `2px 8px 2px ${pl + 20}px`, fontSize: 11, color: T.textMuted, fontStyle: "italic" }}>
          empty
        </div>
      );
    }

    return (
      <>
        {createRow}
        {data.children.map((f, i) => {
          const fullPath   = folderPath ? `${folderPath}/${f.name}` : f.name;
          const isOpen     = f.isFolder && expanded.has(fullPath);
          const isActive   = !f.isFolder && activeFilePath === fullPath;
          const isHov      = hoveredPath === fullPath;
          const icon       = f.isFolder ? null : fileIconData(f.name);
          const isRenaming = renamingPath === fullPath;

          return (
            <div key={`${fullPath}-${i}`}>
              <div
                className={`frow${isActive ? " sel" : ""}`}
                onClick={() => !isRenaming && (f.isFolder ? toggleFolder(fullPath) : onOpenFile(f, folderPath))}
                onContextMenu={(e) => openCtx(e, { fullPath, name: f.name, isFolder: f.isFolder, parentPath: folderPath })}
                onMouseEnter={() => setHoveredPath(fullPath)}
                onMouseLeave={() => setHoveredPath(null)}
                title={fullPath}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: `3px 6px 3px ${pl}px`,
                  cursor: "pointer", userSelect: "none",
                  margin: "1px 4px", borderRadius: 6,
                }}
              >
                {/* Chevron */}
                <span style={{
                  fontSize: 8, color: T.textMuted, width: 10, flexShrink: 0,
                  display: "inline-block", transition: "transform .15s",
                  transform: isOpen ? "rotate(90deg)" : "none",
                  opacity: f.isFolder ? 0.75 : 0,
                }}>▶</span>

                {/* Icon */}
                {f.isFolder ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    {isOpen
                      ? <path d="M1 4.5A1.5 1.5 0 012.5 3h3.086a1.5 1.5 0 011.06.44l.915.914A1.5 1.5 0 008.62 4.5H13.5A1.5 1.5 0 0115 6v6.5A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5V4.5z" fill={T.folderIcon}/>
                      : <path d="M0 4.5A1.5 1.5 0 011.5 3h4.086a1.5 1.5 0 011.06.44l.915.914A1.5 1.5 0 008.62 4.5H14.5A1.5 1.5 0 0116 6v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 010 13V4.5z" fill={T.folderIcon}/>
                    }
                  </svg>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: icon!.svg }} style={{ flexShrink: 0, display: "flex", alignItems: "center", width: 15, height: 15, overflow: "hidden" }}/>
                )}

                {/* Name or rename input */}
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                      if (e.key === "Escape") setRenamingPath(null);
                    }}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                      border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                      boxShadow: `0 0 0 2px ${T.accent}44`,
                      color: T.text, fontSize: 12.5,
                      padding: "2px 7px", borderRadius: 5,
                      fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: 12.5, flex: 1,
                    color: isActive ? T.text : (f.isFolder ? T.text : T.textDim),
                    fontWeight: f.isFolder ? 500 : 400,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                  }}>
                    {f.name}
                  </span>
                )}

                {/* Hover quick-add (folders only) */}
                {isHov && !isRenaming && f.isFolder && (
                  <span style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <button
                      title="New file here"
                      onClick={(e) => { e.stopPropagation(); startCreate(fullPath, "file"); }}
                      style={{ background:"none", border:"none", cursor:"pointer", color: T.textDim, padding:"1px 3px", borderRadius:3, display:"flex", alignItems:"center" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M9 7H7V5H6v2H4v1h2v2h1V8h2V7z"/>
                        <path d="M2 2a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm10 0H8v4h4V2z" opacity=".5"/>
                      </svg>
                    </button>
                    <button
                      title="New folder here"
                      onClick={(e) => { e.stopPropagation(); startCreate(fullPath, "folder"); }}
                      style={{ background:"none", border:"none", cursor:"pointer", color: T.textDim, padding:"1px 3px", borderRadius:3, display:"flex", alignItems:"center" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M9.828 3h3.982a2 2 0 011.992 2.181l-.637 7A2 2 0 0113.174 14H2.826a2 2 0 01-1.991-1.819l-.637-7A2 2 0 012.19 3H5v-.5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0111 2.5V3zm-5-1v1h4V2H4.828zM9 8H7V6H6v2H4v1h2v2h1V9h2V8z"/>
                      </svg>
                    </button>
                  </span>
                )}
              </div>
              {isOpen && renderTree(fullPath, depth + 1)}
            </div>
          );
        })}
      </>
    );
  };

  if (!sidebarOpen) return null;

  // Build context menu items
  const ctxItems: CtxItemDef[] = ctxMenu
    ? ctxMenu.fullPath === null
      ? [
          { label: "New File",   action: () => startCreate("", "file")   },
          { label: "New Folder", action: () => startCreate("", "folder") },
        ]
      : ctxMenu.isFolder
      ? [
          { label: "New File",   action: () => startCreate(ctxMenu.fullPath!, "file")   },
          { label: "New Folder", action: () => startCreate(ctxMenu.fullPath!, "folder") },
          { separator: true },
          { label: "Rename",     action: () => startRename(ctxMenu.fullPath!, ctxMenu.name) },
          { separator: true },
          { label: "Delete",  danger: true, action: () => handleDelete(ctxMenu.fullPath!, ctxMenu.name, true) },
        ]
      : [
          { label: "New File",   action: () => startCreate(ctxMenu.parentPath, "file")   },
          { label: "New Folder", action: () => startCreate(ctxMenu.parentPath, "folder") },
          { separator: true },
          { label: "Rename",     action: () => startRename(ctxMenu.fullPath!, ctxMenu.name) },
          { separator: true },
          { label: "Delete",  danger: true, action: () => handleDelete(ctxMenu.fullPath!, ctxMenu.name, false) },
        ]
    : [];

  return (
    <div style={{ position: "relative", display: "flex", flexShrink: 0 }}>
      <div style={{
        width: sidebarWidth, background: T.sidebar, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{
          height: 32, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 8px 0 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: T.textMuted,
            letterSpacing: 0.9, textTransform: "uppercase",
            fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          }}>
            Explorer
          </span>
          <span style={{ display: "flex", gap: 0 }}>
            {[
              { title: "New File",   icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M9 7H7V5H6v2H4v1h2v2h1V8h2V7z"/><path d="M2 2a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm10 0H8v4h4V2z" opacity=".55"/></svg>, action: () => startCreate("", "file") },
              { title: "New Folder", icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M9.828 3h3.982a2 2 0 011.992 2.181l-.637 7A2 2 0 0113.174 14H2.826a2 2 0 01-1.991-1.819l-.637-7A2 2 0 012.19 3H5v-.5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0111 2.5V3zm-5-1v1h4V2H4.828zM9 8H7V6H6v2H4v1h2v2h1V9h2V8z"/></svg>, action: () => startCreate("", "folder") },
              { title: "Refresh",    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4v1L6 3l2-2v1z"/></svg>, action: () => loadFolder("", true) },
            ].map((btn) => (
              <button
                key={btn.title}
                title={btn.title}
                onClick={btn.action}
                style={{ background:"none", border:"none", cursor:"pointer", color:T.textDim, padding:"3px 5px", borderRadius:4, display:"flex", alignItems:"center", opacity:0.7 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
              >
                {btn.icon}
              </button>
            ))}
          </span>
        </div>

        {/* ── File tree ────────────────────────────────────────── */}
        <div
          style={{ flex: 1, overflowY: "auto", padding: "3px 0" }}
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest(".frow")) return;
            openCtx(e, { fullPath: null, name: "", isFolder: false, parentPath: "" });
          }}
        >
          {!folderMap[""] && (
            <div style={{ padding: 14, textAlign: "center", color: T.textMuted, fontSize: 11 }}>Loading…</div>
          )}
          {renderTree("", 0)}
        </div>

        {/* ── Storage bar ──────────────────────────────────────── */}
        <div style={{ padding: "7px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "-apple-system, system-ui, sans-serif" }}>Storage</span>
            <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "-apple-system, system-ui, sans-serif" }}>3.4 / 10 GB</span>
          </div>
          <div style={{ height: 3, background: T.border, borderRadius: 99 }}>
            <div style={{ width: "34%", height: "100%", background: T.accent, borderRadius: 99 }}/>
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onStartDragResize}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", zIndex: 20, background: "transparent", transition: "background .15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.accent)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      />

      {/* Context menu backdrop */}
      {ctxMenu && <div style={{ position: "fixed", inset: 0, zIndex: 99998 }} onMouseDown={closeCtx}/>}

      {/* Context menu */}
      {ctxMenu && <ContextMenu ctx={ctxMenu} items={ctxItems} dark={dark} T={T} onClose={closeCtx}/>}
    </div>
  );
}
