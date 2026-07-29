import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Text as KonvaText, Rect } from 'react-konva';
import { ArrowLeft, Pen, Square, Type, MousePointer2, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { WhiteboardElement, WhiteboardData } from '../types';

interface WhiteboardProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function Whiteboard({ nodeId, onClose, onDelete }: WhiteboardProps) {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [title, setTitle] = useState("سبورة التحليل");
  const [tool, setTool] = useState<'select' | 'pen' | 'sticky'>('pen');
  const [color, setColor] = useState('#1f2937'); // Default drawing color for white canvas
  
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);
      const data = await db.whiteboards.get(nodeId);
      if (data) setElements(data.elements || []);
      
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
        setIsReady(true);
      }
    };
    loadData();

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodeId]);

  const triggerSave = useCallback(async (newElements: WhiteboardElement[]) => {
    await db.whiteboards.put({
      id: nodeId,
      elements: newElements,
      updatedAt: Date.now()
    });
  }, [nodeId]);

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'pen') {
      const newElement: WhiteboardElement = {
        id: uuidv4(),
        type: 'path',
        x: 0,
        y: 0,
        points: [pos.x, pos.y],
        color,
      };
      setElements(prev => [...prev, newElement]);
    } else if (tool === 'sticky') {
      const newElement: WhiteboardElement = {
        id: uuidv4(),
        type: 'sticky',
        x: pos.x - 75,
        y: pos.y - 75,
        width: 150,
        height: 150,
        color: '#fef08a',
        text: 'ملاحظة'
      };
      const updated = [...elements, newElement];
      setElements(updated);
      triggerSave(updated);
      isDrawing.current = false;
      setTool('select');
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || tool !== 'pen') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastElement = { ...elements[elements.length - 1] };
    if (lastElement.type === 'path' && lastElement.points) {
      lastElement.points = lastElement.points.concat([point.x, point.y]);
      const newElements = [...elements];
      newElements[newElements.length - 1] = lastElement;
      setElements(newElements);
    }
  };

  const handleMouseUp = () => {
    if (tool === 'pen' && isDrawing.current) {
      triggerSave(elements);
    }
    isDrawing.current = false;
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle });
  };

  const handleDragEnd = (e: any, id: string) => {
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, x: e.target.x(), y: e.target.y() };
      }
      return el;
    });
    setElements(updated);
    triggerSave(updated);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 z-10 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <input 
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-lg font-semibold outline-none focus:border-b focus:border-blue-500 w-48 md:w-64"
            placeholder="عنوان السبورة"
          />
        </div>
        
        {/* Toolbelt */}
        <div className="flex items-center gap-2">
          {onDelete && (
            <button onClick={onDelete} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors" title="حذف">
              <Trash2 size={20} />
            </button>
          )}
          <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
            <button 
              onClick={() => setTool('select')} 
              className={`p-2 rounded-md transition-colors ${tool === 'select' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
            >
              <MousePointer2 size={18} />
            </button>
            <button 
              onClick={() => setTool('pen')} 
              className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
            >
              <Pen size={18} />
            </button>
            <button 
              onClick={() => setTool('sticky')} 
              className={`p-2 rounded-md flex items-center gap-1 transition-colors ${tool === 'sticky' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
            >
              <Square size={18} fill="#fef08a" className="text-transparent" />
              <span className="text-xs hidden sm:inline">ملاحظة</span>
            </button>
            
            <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700 my-auto mx-1 hidden sm:block" />
            
            {/* Colors */}
            <div className="flex items-center gap-1">
              {['#1f2937', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full mx-1 border-2 shrink-0 ${color === c ? 'border-neutral-400 dark:border-white shadow-sm' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white overflow-hidden cursor-crosshair relative shadow-inner" ref={containerRef}>
        {isReady && (
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              {elements.map((el, i) => {
                if (el.type === 'path') {
                  return (
                    <Line
                      key={el.id}
                      points={el.points || []}
                      stroke={el.color || '#1f2937'}
                      strokeWidth={3}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                } else if (el.type === 'sticky') {
                  return (
                    <React.Fragment key={el.id}>
                      <Rect
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        fill={el.color}
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.1}
                        shadowOffset={{ x: 2, y: 2 }}
                        cornerRadius={4}
                        draggable={tool === 'select'}
                        onDragEnd={(e) => handleDragEnd(e, el.id)}
                      />
                      <KonvaText
                        x={el.x! + 10}
                        y={el.y! + 10}
                        text={el.text}
                        fontSize={16}
                        fill="#000"
                        width={el.width! - 20}
                      />
                    </React.Fragment>
                  );
                }
                return null;
              })}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
