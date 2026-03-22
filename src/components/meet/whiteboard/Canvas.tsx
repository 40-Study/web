'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Ellipse, Line, Transformer } from 'react-konva';
import Konva from 'konva';
import { ToolType, ShapeElement } from './types';

interface CanvasProps {
  tool: ToolType;
  elements: ShapeElement[];
  isLocked: boolean;
  onElementsChange: (elements: ShapeElement[]) => void;
}

const COLORS = {
  fill: 'transparent',
  stroke: '#ffffff',
  strokeWidth: 2,
  selectedStroke: '#ff6352',
  selectedStrokeWidth: 2,
};

function generateId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDiamondPoints(width: number, height: number): number[] {
  return [
    width / 2, 0,
    width, height / 2,
    width / 2, height,
    0, height / 2,
    width / 2, 0,
  ];
}

export default function Canvas({ tool, elements, isLocked, onElementsChange }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<ShapeElement | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Sync transformer with selection
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const selectedNode = selectedId ? stage.findOne(`#${selectedId}`) : null;
    transformerRef.current.nodes(selectedNode ? [selectedNode] : []);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          window.dispatchEvent(new CustomEvent('wb-toolchange', { detail: 'select' }));
          break;
        case 'h':
          window.dispatchEvent(new CustomEvent('wb-toolchange', { detail: 'hand' }));
          break;
        case 'r':
          window.dispatchEvent(new CustomEvent('wb-toolchange', { detail: 'rect' }));
          break;3
          window.dispatchEvent(new CustomEvent('wb-toolchange', { detail: 'diamond' }));
          break;
        case 'c':
          window.dispatchEvent(new CustomEvent('wb-toolchange', { detail: 'circle' }));
          break;
        case 'delete':
        case 'backspace':
          if (selectedId) {
            onElementsChange(elements.filter(el => el.id !== selectedId));
            setSelectedId(null);
          }
          break;
        case 'escape':
          setSelectedId(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, onElementsChange]);

  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return {
      x: pos.x - stagePos.x,
      y: pos.y - stagePos.y,
    };
  }, [stagePos]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isLocked && tool !== 'hand' && tool !== 'select') return;

    const pos = getPointerPosition();
    if (!pos) return;

    const clickedOnEmpty = e.target === e.target.getStage();

    if (tool === 'hand') {
      return;
    }

    if (tool === 'select') {
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    if (['rect', 'diamond', 'circle'].includes(tool)) {
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentShape({
        id: generateId(),
        type: tool as 'rect' | 'diamond' | 'circle',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: COLORS.fill,
        stroke: COLORS.stroke,
        strokeWidth: COLORS.strokeWidth,
      });
    }
  }, [tool, isLocked, getPointerPosition]);

  const handleMouseMove = useCallback(() => {
    if (!isDrawing || !startPos || !currentShape) return;

    const pos = getPointerPosition();
    if (!pos) return;

    const width = pos.x - startPos.x;
    const height = pos.y - startPos.y;

    setCurrentShape(prev => prev ? {
      ...prev,
      x: width < 0 ? pos.x : startPos.x,
      y: height < 0 ? pos.y : startPos.y,
      width: Math.abs(width),
      height: Math.abs(height),
    } : null);
  }, [isDrawing, startPos, currentShape, getPointerPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      return;
    }

    // Only add if shape has meaningful size
    if (currentShape.width > 5 && currentShape.height > 5) {
      onElementsChange([...elements, currentShape]);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentShape(null);
  }, [isDrawing, currentShape, elements, onElementsChange]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    onElementsChange(
      elements.map(el =>
        el.id === id ? { ...el, x: newX, y: newY } : el
      )
    );
  }, [elements, onElementsChange]);

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>, id: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onElementsChange(
      elements.map(el =>
        el.id === id ? {
          ...el,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, el.width * scaleX),
          height: Math.max(5, el.height * scaleY),
        } : el
      )
    );
  }, [elements, onElementsChange]);

  const renderShape = (shape: ShapeElement) => {
    const isSelected = selectedId === shape.id;
    const isDraggable = tool === 'select' && !isLocked;
    const stroke = isSelected ? COLORS.selectedStroke : shape.stroke;
    const fill = isSelected ? 'rgba(255,99,82,0.1)' : shape.fill;

    const commonProps = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      fill,
      stroke,
      strokeWidth: isSelected ? COLORS.selectedStrokeWidth : shape.strokeWidth,
      draggable: isDraggable,
      onClick: () => tool === 'select' && !isLocked && setSelectedId(shape.id),
      onTap: () => tool === 'select' && !isLocked && setSelectedId(shape.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, shape.id),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(e, shape.id),
    };

    switch (shape.type) {
      case 'rect':
        return <Rect key={shape.id} {...commonProps} cornerRadius={4} />;
      case 'circle':
        return (
          <Ellipse
            key={shape.id}
            x={shape.x + shape.width / 2}
            y={shape.y + shape.height / 2}
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? COLORS.selectedStrokeWidth : shape.strokeWidth}
            draggable={isDraggable}
            onClick={() => tool === 'select' && !isLocked && setSelectedId(shape.id)}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, shape.id)}
            onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleTransformEnd(e, shape.id)}
          />
        );
      case 'diamond':
        return (
          <Line
            key={shape.id}
            {...commonProps}
            points={getDiamondPoints(shape.width, shape.height)}
            closed
            lineJoin="round"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      x={stagePos.x}
      y={stagePos.y}
      draggable={tool === 'hand'}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      style={{ background: '#0a0a0a', cursor: tool === 'hand' ? 'grab' : 'crosshair' }}
    >
      <Layer>
        {elements.map(renderShape)}
        {currentShape && renderShape({ ...currentShape, stroke: '#ff6352' })}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          anchorSize={8}
          anchorCornerRadius={4}
          borderStroke="#ff6352"
          anchorStroke="#ff6352"
          anchorFill="#fff"
        />
      </Layer>
    </Stage>
  );
}
