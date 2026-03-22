'use client';

import { ToolType, ToolDef } from './types';

// Inline SVG Icons (Lucide-style outline icons)
const icons = {
  cursor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/>
    </svg>
  ),
  hand: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  ),
  rect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  ),
  diamond: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 10-10 10L2 12z"/>
    </svg>
  ),
  circle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
    </svg>
  ),
};

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const tools: ToolDef[] = [
  { id: 'select', label: 'Select', icon: icons.cursor, shortcut: 'V' },
  { id: 'hand', label: 'Pan', icon: icons.hand, shortcut: 'H' },
  { id: 'rect', label: 'Rectangle', icon: icons.rect, shortcut: 'R' },
  { id: 'diamond', label: 'Diamond', icon: icons.diamond, shortcut: 'D' },
  { id: 'circle', label: 'Circle', icon: icons.circle, shortcut: 'C' },
];

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div
      className="fixed left-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5 p-2
                 bg-[#0b0b0b]/90 backdrop-blur-xl rounded-2xl
                 border border-white/[0.06] shadow-2xl shadow-black/50"
    >
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;

        return (
          <div key={tool.id} className="relative group">
            {/* Radio dot indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50" />
              </div>
            )}

            {/* Tool button */}
            <button
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              className={`
                w-11 h-11 flex items-center justify-center rounded-xl
                transition-all duration-150 ease-out
                ${isActive
                  ? 'bg-orange-500/20 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.08]'
                }
                active:scale-95
              `}
            >
              {tool.icon}
            </button>

            {/* Tooltip */}
            <div className="
              absolute left-full ml-3 top-1/2 -translate-y-1/2
              px-3 py-1.5 bg-[#1a1a1a] border border-white/[0.08] rounded-lg
              text-xs font-medium text-white whitespace-nowrap
              opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity duration-150 shadow-xl
              hidden group-hover:block
            ">
              {tool.label}
              {tool.shortcut && (
                <span className="ml-2 text-white/30">{tool.shortcut}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
