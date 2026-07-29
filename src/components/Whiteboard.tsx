import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Text as KonvaText, Rect } from 'react-konva';
import { ArrowLeft, Pen, Square, Type, MousePointer2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { WhiteboardElement, WhiteboardData } from '../types';

interface WhiteboardProps {
  nodeId: string;
  onClose: () => void;
}

export function Whiteboard({ nodeId, onClose }: WhiteboardProps) {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [title, setTitle] = useState("سبورة التحليل");
  const [tool, setTool] = useState<'select' | 'pen' | 'sticky'>('pen');
  const [color, setColor] = useState('#3b82f6');
  const isDrawing = useRef(false);
  
  // Responsive stage sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    async function loadData() {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);

      const data = await db.whiteboards.get(nodeId);
      if (data) setElements(data.elements);
    }
    loadData();
  }, [nodeId]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle, updatedAt: Date.now() });
  };

  // Debounced auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback((newElements: WhiteboardElement[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await db.whiteboards.put({
        id: nodeId,
        elements: newElements,
        updatedAt: Date.now()
      });
    }, 500);
  }, [nodeId]);

  const saveState = (newElements: WhiteboardElement[]) => {
    setElements(newElements);
    triggerSave(newElements);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    
    const pos = e.target.getStage().getPointerPosition();
    
    if (tool === 'pen') {
      isDrawing.current = true;
      const newElement: WhiteboardElement = {
        id: uuidv4(),
        type: 'path',
        x: 0,
        y: 0,
        points: [pos.x, pos.y],
        color: color
      };
      setElements([...elements, newElement]);
    } else if (tool === 'sticky') {
      const newElement: WhiteboardElement = {
        id: uuidv4(),
        type: 'sticky',
        x: pos.x,
        y: pos.y,
        width: 150,
        height: 150,
        color: '#fef08a', // Yellow sticky
        text: 'ملاحظة'
      };
      saveState([...elements, newElement]);
      setTool('select');
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || tool !== 'pen') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    const lastElement = { ...elements[elements.length - 1] };
    if (lastElement.type === 'path' && lastElement.points) {
      lastElement.points = lastElement.points.concat([point.x, point.y]);
      const newElements = elements.slice(0, elements.length - 1).concat(lastElement);
      setElements(newElements);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveState(elements); // Save final stroke
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <input 
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-lg font-semibold outline-none focus:border-b focus:border-blue-500 w-64"
            placeholder="عنوان السبورة"
          />
        </div>
        
        {/* Toolbelt */}
        <div className="flex gap-2 bg-neutral-800 rounded-lg p-1 border border-neutral-700">
          <button 
            onClick={() => setTool('select')} 
            className={`p-2 rounded-md ${tool === 'select' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <MousePointer2 size={18} />
          </button>
          <button 
            onClick={() => setTool('pen')} 
            className={`p-2 rounded-md ${tool === 'pen' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <Pen size={18} />
          </button>
          <button 
            onClick={() => setTool('sticky')} 
            className={`p-2 rounded-md flex items-center gap-1 ${tool === 'sticky' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <Square size={18} fill="#fef08a" className="text-transparent" />
            <span className="text-xs">ملاحظة</span>
          </button>
          
          <div className="w-px h-6 bg-neutral-700 my-auto mx-1" />
          
          {/* Colors */}
          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff'].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full mx-1 border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-neutral-900 overflow-hidden cursor-crosshair" ref={containerRef}>
        <Stage 
          width={stageSize.width} 
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          draggable={tool === 'select'}
        >
          <Layer>
            {elements.map((el) => {
              if (el.type === 'path') {
                return (
                  <Line
                    key={el.id}
                    points={el.points || []}
                    stroke={el.color || '#fff'}
                    strokeWidth={4}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                );
              }
              if (el.type === 'sticky') {
                return (
                  <React.Fragment key={el.id}>
                    <Rect
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      fill={el.color}
                      shadowBlur={10}
                      shadowColor="black"
                      shadowOpacity={0.2}
                      draggable={tool === 'select'}
                      onDragEnd={(e) => {
                        const newElements = elements.map(item => 
                          item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                        );
                        saveState(newElements);
                      }}
                    />
                    <KonvaText
                      x={el.x + 10}
                      y={el.y + 10}
                      text={el.text}
                      fontSize={16}
                      fill="#000"
                      width={(el.width || 150) - 20}
                      draggable={tool === 'select'}
                    />
                  </React.Fragment>
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
