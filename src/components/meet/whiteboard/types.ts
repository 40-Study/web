// Tool types enum
export type ToolType = 'select' | 'hand' | 'rect' | 'diamond' | 'circle';

// Shape element interface
export interface ShapeElement {
  id: string;
  type: 'rect' | 'diamond' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

// Whiteboard state interface
export interface WhiteboardState {
  elements: ShapeElement[];
  selectedId: string | null;
  tool: ToolType;
  isLocked: boolean;
  isPanning: boolean;
  panOffset: { x: number; y: number };
}

// Tool definitions
export interface ToolDef {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

// Action callbacks
export interface WhiteboardCallbacks {
  onToolChange: (tool: ToolType) => void;
  onElementsChange: (elements: ShapeElement[]) => void;
  onLockChange: (locked: boolean) => void;
  onClear: () => void;
}
