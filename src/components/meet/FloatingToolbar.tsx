'use client';

import { useState } from 'react';

// SVG Icons
const icons = {
  cursor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/>
    </svg>
  ),
  'area-select': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  ),
  pen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="2"/>
    </svg>
  ),
  eraser: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21h10"/>
      <path d="M5.5 11.5L17 23H2l5.5-11.5L12 7l5.5 4.5L23 2 20 11"/>
    </svg>
  ),
  text: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  scissors: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  delete: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  shape: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
    </svg>
  ),
  edit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  comment: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

export type Tool =
  | 'cursor'
  | 'area-select'
  | 'pen'
  | 'eraser'
  | 'text'
  | 'scissors'
  | 'delete'
  | 'shape'
  | 'edit'
  | 'comment'
  | 'upload'
  | 'users';

interface ToolItem {
  id: Tool;
  label: string;
  icon: React.ReactNode;
}

const tools: ToolItem[] = [
  { id: 'cursor', label: 'Select', icon: icons.cursor },
  { id: 'area-select', label: 'Area Select', icon: icons['area-select'] },
  { id: 'pen', label: 'Pen', icon: icons.pen },
  { id: 'eraser', label: 'Eraser', icon: icons.eraser },
  { id: 'text', label: 'Text', icon: icons.text },
  { id: 'scissors', label: 'Cut', icon: icons.scissors },
  { id: 'delete', label: 'Delete', icon: icons.delete },
  { id: 'shape', label: 'Shape', icon: icons.shape },
  { id: 'edit', label: 'Edit', icon: icons.edit },
  { id: 'comment', label: 'Comment', icon: icons.comment },
  { id: 'upload', label: 'Share', icon: icons.upload },
  { id: 'users', label: 'Users', icon: icons.users },
];

interface FloatingToolbarProps {
  activeTool?: Tool;
  onToolChange?: (tool: Tool) => void;
}

export default function FloatingToolbar({
  activeTool = 'cursor',
  onToolChange,
}: FloatingToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<Tool | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 8px',
        background: 'rgba(30, 30, 30, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        const isHovered = hoveredTool === tool.id;

        return (
          <div key={tool.id} style={{ position: 'relative' }}>
            <button
              onClick={() => onToolChange?.(tool.id)}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
              title={tool.label}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                border: 'none',
                background: isActive
                  ? 'rgba(255, 99, 82, 0.2)'
                  : isHovered
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: isHovered && !isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {tool.icon}
            </button>

            {/* Tooltip */}
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(100% + 10px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(20, 20, 20, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                {tool.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
