import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
import { PenTool, Calculator, FileText, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Search, Trash2, Grid } from 'lucide-react';
import type { AppNode, AppModule } from '../types';
import { db } from '../db';
import { useSettings } from '../SettingsContext';

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
} & Record<string, unknown>;

const CustomNode = ({ data, selected, id }: NodeProps<FlowNode<CustomNodeData>>) => {
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
    switch (data.type) {
      case 'whiteboard': return 'text-blue-600 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-500/50';
      case 'calctape': return 'text-emerald-600 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-500/50';
      case 'note': return 'text-amber-600 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-500/50';
      case 'drawing': return 'text-purple-600 bg-purple-100 border-purple-300 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-500/50';
      default: return 'text-neutral-600 bg-neutral-200 border-neutral-300 dark:text-neutral-400 dark:bg-neutral-800/80 dark:border-neutral-600';
    }
  }, [data.type]);

  const isMatched = data.isMatched;
  const isCircular = data.shape === 'circular';

  return (
    <div 
      className={`shadow-lg border flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 cursor-pointer relative group
        ${colorClass}
        ${isCircular ? 'w-24 h-24 rounded-full flex-col gap-1 p-2' : 'px-4 py-3 rounded-xl min-w-[140px] flex-row'}
        ${isMatched ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent scale-105' : ''}
        ${!isMatched && data.searchActive ? 'opacity-30 grayscale' : 'opacity-100'}
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
      dir="rtl"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
        className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 hover:scale-110 active:scale-95 z-10"
        title="حذف العقدة"
      >
        <Trash2 size={12} />
      </button>

      <Handle type="target" position={Position.Top} className={`w-3 h-3 !bg-neutral-300 dark:!bg-neutral-500 border-2 border-white dark:border-[#0a0a0a] hover:!bg-blue-500 transition-colors ${isCircular ? 'top-[-4px]' : ''}`} />
      <Icon size={isCircular ? 24 : 20} />
      <span className={`font-semibold whitespace-nowrap ${isCircular ? 'text-xs truncate w-full text-center' : 'text-sm'}`}>{data.title}</span>
      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 !bg-neutral-300 dark:!bg-neutral-500 border-2 border-white dark:border-[#0a0a0a] hover:!bg-blue-500 transition-colors ${isCircular ? 'bottom-[-4px]' : ''}`} />
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
  const [snapToGrid, setSnapToGrid] = useState(false);
  const { settings } = useSettings();
  
  const handleLabelChange = async (sourceId: string, targetId: string, label: string) => {
    const node = await db.nodes.get(sourceId);
    if (node) {
      const edgeLabels = node.edgeLabels || {};
      edgeLabels[targetId] = label;
      await db.nodes.update(sourceId, { edgeLabels });
    }
  };

  const initialNodes: FlowNode[] = useMemo(() => {
    const isSearchActive = searchQuery.trim().length > 0;
    const lowerQuery = searchQuery.toLowerCase();
    
    return nodes.map(n => ({
      id: n.id,
      type: 'custom',
      position: { x: n.x, y: n.y },
      data: {
        ...n,
        isMatched: isSearchActive && n.title.toLowerCase().includes(lowerQuery),
        searchActive: isSearchActive,
        shape: settings.nodeShape,
        onDelete: () => onDeleteNode(n.id, n.type)
      },
    }));
  }, [nodes, searchQuery, onDeleteNode, settings.nodeShape]);

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
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color={settings.theme === 'dark' ? '#3f3f46' : '#d4d4d8'} />
        
        <Panel position="bottom-right" className="flex gap-2 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-2 rounded-2xl shadow-xl mb-4 mr-4">
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-2 rounded-xl transition-colors ${snapToGrid ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-400'}`} title="Snap to Grid">
            <Grid size={20} />
          </button>
          <div className="w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
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
