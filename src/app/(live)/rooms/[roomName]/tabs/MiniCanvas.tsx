'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { BoardElement } from './SharedBoardPanel';

interface MiniCanvasProps {
  elements: BoardElement[];
  onChange: (elements: BoardElement[]) => void;
  tool: 'pen' | 'eraser' | 'clear' | 'text';
  color: string;
  strokeWidth: number;
  editable?: boolean;
}

export default function MiniCanvas({
  elements,
  onChange,
  tool,
  color,
  strokeWidth,
  editable = true,
}: MiniCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Text input state
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [textValue, setTextValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Redraw all elements
  const redrawElements = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    elements.forEach((el) => {
      if (el.type === 'pen' && el.points && el.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(el.points[0], el.points[1]);
        for (let i = 2; i < el.points.length; i += 2) {
          ctx.lineTo(el.points[i], el.points[i + 1]);
        }
        ctx.stroke();
      } else if (el.type === 'text' && el.text && el.x !== undefined && el.y !== undefined) {
        ctx.fillStyle = el.color;
        ctx.font = `${el.strokeWidth * 6}px sans-serif`;
        ctx.fillText(el.text, el.x, el.y);
      }
    });
  }, [elements]);

  // Resize canvas to fit container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Redraw elements after resize
      redrawElements();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawElements]);

  // Redraw when elements change
  useEffect(() => {
    redrawElements();
  }, [elements, redrawElements]);

  // Get canvas coordinates from mouse/touch event
  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Commit text when user presses Enter or clicks away
  const commitText = useCallback(() => {
    if (textValue.trim() && textInput.visible) {
      const newElement: BoardElement = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'text',
        x: textInput.x,
        y: textInput.y,
        text: textValue.trim(),
        color,
        strokeWidth,
      };
      onChange([...elements, newElement]);
    }
    setTextInput({ x: 0, y: 0, visible: false });
    setTextValue('');
  }, [textValue, textInput, color, strokeWidth, elements, onChange]);

  // Start drawing
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!editable) return;
    e.preventDefault();

    // If text input is visible and we're clicking elsewhere, commit it first
    if (textInput.visible) {
      commitText();
      return;
    }

    const coords = getCoords(e);
    if (!coords) return;

    if (tool === 'text') {
      // Show text input at click position
      setTextInput({ x: coords.x, y: coords.y, visible: true });
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }

    if (tool === 'eraser') {
      // Find and remove element under cursor
      const newElements = elements.filter((el) => {
        if (el.type === 'pen' && el.points) {
          // Check if any point is close to cursor
          for (let i = 0; i < el.points.length; i += 2) {
            const dx = el.points[i] - coords.x;
            const dy = el.points[i + 1] - coords.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
              return false;
            }
          }
        }
        // Also check text elements
        if (el.type === 'text' && el.x !== undefined && el.y !== undefined) {
          const dx = el.x - coords.x;
          const dy = el.y - coords.y;
          if (Math.abs(dx) < 50 && Math.abs(dy) < 20) {
            return false;
          }
        }
        return true;
      });
      if (newElements.length !== elements.length) {
        onChange(newElements);
      }
    } else {
      setIsDrawing(true);
      setCurrentPath([coords.x, coords.y]);
      lastPointRef.current = coords;
    }
  }, [editable, tool, elements, onChange, getCoords, textInput.visible, commitText]);

  // Continue drawing
  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!editable || !isDrawing || tool === 'eraser') return;
    e.preventDefault();

    const coords = getCoords(e);
    if (!coords) return;

    // Only add point if moved enough distance
    const last = lastPointRef.current;
    if (last) {
      const dx = coords.x - last.x;
      const dy = coords.y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) < 2) return;
    }

    setCurrentPath((prev) => [...prev, coords.x, coords.y]);
    lastPointRef.current = coords;

    // Draw current stroke preview
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && last) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  }, [editable, isDrawing, tool, color, strokeWidth, getCoords]);

  // End drawing
  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!editable || !isDrawing) return;
    e.preventDefault();

    if (currentPath.length >= 2) {
      const newElement: BoardElement = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'pen',
        points: currentPath,
        color,
        strokeWidth,
      };
      onChange([...elements, newElement]);
    }

    setIsDrawing(false);
    setCurrentPath([]);
    lastPointRef.current = null;
  }, [editable, isDrawing, currentPath, color, strokeWidth, elements, onChange]);

  // Handle touch events for eraser while moving
  const handlePointerMoveEraser = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!editable || tool !== 'eraser') return;
    e.preventDefault();

    // Check if mouse/touch is pressed
    const isPressed = 'buttons' in e ? e.buttons === 1 : true;
    if (!isPressed) return;

    const coords = getCoords(e);
    if (!coords) return;

    const newElements = elements.filter((el) => {
      if (el.type === 'pen' && el.points) {
        for (let i = 0; i < el.points.length; i += 2) {
          const dx = el.points[i] - coords.x;
          const dy = el.points[i + 1] - coords.y;
          if (Math.sqrt(dx * dx + dy * dy) < 20) {
            return false;
          }
        }
      }
      return true;
    });
    if (newElements.length !== elements.length) {
      onChange(newElements);
    }
  }, [editable, tool, elements, onChange, getCoords]);

  // Handle text input key press
  const handleTextKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitText();
    } else if (e.key === 'Escape') {
      setTextInput({ x: 0, y: 0, visible: false });
      setTextValue('');
    }
  }, [commitText]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
        cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'crosshair' : 'crosshair',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={tool === 'eraser' ? handlePointerMoveEraser : handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={tool === 'eraser' ? handlePointerMoveEraser : handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{
          display: 'block',
        }}
      />
      {/* Text input overlay */}
      {textInput.visible && (
        <input
          ref={textInputRef}
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={handleTextKeyDown}
          onBlur={commitText}
          style={{
            position: 'absolute',
            left: textInput.x,
            top: textInput.y - 12,
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${color}`,
            borderRadius: '4px',
            color: color,
            padding: '4px 8px',
            fontSize: `${strokeWidth * 6}px`,
            fontFamily: 'sans-serif',
            outline: 'none',
            minWidth: '100px',
            zIndex: 10,
          }}
          placeholder="Nhập văn bản..."
        />
      )}
    </div>
  );
}
