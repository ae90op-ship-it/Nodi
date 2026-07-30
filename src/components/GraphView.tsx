import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
  NodeProps,
  Node as FlowNode,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PenTool, Calculator, FileText, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Search, Trash2, Grid, Copy, Lock, Unlock, Pin, Download, Palette, Link as LinkIcon, Move } from 'lucide-react';
import type { AppNode, AppModule } from '../types';
import { db } from '../db';
import { useSettings } from '../SettingsContext';
import { v4 as uuidv4 } from 'uuid';

interface GraphViewProps {
  nodes: AppNode[];
  onOpenNode: (id: string) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onDeleteNode: (id: string, type: AppModule) => void;
  searchQuery: string;
}

type CustomNodeData = AppNode & {
  isMatched: boolean;
  searchActive: boolean;
  shape: 'rounded' | 'circular';
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleLock?: () => void;
  onTogglePin?: () => void;
  onExport?: () => void;
  onChangeColor?: (color: string) => void;
  onConnectStart?: () => void;
} & Record<string, unknown>;

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'];

const CustomNode = ({ data, selected, id }: NodeProps<FlowNode<CustomNodeData>>) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  const Icon = useMemo(() => {
    switch (data.type) {
      case 'whiteboard': return ImageIcon;
      case 'calctape': return Calculator;
      case 'note': return FileText;
      case 'drawing': return PenTool;
      default: return FileText;
    }
  }, [data.type]);

  const colorClass = useMemo(() => {
    if (data.color) return '';
    switch (data.type) {
      case 'whiteboard': return 'text-blue-600 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-500/50';
      case 'calctape': return 'text-emerald-600 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-500/50';
      case 'note': return 'text-amber-600 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-500/50';
      case 'drawing': return 'text-purple-600 bg-purple-100 border-purple-300 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-500/50';
      default: return 'text-neutral-600 bg-neutral-200 border-neutral-300 dark:text-neutral-400 dark:bg-neutral-800/80 dark:border-neutral-600';
    }
  }, [data.type, data.color]);

  const customStyle = data.color ? {
    backgroundColor: `${data.color}20`,
    borderColor: data.color,
    color: data.color
  } : {};

  const isMatched = data.isMatched;
  const isCircular = data.shape === 'circular';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      setShowContextMenu(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  return (
    <div 
      className={`shadow-lg border flex items-center justify-center gap-3 transition-all duration-300 relative group
        ${data.isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${colorClass}
        ${isCircular ? 'w-24 h-24 rounded-full flex-col gap-1 p-2' : 'px-4 py-3 rounded-xl min-w-[140px] flex-row'}
        ${isMatched || data.isPinned ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent scale-105' : ''}
        ${!isMatched && data.searchActive && !data.isPinned ? 'opacity-30 grayscale' : 'opacity-100'}
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
      style={{
        ...customStyle,
        zIndex: data.isPinned ? 50 : 1
      }}
      dir="rtl"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      title={data.title}
    >
      {/* Visual Pins & Locks */}
      {data.isPinned && <Pin size={12} className="absolute top-[-6px] right-[-6px] text-blue-500 drop-shadow-md" fill="currentColor" />}
      {data.isLocked && <Lock size={12} className="absolute bottom-[-6px] left-[-6px] text-red-500 drop-shadow-md" />}

      <Handle type="target" position={Position.Top} className={`w-3 h-3 !bg-neutral-300 dark:!bg-neutral-500 border-2 border-white dark:border-[#0a0a0a] hover:!bg-blue-500 transition-colors ${isCircular ? 'top-[-4px]' : ''}`} isConnectable={!data.isLocked} />
      <Icon size={isCircular ? 24 : 20} />
      <span className={`font-semibold whitespace-nowrap ${isCircular ? 'text-xs truncate w-full text-center' : 'text-sm'}`}>{data.title}</span>
      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 !bg-neutral-300 dark:!bg-neutral-500 border-2 border-white dark:border-[#0a0a0a] hover:!bg-blue-500 transition-colors ${isCircular ? 'bottom-[-4px]' : ''}`} isConnectable={!data.isLocked} />

      {/* Context Menu Overlay */}
      {showContextMenu && (
        <div 
          ref={contextMenuRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-[100] nodrag nopan text-sm text-neutral-800 dark:text-neutral-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-2 grid grid-cols-6 gap-1 border-b border-neutral-200 dark:border-neutral-700">
            {COLORS.map(c => (
              <button 
                key={c}
                onClick={() => { data.onChangeColor?.(c); setShowContextMenu(false); }}
                className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
            <button 
              onClick={() => { data.onChangeColor?.(''); setShowContextMenu(false); }}
              className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-[10px]"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col p-1">
             <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onToggleLock?.(); setShowContextMenu(false); }}>
              {data.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
              {data.isLocked ? 'فك القفل' : 'قفل العقدة'}
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onTogglePin?.(); setShowContextMenu(false); }}>
              <Pin size={14} />
              {data.isPinned ? 'إزالة التثبيت' : 'تثبيت في الأعلى'}
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onDuplicate?.(); setShowContextMenu(false); }}>
              <Copy size={14} />
              تكرار (نسخ)
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onExport?.(); setShowContextMenu(false); }}>
              <Download size={14} />
              تصدير البيانات
            </button>
            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
            <button className="flex items-center gap-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-left" onClick={() => { data.onDelete?.(); setShowContextMenu(false); }}>
              <Trash2 size={14} />
              حذف نهائي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || '');

  const onLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    if (data?.onLabelChange && data.sourceNodeId) {
      data.onLabelChange(data.sourceNodeId, data.targetNodeId, label);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              className="bg-white dark:bg-neutral-800 text-xs px-2 py-1 rounded border border-blue-500 outline-none shadow-sm dark:text-white"
            />
          ) : (
            <div 
              onClick={onLabelClick}
              className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-xs px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm"
            >
              {label || '+ إضافة تصنيف'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { customEdge: CustomEdge };

function Flow({ nodes, onOpenNode, onUpdateNodePosition, onDeleteNode, searchQuery }: GraphViewProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { settings } = useSettings();
  
  const handleLabelChange = async (sourceId: string, targetId: string, label: string) => {
    const node = await db.nodes.get(sourceId);
    if (node) {
      const edgeLabels = node.edgeLabels || {};
      edgeLabels[targetId] = label;
      await db.nodes.update(sourceId, { edgeLabels });
    }
  };

  const handleDuplicate = useCallback(async (node: AppNode) => {
    try {
      const newId = uuidv4();
      await db.transaction('rw', db.nodes, db.calctapes, db.notes, db.whiteboards, async () => {
        await db.nodes.add({
          ...node,
          id: newId,
          x: node.x + 50,
          y: node.y + 50,
          linkedNodeIds: [],
          edgeLabels: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        if (node.type === 'calctape') {
          const data = await db.calctapes.get(node.id);
          await db.calctapes.add({ id: newId, lines: data?.lines || [], updatedAt: Date.now() });
        } else if (node.type === 'note') {
          const data = await db.notes.get(node.id);
          await db.notes.add({ id: newId, content: data?.content || '', updatedAt: Date.now() });
        } else if (node.type === 'whiteboard' || node.type === 'drawing') {
          const data = await db.whiteboards.get(node.id);
          await db.whiteboards.add({ id: newId, elements: data?.elements || [], updatedAt: Date.now() });
        }
      });
    } catch (e) {
      console.error("Duplicate failed", e);
    }
  }, []);

  const handleExport = useCallback(async (node: AppNode) => {
    try {
      let dataToExport: any = { node };
      if (node.type === 'calctape') dataToExport.data = await db.calctapes.get(node.id);
      else if (node.type === 'note') dataToExport.data = await db.notes.get(node.id);
      else dataToExport.data = await db.whiteboards.get(node.id);
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nibras-export-${node.title}.json`;
      a.click();
    } catch (e) {
      console.error("Export failed", e);
    }
  }, []);

  const initialNodes: FlowNode[] = useMemo(() => {
    const isSearchActive = searchQuery.trim().length > 0;
    const lowerQuery = searchQuery.toLowerCase();
    
    // Sort so pinned are last (highest z-index effectively in standard render, though we use zIndex style)
    const sortedNodes = [...nodes].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? 1 : -1));

    return sortedNodes.map(n => ({
      id: n.id,
      type: 'custom',
      position: { x: n.x, y: n.y },
      draggable: !n.isLocked,
      data: {
        ...n,
        isMatched: isSearchActive && n.title.toLowerCase().includes(lowerQuery),
        searchActive: isSearchActive,
        shape: settings.nodeShape,
        onDelete: () => onDeleteNode(n.id, n.type),
        onDuplicate: () => handleDuplicate(n),
        onExport: () => handleExport(n),
        onToggleLock: async () => await db.nodes.update(n.id, { isLocked: !n.isLocked }),
        onTogglePin: async () => await db.nodes.update(n.id, { isPinned: !n.isPinned }),
        onChangeColor: async (color: string) => await db.nodes.update(n.id, { color }),
      },
    }));
  }, [nodes, searchQuery, onDeleteNode, settings.nodeShape, handleDuplicate, handleExport]);

  const initialEdges: Edge[] = useMemo(() => {
    return nodes.flatMap(n => 
      n.linkedNodeIds.map(targetId => ({
        id: `e-${n.id}-${targetId}`,
        source: n.id,
        target: targetId,
        type: 'customEdge',
        animated: true,
        style: { stroke: settings.theme === 'dark' ? '#52525b' : '#a1a1aa', strokeWidth: 2, opacity: 0.8 },
        data: {
          label: n.edgeLabels?.[targetId] || '',
          sourceNodeId: n.id,
          targetNodeId: targetId,
          onLabelChange: handleLabelChange
        }
      }))
    );
  }, [nodes, settings.theme]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const matchedNodes = initialNodes.filter(n => n.data.isMatched);
      if (matchedNodes.length > 0) {
        fitView({ nodes: matchedNodes, duration: 800, padding: 0.5 });
      }
    }
  }, [searchQuery, initialNodes, fitView]);

  const onConnect = useCallback(async (params: Connection) => {
    if (params.source && params.target) {
      setEdges((eds) => addEdge({ ...params, type: 'customEdge' }, eds));
      const sourceNode = await db.nodes.get(params.source);
      if (sourceNode && !sourceNode.linkedNodeIds.includes(params.target)) {
        await db.nodes.update(params.source, {
          linkedNodeIds: [...sourceNode.linkedNodeIds, params.target]
        });
      }
    }
  }, [setEdges]);

  const handleNodeDragStop = (event: React.MouseEvent | MouseEvent | TouchEvent, node: FlowNode) => {
    onUpdateNodePosition(node.id, node.position.x, node.position.y);
  };

  const handleNodeClick = (event: React.MouseEvent | MouseEvent | TouchEvent, node: FlowNode) => {
    onOpenNode(node.id);
  };

  return (
    <>
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className={settings.theme === 'dark' ? 'dark' : ''}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        snapToGrid={settings.snapToGrid}
        snapGrid={[50, 50]}
      >
        <Background variant={BackgroundVariant.Dots} gap={settings.snapToGrid ? 50 : 20} size={2} color={settings.theme === 'dark' ? '#3f3f46' : '#d4d4d8'} />
        
        <Panel position="bottom-right" className="flex gap-2 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-2 rounded-2xl shadow-xl mb-4 mr-4 pointer-events-auto">
          <button onClick={() => zoomOut()} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <ZoomOut size={20} />
          </button>
          <button onClick={() => zoomIn()} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => fitView({ duration: 800 })} className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <Maximize size={20} />
          </button>
        </Panel>
      </ReactFlow>
    </>
  );
}

export function GraphView(props: GraphViewProps) {
  return (
    <div className="w-full h-full bg-transparent">
      <ReactFlowProvider>
        <Flow {...props} />
      </ReactFlowProvider>
    </div>
  );
}
