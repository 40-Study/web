'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useRef, useEffect, memo } from 'react';
import type { editor } from 'monaco-editor';
import { api } from '@/lib/meet/api';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface Language {
  id: string;
  label: string;
  monaco: string;
  ext: string;
  icon: string;
  color: string;
}

interface TabItem {
  id: string;
  fileName: string;
  code: string;
  lang: Language;
  modified?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LANGUAGES: Language[] = [
  { id: 'python', label: 'Python', monaco: 'python', ext: '.py', icon: 'py', color: '#3572A5' },
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', ext: '.js', icon: 'js', color: '#f7df1e' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript', ext: '.ts', icon: 'ts', color: '#3178c6' },
  { id: 'go', label: 'Go', monaco: 'go', ext: '.go', icon: 'go', color: '#00ADD8' },
  { id: 'cpp', label: 'C++', monaco: 'cpp', ext: '.cpp', icon: 'cpp', color: '#f34b7d' },
  { id: 'c', label: 'C', monaco: 'c', ext: '.c', icon: 'c', color: '#555599' },
  { id: 'java', label: 'Java', monaco: 'java', ext: '.java', icon: 'java', color: '#b07219' },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `# Python 3\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
  javascript: `// JavaScript\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();\n`,
  typescript: `// TypeScript\nconst greet = (name: string): void => {\n  console.log(\`Hello, \${name}!\`);\n};\n\ngreet("World");\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
};

// VSCode Dark+ Theme Colors
const VS = {
  bg: '#1e1e1e',
  editorBg: '#1e1e1e',
  sidebarBg: '#252526',
  activityBarBg: '#333333',
  titleBarBg: '#323233',
  tabBarBg: '#252526',
  tabActive: '#1e1e1e',
  tabInactive: '#2d2d2d',
  tabHover: '#2a2a2a',
  tabBorder: '#1e1e1e',
  panelBg: '#1e1e1e',
  panelHeaderBg: '#252526',
  statusBarBg: '#007acc',
  border: '#3c3c3c',
  text: '#cccccc',
  textBright: '#e7e7e7',
  textDim: '#969696',
  textMuted: '#6e6e6e',
  accent: '#007acc',
  accentHover: '#1c8cd9',
  success: '#4ec9b0',
  error: '#f14c4c',
  warning: '#cca700',
  icon: '#c5c5c5',
  // macOS traffic lights
  trafficRed: '#ff5f56',
  trafficYellow: '#ffbd2e',
  trafficGreen: '#27c93f',
  // Extra colors (for compatibility)
  primary: '#007acc',
  primaryDim: '#1c8cd9',
  surfaceHigh: '#3c3c3c',
  borderDim: '#3c3c3c',
};

// ─── File Icon Component ─────────────────────────────────────────────────────
function FileIcon({ lang, size = 16 }: { lang: Language; size?: number }) {
  // Language-specific icons
  const icons: Record<string, JSX.Element> = {
    python: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 6 4.02 6 5.5V8h6v1H5.5C3.02 9 2 11 2 13.5S3.02 18 5.5 18H8v-2.5C8 13.02 9.52 11.5 12 11.5h4c1.38 0 2.5-1.12 2.5-2.5V5.5C18.5 3.12 15.38 2 12 2zm-1.5 2.5a1 1 0 110 2 1 1 0 010-2z" fill="#3572A5"/>
        <path d="M12 22c5.52 0 6-2.02 6-3.5V16h-6v-1h6.5c2.48 0 3.5-2 3.5-4.5S20.98 6 18.5 6H16v2.5c0 2.48-1.52 4-4 4h-4c-1.38 0-2.5 1.12-2.5 2.5v3.5c0 2.38 3.12 3.5 6.5 3.5zm1.5-2.5a1 1 0 110-2 1 1 0 010 2z" fill="#FFD43B"/>
      </svg>
    ),
    javascript: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="2" fill="#F7DF1E"/>
        <path d="M7 17.5L8.5 16.5C8.8 17.1 9.3 17.5 10 17.5C10.8 17.5 11.2 17.1 11.2 16V10H13V16C13 18 11.8 19 10.1 19C8.5 19 7.5 18.2 7 17.5ZM14.5 17.2L16 16.2C16.4 16.9 17 17.4 18 17.4C18.8 17.4 19.3 17 19.3 16.4C19.3 15.7 18.8 15.4 17.9 15L17.4 14.8C15.9 14.2 15 13.4 15 11.8C15 10.3 16.2 9.2 17.9 9.2C19.1 9.2 20 9.6 20.6 10.6L19.2 11.7C18.9 11.2 18.5 10.9 17.9 10.9C17.3 10.9 16.9 11.3 16.9 11.8C16.9 12.4 17.3 12.7 18.1 13L18.6 13.2C20.4 13.9 21.3 14.7 21.3 16.4C21.3 18.2 19.9 19.2 18.1 19.2C16.3 19.2 15.1 18.4 14.5 17.2Z" fill="#000"/>
      </svg>
    ),
    typescript: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="2" fill="#3178C6"/>
        <path d="M13.5 16V10.5H16V9H9V10.5H11.5V16H13.5ZM17 14.5V16H19.5C19.5 16 20.5 16 20.5 15C20.5 14 19.5 13.5 18.5 13.5H17.5V12.5H20V11H17.5C17.5 11 16 11 16 12.5C16 13.5 17 14 17.5 14H19C19 14 19.5 14 19.5 14.5C19.5 15 19 15 19 15H17V14.5Z" fill="#fff"/>
      </svg>
    ),
    go: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="6" fill="#00ADD8"/>
        <circle cx="8" cy="11" r="1.5" fill="#fff"/>
        <circle cx="16" cy="11" r="1.5" fill="#fff"/>
        <circle cx="8" cy="11" r="0.5" fill="#000"/>
        <circle cx="16" cy="11" r="0.5" fill="#000"/>
      </svg>
    ),
    cpp: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#00599C"/>
        <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">C++</text>
      </svg>
    ),
    c: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#A8B9CC"/>
        <text x="12" y="16" textAnchor="middle" fill="#000" fontSize="12" fontWeight="bold">C</text>
      </svg>
    ),
    java: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8.5 19s-1 .5 1 .7c2 .2 3.5.2 6-.2 0 0 .5.3 1.2.6-4.2 1.8-9.5-.1-8.2-1.1zm-.7-2.5s-1.1.8.8 1c2.5.2 4.5.2 7.8-.3 0 0 .4.4 1 .6-5.1 1.5-10.8.1-9.6-1.3z" fill="#5382A1"/>
        <path d="M13.5 11c1.3 1.5-.3 2.8-.3 2.8s3.3-1.7 1.8-3.8c-1.4-2-2.5-3 3.4-6.4 0 0-9.3 2.3-4.9 7.4z" fill="#E76F00"/>
        <path d="M19 18.5s.8.6-.8 1.1c-3 .9-12.5 1.2-15.2 0-.9-.4.8-1 1.4-1.1.6-.1.9-.1.9-.1-1-.7-6.6 1.4-2.8 2 10.2 1.5 18.6-.7 16.5-1.9z" fill="#5382A1"/>
      </svg>
    ),
  };

  return icons[lang.id] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={lang.color} strokeWidth="1.5">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
      <path d="M14 2V8H20"/>
    </svg>
  );
}

// ─── Traffic Lights (macOS) ──────────────────────────────────────────────────
interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

function TrafficLights({ onClose, onMinimize, onMaximize, isMaximized }: TrafficLightsProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Close - Red */}
      <button
        onClick={onClose}
        title="Close"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: VS.trafficRed,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          color: hovered ? '#4d0000' : 'transparent',
          fontWeight: 700,
          transition: 'color 0.1s',
        }}
      >
        ✕
      </button>
      {/* Minimize - Yellow */}
      <button
        onClick={onMinimize}
        title="Minimize"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: VS.trafficYellow,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          color: hovered ? '#995700' : 'transparent',
          fontWeight: 700,
          transition: 'color 0.1s',
        }}
      >
        −
      </button>
      {/* Maximize - Green */}
      <button
        onClick={onMaximize}
        title={isMaximized ? "Restore" : "Maximize"}
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: VS.trafficGreen,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 7,
          color: hovered ? '#006500' : 'transparent',
          fontWeight: 700,
          transition: 'color 0.1s',
        }}
      >
        {isMaximized ? '⤓' : '⤢'}
      </button>
    </div>
  );
}

// ─── Activity Bar ────────────────────────────────────────────────────────────
function ActivityBar({ sidebarOpen, onToggle }: { sidebarOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{
      width: 48,
      background: VS.activityBarBg,
      borderRight: `1px solid ${VS.borderDim}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 10,
      flexShrink: 0,
    }}>
      <button
        onClick={onToggle}
        title="Explorer (Ctrl+B)"
        style={{
          width: 36,
          height: 36,
          background: sidebarOpen ? VS.surfaceHigh : 'transparent',
          border: 'none',
          borderRadius: 8,
          borderLeft: `2px solid ${sidebarOpen ? VS.primary : 'transparent'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: sidebarOpen ? VS.primary : VS.textMuted,
          transition: 'all 0.15s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Context Menu ────────────────────────────────────────────────────────────
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: { label: string; icon?: string; onClick: () => void; danger?: boolean; disabled?: boolean }[];
}

function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: VS.sidebarBg,
        border: `1px solid ${VS.borderDim}`,
        borderRadius: 10,
        padding: '6px',
        minWidth: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          disabled={item.disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            borderRadius: 6,
            color: item.disabled ? VS.textMuted : item.danger ? VS.error : VS.text,
            fontSize: 13,
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            opacity: item.disabled ? 0.5 : 1,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => !item.disabled && (e.currentTarget.style.background = VS.surfaceHigh)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          {item.icon && <span style={{ width: 16, textAlign: 'center' }}>{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
interface SidebarProps {
  tabs: TabItem[];
  activeTabId: string;
  width: number;
  onSelectTab: (id: string) => void;
  onNewFile: () => void;
  onDeleteTab: (id: string) => void;
  onRenameTab: (id: string, newName: string) => void;
  onDuplicateTab: (id: string) => void;
  onResize: (e: React.MouseEvent) => void;
}

const Sidebar = memo(({ tabs, activeTabId, width, onSelectTab, onNewFile, onDeleteTab, onRenameTab, onDuplicateTab, onResize }: SidebarProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleStartRename = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setEditingId(tabId);
      setEditingName(tab.fileName);
    }
  };

  const handleFinishRename = () => {
    if (editingId && editingName.trim()) {
      onRenameTab(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleBlankContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId: '' });
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
      <div style={{
        width,
        background: VS.sidebarBg,
        borderRight: `1px solid ${VS.borderDim}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Section Header */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            height: 28,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            cursor: 'pointer',
            userSelect: 'none',
            background: VS.surfaceHigh,
            borderBottom: `1px solid ${VS.borderDim}`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill={VS.textMuted} style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}>
            <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: VS.textDim,
            textTransform: 'uppercase',
            marginLeft: 2,
            letterSpacing: 0.5,
          }}>
            Open Editors
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={(e) => { e.stopPropagation(); onNewFile(); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: VS.textDim,
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              opacity: 0.7,
            }}
            title="New File (Ctrl+N)"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4v8M4 8h8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>

        {/* File List */}
        {expanded && (
          <div
            style={{ flex: 1, overflowY: 'auto' }}
            onContextMenu={handleBlankContextMenu}
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isHovered = tab.id === hoveredId;
              const isEditing = tab.id === editingId;
              return (
                <div
                  key={tab.id}
                  onClick={() => !isEditing && onSelectTab(tab.id)}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  onMouseEnter={() => setHoveredId(tab.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onDoubleClick={() => handleStartRename(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px 3px 22px',
                    cursor: 'pointer',
                    background: isActive ? '#37373d' : isHovered ? '#2a2d2e' : 'transparent',
                  }}
                >
                  <FileIcon lang={tab.lang} size={14} />
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRename();
                        if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        background: '#3c3c3c',
                        border: `1px solid ${VS.accent}`,
                        borderRadius: 2,
                        padding: '1px 4px',
                        color: VS.text,
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      color: isActive ? VS.textBright : VS.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {tab.fileName}
                    </span>
                  )}
                  {tab.modified && !isEditing && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: VS.textBright }} />
                  )}
                  {isHovered && !isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTab(tab.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: VS.textMuted,
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 3,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
            {tabs.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: VS.textMuted, fontSize: 12 }}>
                Right-click to create a file
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={contextMenu.tabId ? [
            { label: 'Rename', icon: '✏️', onClick: () => handleStartRename(contextMenu.tabId) },
            { label: 'Duplicate', icon: '📋', onClick: () => onDuplicateTab(contextMenu.tabId) },
            { label: 'Delete', icon: '🗑️', onClick: () => onDeleteTab(contextMenu.tabId), danger: true },
          ] : [
            { label: 'New File', icon: '📄', onClick: onNewFile },
          ]}
        />
      )}

      {/* Resize Handle */}
      <div
        onMouseDown={onResize}
        style={{
          position: 'absolute',
          right: -2,
          top: 0,
          bottom: 0,
          width: 4,
          cursor: 'col-resize',
          zIndex: 20,
        }}
      />
    </div>
  );
});
Sidebar.displayName = 'Sidebar';

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
const TabBar = memo(({ tabs, activeTabId, onSelectTab, onCloseTab }: {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{
      display: 'flex',
      background: VS.tabBarBg,
      borderBottom: `1px solid ${VS.borderDim}`,
      height: 38,
      flexShrink: 0,
      overflowX: 'auto',
      gap: 2,
      padding: '0 4px',
      alignItems: 'flex-end',
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isHovered = tab.id === hoveredId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            onMouseEnter={() => setHoveredId(tab.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 14px',
              height: isActive ? 34 : 30,
              background: isActive ? VS.tabActive : isHovered ? VS.tabHover : 'transparent',
              borderRadius: isActive ? '8px 8px 0 0' : '6px 6px 0 0',
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
              transition: 'all 0.15s',
              borderTop: isActive ? `2px solid ${VS.primary}` : '2px solid transparent',
            }}
          >
            <FileIcon lang={tab.lang} size={14} />
            <span style={{
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? VS.text : VS.textMuted,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {tab.fileName}
            </span>
            {tab.modified && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: VS.primary, flexShrink: 0 }} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: VS.textMuted,
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
                opacity: isHovered || isActive ? 1 : 0,
                transition: 'opacity 0.15s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
});
TabBar.displayName = 'TabBar';

// ─── Panel (Output/Terminal) ─────────────────────────────────────────────────
const Panel = memo(({
  output,
  outputType,
  running,
  stdin,
  setStdin,
  onClear,
  height,
  onResize
}: {
  output: string;
  outputType: 'stdout' | 'stderr';
  running: boolean;
  stdin: string;
  setStdin: (v: string) => void;
  onClear: () => void;
  height: number;
  onResize: (e: React.MouseEvent) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'terminal'>('output');

  return (
    <div style={{ height, flexShrink: 0, display: 'flex', flexDirection: 'column', background: VS.panelBg }}>
      {/* Resize Handle */}
      <div
        onMouseDown={onResize}
        style={{
          height: 4,
          cursor: 'row-resize',
          background: VS.borderDim,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = VS.primary; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = VS.borderDim; }}
      />

      {/* Panel Header */}
      <div style={{
        height: 38,
        background: VS.panelHeaderBg,
        borderBottom: `1px solid ${VS.borderDim}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 4,
      }}>
        {['OUTPUT', 'TERMINAL'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as any)}
            style={{
              background: activeTab === tab.toLowerCase() ? VS.surfaceHigh : 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: activeTab === tab.toLowerCase() ? VS.text : VS.textMuted,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {output && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: outputType === 'stderr' ? VS.error : VS.success,
            padding: '4px 10px',
            borderRadius: 6,
            background: outputType === 'stderr' ? `${VS.error}20` : `${VS.success}20`,
          }}>
            {outputType === 'stderr' ? 'ERROR' : 'SUCCESS'}
          </span>
        )}
        <button
          onClick={onClear}
          title="Clear Output"
          style={{
            background: VS.surfaceHigh,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: VS.textMuted,
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            marginLeft: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8"/>
          </svg>
        </button>
      </div>

      {/* Panel Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {!output && !running && (
            <span style={{ color: VS.textMuted, fontSize: 12, fontFamily: 'SF Mono, Monaco, monospace' }}>
              {'>'} Press Run or Ctrl+Enter to execute
            </span>
          )}
          {running && (
            <span style={{ color: VS.accent, fontSize: 12, fontFamily: 'SF Mono, Monaco, monospace' }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              {' '}Running...
            </span>
          )}
          {output && (
            <pre style={{
              color: outputType === 'stderr' ? VS.error : VS.text,
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              fontFamily: 'SF Mono, Monaco, Consolas, monospace',
              margin: 0,
            }}>
              {output}
            </pre>
          )}
        </div>

        {/* Stdin */}
        <div style={{
          width: 200,
          borderLeft: `1px solid ${VS.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '4px 10px',
            fontSize: 10,
            fontWeight: 600,
            color: VS.textDim,
            textTransform: 'uppercase',
            borderBottom: `1px solid ${VS.border}`,
          }}>
            Input (stdin)
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input..."
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              resize: 'none',
              padding: '8px 10px',
              fontFamily: 'SF Mono, Monaco, monospace',
              fontSize: 12,
              lineHeight: 1.5,
              color: VS.text,
              outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
});
Panel.displayName = 'Panel';

// ─── Status Bar ──────────────────────────────────────────────────────────────
const StatusBar = memo(({ lang, lineCount, col }: { lang: Language; lineCount: number; col: number }) => (
  <div style={{
    height: 26,
    background: VS.sidebarBg,
    borderTop: `1px solid ${VS.borderDim}`,
    color: VS.textMuted,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    fontSize: 11,
    gap: 16,
    flexShrink: 0,
  }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      Ln {lineCount}, Col {col}
    </span>
    <span>Spaces: 4</span>
    <span>UTF-8</span>
    <div style={{ flex: 1 }} />
    <span style={{
      background: `${lang.color}20`,
      color: lang.color,
      padding: '2px 8px',
      borderRadius: 4,
      fontWeight: 500,
    }}>{lang.label}</span>
  </div>
));
StatusBar.displayName = 'StatusBar';

// ─── Main Component ──────────────────────────────────────────────────────────
interface Props {
  sessionId: string;
  onClose?: () => void;
}

export default function SandboxTab({ sessionId, onClose }: Props) {
  const [tabs, setTabs] = useState<TabItem[]>(() => {
    const defaultLang = LANGUAGES[0];
    return [{
      id: `file-${Date.now()}`,
      fileName: `main${defaultLang.ext}`,
      code: DEFAULT_CODE[defaultLang.id] || '',
      lang: defaultLang,
    }];
  });
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || '');
  const [activeView, setActiveView] = useState('explorer');
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [panelHeight, setPanelHeight] = useState(180);
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState<'stdout' | 'stderr'>('stdout');
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [position, setPosition] = useState({ x: 80, y: 40 });
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const prevStateRef = useRef({ position: { x: 80, y: 40 }, size: { width: 1000, height: 700 } });
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Cleanup Monaco editor on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          model.dispose();
        }
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const lineCount = activeTab?.code.split('\n').length || 0;

  const handleCodeChange = useCallback((code: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code, modified: true } : t));
  }, [activeTabId]);

  const handleNewFile = useCallback(() => {
    const lang = LANGUAGES[0];
    const id = `file-${Date.now()}`;
    const count = tabs.filter(t => t.fileName.startsWith('untitled')).length;
    const fileName = `untitled${count > 0 ? count : ''}${lang.ext}`;
    setTabs(prev => [...prev, { id, fileName, code: DEFAULT_CODE[lang.id] || '', lang }]);
    setActiveTabId(id);
  }, [tabs]);

  const handleCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (newTabs.length === 0) {
        const lang = LANGUAGES[0];
        const newId = `file-${Date.now()}`;
        setActiveTabId(newId);
        return [{ id: newId, fileName: `main${lang.ext}`, code: DEFAULT_CODE[lang.id] || '', lang }];
      }
      if (activeTabId === id) {
        const idx = prev.findIndex(t => t.id === id);
        setActiveTabId(newTabs[Math.min(idx, newTabs.length - 1)]?.id || '');
      }
      return newTabs;
    });
  }, [activeTabId]);

  const handleRenameTab = useCallback((id: string, newName: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== id) return t;
      // Detect language from extension
      const ext = newName.match(/\.[^.]+$/)?.[0] || t.lang.ext;
      const newLang = LANGUAGES.find(l => l.ext === ext) || t.lang;
      return { ...t, fileName: newName, lang: newLang };
    }));
  }, []);

  const handleDuplicateTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    const newId = `file-${Date.now()}`;
    const baseName = tab.fileName.replace(/(\.[^.]+)$/, '');
    const ext = tab.fileName.match(/\.[^.]+$/)?.[0] || tab.lang.ext;
    const newFileName = `${baseName}_copy${ext}`;
    setTabs(prev => [...prev, { ...tab, id: newId, fileName: newFileName }]);
    setActiveTabId(newId);
  }, [tabs]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      // Restore previous size and position
      setPosition(prevStateRef.current.position);
      setSize(prevStateRef.current.size);
      setIsMaximized(false);
    } else {
      // Save current state and maximize
      prevStateRef.current = { position, size };
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
    }
  }, [isMaximized, position, size]);

  const handleLangChange = useCallback((langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (!lang) return;
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      const baseName = t.fileName.replace(/\.[^.]+$/, '');
      return { ...t, lang, fileName: baseName + lang.ext, code: t.code || DEFAULT_CODE[lang.id] || '' };
    }));
  }, [activeTabId]);

  const handleRun = useCallback(async () => {
    if (!activeTab) return;
    setRunning(true);
    setOutput('');
    try {
      const res = await api.post<{
        stdout?: string;
        stderr?: string;
        error?: string;
        time?: string;
      }>('/submissions/execute', {
        code: activeTab.code,
        language: activeTab.lang.id,
        stdin,
      });

      if (res.error) {
        setOutput(res.error);
        setOutputType('stderr');
      } else if (res.stderr?.trim()) {
        setOutput(res.stderr);
        setOutputType('stderr');
      } else {
        const timeInfo = res.time ? `\n\n[Finished in ${res.time}s]` : '';
        setOutput((res.stdout || '(no output)') + timeInfo);
        setOutputType('stdout');
      }
    } catch (err: any) {
      setOutput(err.message ?? 'Error running code');
      setOutputType('stderr');
    } finally {
      setRunning(false);
    }
  }, [activeTab, stdin]);

  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => setSidebarWidth(Math.max(150, Math.min(350, startW + ev.clientX - startX)));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const handlePanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = panelHeight;
    const onMove = (ev: MouseEvent) => setPanelHeight(Math.max(100, Math.min(400, startH - (ev.clientY - startY))));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelHeight]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffsetRef.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffsetRef.current.y)),
        });
      }
      if (resizingRef.current) {
        setSize({
          width: Math.max(700, resizeStartRef.current.w + e.clientX - resizeStartRef.current.x),
          height: Math.max(500, resizeStartRef.current.h + e.clientY - resizeStartRef.current.y),
        });
      }
    };
    const onUp = () => { draggingRef.current = false; resizingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [position, size]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun]);

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 38 : size.height,
        background: VS.bg,
        borderRadius: isMaximized ? 0 : 10,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999,
        boxShadow: isMaximized ? 'none' : '0 22px 70px 4px rgba(0,0,0,0.56), 0 0 0 1px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        transition: 'height 0.2s ease, border-radius 0.2s ease',
      }}>
        {/* Title Bar (macOS style) */}
        <div
          onMouseDown={isMaximized ? undefined : handleDragStart}
          onDoubleClick={handleMaximize}
          style={{
            background: VS.titleBarBg,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            cursor: isMaximized ? 'default' : 'move',
            userSelect: 'none',
            flexShrink: 0,
            borderBottom: `1px solid ${VS.border}`,
          }}
        >
          <TrafficLights
            onClose={onClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            isMaximized={isMaximized}
          />

          {/* Centered Title */}
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: VS.textDim,
          }}>
            {activeTab?.fileName} — Code Sandbox
          </div>

          {/* Toolbar - hidden when minimized */}
          {!isMinimized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={activeTab?.lang.id || 'python'}
                onChange={(e) => handleLangChange(e.target.value)}
                style={{
                  background: '#3c3c3c',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: VS.text,
                  fontSize: 12,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>

              <button
                onClick={handleRun}
                disabled={running}
                style={{
                  background: running ? VS.textMuted : '#4caf50',
                  border: 'none',
                  borderRadius: 4,
                  padding: '5px 12px',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: running ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {running ? '⏳' : '▶'} Run
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        {!isMinimized && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ActivityBar sidebarOpen={activeView === 'explorer'} onToggle={() => setActiveView(v => v === 'explorer' ? '' : 'explorer')} />

          {activeView === 'explorer' && (
            <Sidebar
              tabs={tabs}
              activeTabId={activeTabId}
              width={sidebarWidth}
              onSelectTab={setActiveTabId}
              onNewFile={handleNewFile}
              onDeleteTab={handleCloseTab}
              onRenameTab={handleRenameTab}
              onDuplicateTab={handleDuplicateTab}
              onResize={handleSidebarResize}
            />
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={handleCloseTab}
            />

            <div style={{ flex: 1, minHeight: 0 }}>
              {activeTab && (
                <MonacoEditor
                  height="100%"
                  language={activeTab.lang.monaco}
                  value={activeTab.code}
                  onChange={(val) => handleCodeChange(val ?? '')}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true, maxColumn: 80 },
                    fontSize: 13,
                    lineHeight: 20,
                    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 12 },
                    renderLineHighlight: 'line',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              )}
            </div>

            <Panel
              output={output}
              outputType={outputType}
              running={running}
              stdin={stdin}
              setStdin={setStdin}
              onClear={() => setOutput('')}
              height={panelHeight}
              onResize={handlePanelResize}
            />
          </div>
        </div>
        )}

        {!isMinimized && <StatusBar lang={activeTab?.lang || LANGUAGES[0]} lineCount={lineCount} col={1} />}

        {/* Resize Handle - hidden when minimized or maximized */}
        {!isMinimized && !isMaximized && (
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              cursor: 'se-resize',
            }}
          />
        )}
      </div>
    </>
  );
}
