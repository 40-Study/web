/**
 * Whiteboard type definitions
 */

export type WhiteboardElementType =
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "image"
  | "freedraw";

export interface WhiteboardElement {
  id: string;
  type: WhiteboardElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeWidth?: number;
  text?: string;
  points?: number[][];
  src?: string;
}

export interface Whiteboard {
  id: string;
  room_id: string;
  elements: WhiteboardElement[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWhiteboardDTO {
  room_id: string;
}

export interface UpdateWhiteboardDTO {
  elements: WhiteboardElement[];
  version?: number;
}
