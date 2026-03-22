'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from './Toolbar';
import { ToolType, ShapeElement } from './types';

// Dynamically import Canvas to avoid SSR issues with Konva
const Canvas = dynamic(() => import('./Canvas'), { ssr: false });

// Top-right action buttons icons
const icons = {
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  unlock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
  trash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
};

interface WhiteboardProps {
  initialElements?: ShapeElement[];
  onElementsChange?: (elements: ShapeElement[]) => void;
  onLockChange?: (locked: boolean) => void;
}

export default function Whiteboard({
  initialElements = [],
  onElementsChange,
  onLockChange,
}: WhiteboardProps) {
  const [tool, setTool] = useState<ToolType>('select');
  const [elements, setElements] = useState<ShapeElement[]>(initialElements);
  const [isLocked, setIsLocked] = useState(false);

  // Listen for tool changes from Canvas (keyboard shortcuts)
  useEffect(() => {
    const handleToolChange = (e: CustomEvent<ToolType>) => {
      setTool(e.detail);
    };
    window.addEventListener('wb-toolchange', handleToolChange as EventListener);
    return () => window.removeEventListener('wb-toolchange', handleToolChange as EventListener);
  }, []);

  // Sync elements to parent
  useEffect(() => {
    onElementsChange?.(elements);
  }, [elements, onElementsChange]);

  const handleToolChange = useCallback((newTool: ToolType) => {
    setTool(newTool);
  }, []);

  const handleElementsChange = useCallback((newElements: ShapeElement[]) => {
    setElements(newElements);
  }, []);

  const handleLockToggle = useCallback(() => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    onLockChange?.(newLocked);
    // Switch to select tool when locked
    if (newLocked) {
      setTool('select');
    }
  }, [isLocked, onLockChange]);

  const handleClear = useCallback(() => {
    setElements([]);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden">
      {/* Toolbar */}
      <Toolbar activeTool={tool} onToolChange={handleToolChange} />

      {/* Top-right action buttons */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Lock/Unlock button */}
        <button
          onClick={handleLockToggle}
          title={isLocked ? 'Unlock canvas' : 'Lock canvas'}
          className={`
            w-10 h-10 flex items-center justify-center rounded-xl
            transition-all duration-150 ease-out
            ${isLocked
              ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
              : 'bg-[#0b0b0b]/90 text-white/50 hover:text-white border border-white/[0.06]'
            }
            backdrop-blur-xl shadow-lg
          `}
        >
          {isLocked ? icons.lock : icons.unlock}
        </button>

        {/* Clear button */}
        <button
          onClick={handleClear}
          title="Clear canvas"
          className="
            w-10 h-10 flex items-center justify-center rounded-xl
            bg-[#0b0b0b]/90 text-white/50 hover:text-white/80
            border border-white/[0.06] backdrop-blur-xl shadow-lg
            transition-all duration-150 ease-out
          "
        >
          {icons.trash}
        </button>
      </div>

      {/* Lock indicator */}
      {isLocked && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0b0b0b]/90 backdrop-blur-xl rounded-full border border-white/[0.06] shadow-lg">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-sm text-white/60">Canvas locked</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        tool={tool}
        elements={elements}
        isLocked={isLocked}
        onElementsChange={handleElementsChange}
      />

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
