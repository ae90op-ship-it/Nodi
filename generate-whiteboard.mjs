import fs from 'fs';
const code = `
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Text as KonvaText, Rect, Circle, Arrow, Star, Image as KonvaImage, Transformer } from 'react-konva';
import { ArrowLeft, Pen, Square, Type, MousePointer2, Trash2, Undo2, Redo2, Download, Circle as CircleIcon, MoveRight, Star as StarIcon, Eraser, Grid, Image as ImageIcon, Minus, Trash, FileBox, LayoutTemplate } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { WhiteboardElement, WhiteboardData } from '../types';

interface WhiteboardProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'star' | 'text' | 'line';

// Extended Element type for Whiteboard
export interface WBElement {
  id: string;
  type: 'path' | 'rect' | 'circle' | 'arrow' | 'star' | 'text' | 'image';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: number[];
  color?: string;
  text?: string;
  opacity?: number;
  strokeWidth?: number;
  globalCompositeOperation?: string;
  imageObj?: HTMLImageElement;
}

export function Whiteboard({ nodeId, onClose, onDelete }: WhiteboardProps) {
  const [elements, setElements] = useState<WBElement[]>([]);
  const [history, setHistory] = useState<WBElement[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  
  const [title, setTitle] = useState("سبورة التحليل");
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1f2937');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [gridSnapping, setGridSnapping] = useState(false);
  const [bgGrid, setBgGrid] = useState(false);
  
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isReady, setIsReady] = useState(false);

  // For Text editing
  const [editingText, setEditingText] = useState<{ id: string, text: string, x: number, y: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);
      const data = await db.whiteboards.get(nodeId);
      if (data && data.elements) {
        setElements(data.elements as WBElement[]);
        setHistory([data.elements as WBElement[]]);
        setHistoryStep(0);
      } else {
        setHistory([[]]);
      }
      
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

  useEffect(() => {
    if (selectedId && trRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, elements]);

  const saveToHistory = (newElements: WBElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    triggerSave(newElements);
  };

  const triggerSave = useCallback(async (newElements: WBElement[]) => {
    await db.whiteboards.put({
      id: nodeId,
      elements: newElements as any,
      updatedAt: Date.now()
    });
  }, [nodeId]);

  const undo = () => {
    if (historyStep === 0) return;
    const step = historyStep - 1;
    setHistoryStep(step);
    setElements(history[step]);
    triggerSave(history[step]);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyStep === history.length - 1) return;
    const step = historyStep + 1;
    setHistoryStep(step);
    setElements(history[step]);
    triggerSave(history[step]);
    setSelectedId(null);
  };

  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    return {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY()
    };
  };

  const snap = (val: number) => gridSnapping ? Math.round(val / 20) * 20 : val;

  const handleMouseDown = (e: any) => {
    // If clicking on empty area, deselect
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
    
    if (tool === 'select') return;
    isDrawing.current = true;
    const pos = getPointerPos();
    
    const id = uuidv4();
    let newEl: WBElement | null = null;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser' || tool === 'line') {
      newEl = {
        id,
        type: 'path',
        points: [snap(pos.x), snap(pos.y)],
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'highlighter' ? 20 : (tool === 'eraser' ? 20 : strokeWidth),
        opacity: tool === 'highlighter' ? 0.3 : opacity,
        globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
      };
    } else if (tool === 'rect') {
      newEl = { id, type: 'rect', x: snap(pos.x), y: snap(pos.y), width: 0, height: 0, color, strokeWidth, opacity };
    } else if (tool === 'circle') {
      newEl = { id, type: 'circle', x: snap(pos.x), y: snap(pos.y), width: 0, height: 0, color, strokeWidth, opacity };
    } else if (tool === 'arrow') {
      newEl = { id, type: 'arrow', points: [snap(pos.x), snap(pos.y), snap(pos.x), snap(pos.y)], color, strokeWidth, opacity };
    } else if (tool === 'star') {
      newEl = { id, type: 'star', x: snap(pos.x), y: snap(pos.y), width: 0, height: 0, color, strokeWidth, opacity };
    } else if (tool === 'text') {
      const text = prompt("أدخل النص:") || "نص جديد";
      newEl = { id, type: 'text', x: snap(pos.x), y: snap(pos.y), text, color, opacity };
      isDrawing.current = false;
    }
    
    if (newEl) {
      setElements([...elements, newEl]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const pos = getPointerPos();
    
    setElements(prev => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      
      const newLast = { ...last };
      
      if (tool === 'line') {
        newLast.points = [last.points![0], last.points![1], snap(pos.x), snap(pos.y)];
      } else if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
        newLast.points = last.points!.concat([snap(pos.x), snap(pos.y)]);
      } else if (tool === 'rect' || tool === 'circle' || tool === 'star') {
        newLast.width = snap(pos.x) - last.x!;
        newLast.height = snap(pos.y) - last.y!;
      } else if (tool === 'arrow') {
        newLast.points = [last.points![0], last.points![1], snap(pos.x), snap(pos.y)];
      }
      
      const res = [...prev];
      res[res.length - 1] = newLast;
      return res;
    });
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      saveToHistory(elements);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 10)); // Limit scale
    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        const id = uuidv4();
        const newEl: WBElement = {
          id, type: 'image', x: 100, y: 100, width: img.width / 2, height: img.height / 2, imageObj: img
        };
        const updated = [...elements, newEl];
        setElements(updated);
        saveToHistory(updated);
      };
    }
  };

  const exportCanvas = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = \`whiteboard-\${nodeId}.png\`;
      link.href = uri;
      link.click();
    }
  };

  const clearCanvas = () => {
    if (confirm("هل أنت متأكد من محو اللوحة بالكامل؟")) {
      setElements([]);
      saveToHistory([]);
      setSelectedId(null);
    }
  };

  const applyTemplate = () => {
    if (confirm("سيتم محو اللوحة الحالية وإضافة قالب جاهز، المتابعة؟")) {
      const templateElements: WBElement[] = [
        { id: uuidv4(), type: 'rect', x: 300, y: 100, width: 200, height: 80, color: '#3b82f6', opacity: 1, strokeWidth: 3 },
        { id: uuidv4(), type: 'text', x: 350, y: 130, text: 'الفكرة الرئيسية', color: '#000', opacity: 1 },
        { id: uuidv4(), type: 'arrow', points: [400, 180, 250, 280], color: '#3b82f6', strokeWidth: 3, opacity: 1 },
        { id: uuidv4(), type: 'arrow', points: [400, 180, 550, 280], color: '#3b82f6', strokeWidth: 3, opacity: 1 },
        { id: uuidv4(), type: 'circle', x: 250, y: 320, width: 100, height: 100, color: '#10b981', strokeWidth: 3, opacity: 1 },
        { id: uuidv4(), type: 'circle', x: 550, y: 320, width: 100, height: 100, color: '#10b981', strokeWidth: 3, opacity: 1 },
      ];
      setElements(templateElements);
      saveToHistory(templateElements);
    }
  };
  
  const handleDragEnd = (e: any, id: string) => {
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, x: snap(e.target.x()), y: snap(e.target.y()) };
      }
      return el;
    });
    setElements(updated);
    saveToHistory(updated);
  };
  
  const handleTransformEnd = (e: any, id: string) => {
    const node = stageRef.current.findOne('#' + id);
    const updated = elements.map(el => {
      if (el.id === id) {
        if (el.type === 'rect' || el.type === 'image' || el.type === 'circle' || el.type === 'star') {
           return {
             ...el,
             x: snap(node.x()),
             y: snap(node.y()),
             width: Math.max(5, node.width() * node.scaleX()),
             height: Math.max(5, node.height() * node.scaleY())
           };
        }
      }
      return el;
    });
    node.scaleX(1);
    node.scaleY(1);
    setElements(updated);
    saveToHistory(updated);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2 p-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-full transition-colors">
              <ArrowLeft className="rotate-180" size={18} />
            </button>
            <input 
              value={title}
              onChange={handleTitleChange}
              className="bg-transparent text-lg font-semibold outline-none focus:border-b-2 focus:border-blue-500 w-40 md:w-64"
              placeholder="عنوان السبورة"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={historyStep === 0} className="p-2 disabled:opacity-50 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full">
              <Undo2 size={18} />
            </button>
            <button onClick={redo} disabled={historyStep === history.length - 1} className="p-2 disabled:opacity-50 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full">
              <Redo2 size={18} />
            </button>
            <button onClick={exportCanvas} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full ml-2 text-blue-600 dark:text-blue-400" title="تصدير صورة">
              <Download size={18} />
            </button>
            <button onClick={applyTemplate} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full text-purple-600 dark:text-purple-400" title="قالب جاهز">
              <LayoutTemplate size={18} />
            </button>
            <button onClick={clearCanvas} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full" title="مسح اللوحة">
              <Trash size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center flex-wrap gap-2 text-sm bg-white dark:bg-neutral-950 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-x-auto">
          {/* Tools */}
          <div className="flex gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-2">
            {[
              { id: 'select', icon: MousePointer2, title: 'تحديد' },
              { id: 'pen', icon: Pen, title: 'قلم' },
              { id: 'line', icon: Minus, title: 'خط مستقيم' },
              { id: 'highlighter', icon: Pen, title: 'تظليل', cls: 'opacity-50' },
              { id: 'eraser', icon: Eraser, title: 'ممحاة' },
              { id: 'text', icon: Type, title: 'نص' },
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTool(t.id as Tool)} 
                className={\`p-1.5 rounded-lg transition-colors \${tool === t.id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}\`}
                title={t.title}
              >
                <t.icon size={18} className={t.cls || ''} />
              </button>
            ))}
          </div>

          {/* Shapes */}
          <div className="flex gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-2">
             {[
              { id: 'rect', icon: Square },
              { id: 'circle', icon: CircleIcon },
              { id: 'arrow', icon: MoveRight },
              { id: 'star', icon: StarIcon },
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTool(t.id as Tool)} 
                className={\`p-1.5 rounded-lg transition-colors \${tool === t.id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}\`}
              >
                <t.icon size={18} />
              </button>
            ))}
          </div>
          
          {/* Options */}
          <div className="flex items-center gap-3">
             <div className="flex gap-1">
              {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={\`w-6 h-6 rounded-full border-2 \${color === c ? 'border-neutral-400 dark:border-white' : 'border-transparent'}\`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-1">
              <label className="text-xs text-neutral-500">سُمك</label>
              <input type="range" min="1" max="20" value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="w-16 accent-blue-500" />
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs text-neutral-500">شفافية</label>
              <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-16 accent-blue-500" />
            </div>

            <button onClick={() => setGridSnapping(!gridSnapping)} className={\`p-1.5 rounded-lg transition-colors \${gridSnapping ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}\`} title="محاذاة الشبكة">
              <Grid size={18} />
            </button>
            
            <button onClick={() => setBgGrid(!bgGrid)} className={\`p-1.5 rounded-lg transition-colors \${bgGrid ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}\`} title="إظهار شبكة الخلفية">
              <FileBox size={18} />
            </button>
            
            <label className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
              <ImageIcon size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </div>

      <div 
        className="flex-1 overflow-hidden relative shadow-inner" 
        style={{
          backgroundColor: bgGrid ? '#f8f9fa' : '#ffffff',
          backgroundImage: bgGrid ? 'radial-gradient(#cbd5e1 1px, transparent 1px)' : 'none',
          backgroundSize: '20px 20px',
        }}
        ref={containerRef}
      >
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
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            draggable={tool === 'select'}
            ref={stageRef}
            className={tool === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}
          >
            <Layer>
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                const commonProps = {
                  id: el.id,
                  opacity: el.opacity,
                  draggable: tool === 'select',
                  onClick: () => tool === 'select' && setSelectedId(el.id),
                  onTap: () => tool === 'select' && setSelectedId(el.id),
                  onDragEnd: (e: any) => handleDragEnd(e, el.id),
                  onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                  globalCompositeOperation: el.globalCompositeOperation || 'source-over',
                };

                if (el.type === 'path' || el.type === 'line') {
                  return (
                    <Line
                      key={el.id}
                      points={el.points || []}
                      stroke={el.color || '#1f2937'}
                      strokeWidth={el.strokeWidth || 3}
                      tension={el.type === 'line' ? 0 : 0.5}
                      lineCap="round"
                      lineJoin="round"
                      {...commonProps}
                    />
                  );
                } else if (el.type === 'rect') {
                  return <Rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} stroke={el.color} strokeWidth={el.strokeWidth} fill="transparent" {...commonProps} />;
                } else if (el.type === 'circle') {
                  return <Circle key={el.id} x={el.x! + el.width!/2} y={el.y! + el.height!/2} radius={Math.abs(el.width!/2)} stroke={el.color} strokeWidth={el.strokeWidth} fill="transparent" {...commonProps} />;
                } else if (el.type === 'arrow') {
                  return <Arrow key={el.id} points={el.points || []} stroke={el.color} fill={el.color} strokeWidth={el.strokeWidth} {...commonProps} />;
                } else if (el.type === 'star') {
                  return <Star key={el.id} x={el.x! + el.width!/2} y={el.y! + el.height!/2} numPoints={5} innerRadius={Math.abs(el.width!/4)} outerRadius={Math.abs(el.width!/2)} stroke={el.color} strokeWidth={el.strokeWidth} fill="transparent" {...commonProps} />;
                } else if (el.type === 'image' && el.imageObj) {
                  return <KonvaImage key={el.id} image={el.imageObj} x={el.x} y={el.y} width={el.width} height={el.height} {...commonProps} />;
                } else if (el.type === 'text') {
                  return (
                    <KonvaText
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      text={el.text}
                      fontSize={Math.max(20, (el.strokeWidth || 3) * 5)}
                      fill={el.color}
                      {...commonProps}
                      onDblClick={() => {
                        const newText = prompt("تعديل النص:", el.text);
                        if (newText) {
                           const updated = elements.map(e => e.id === el.id ? { ...e, text: newText } : e);
                           setElements(updated);
                           saveToHistory(updated);
                        }
                      }}
                    />
                  );
                }
                return null;
              })}
              {tool === 'select' && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/Whiteboard.tsx', code);
console.log("Whiteboard updated");
