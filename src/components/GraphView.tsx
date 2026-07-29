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
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PenTool, Calculator, FileText, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Search } from 'lucide-react';
import type { AppNode } from '../types';
import { db } from '../db';

interface GraphViewProps {
  nodes: AppNode[];
  onOpenNode: (id: string) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  searchQuery: string;
}

type CustomNodeData = AppNode & {
  isMatched: boolean;
  searchActive: boolean;
} & Record<string, unknown>;

// Custom Node Component to render the styled cards on the graph
const CustomNode = ({ data, id }: NodeProps<FlowNode<CustomNodeData>>) => {
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
      case 'whiteboard': return 'text-blue-400 bg-blue-500/10 border-blue-500/50';
      case 'calctape': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/50';
      case 'note': return 'text-amber-400 bg-amber-500/10 border-amber-500/50';
      case 'drawing': return 'text-purple-400 bg-purple-500/10 border-purple-500/50';
      default: return 'text-neutral-400 bg-neutral-800 border-neutral-600';
    }
  }, [data.type]);

  const isMatched = data.isMatched;

  return (
    <div 
      className={`px-4 py-3 shadow-xl rounded-xl border backdrop-blur-md min-w-[140px] flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 cursor-pointer
        ${colorClass}
        ${isMatched ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-105' : ''}
        ${!isMatched && data.searchActive ? 'opacity-30 grayscale' : 'opacity-100'}
      `}
      dir="rtl"
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-neutral-400 border-2 border-[#0a0a0a] hover:!bg-white transition-colors" />
      <Icon size={20} />
      <span className="font-semibold text-sm whitespace-nowrap">{data.title}</span>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-neutral-400 border-2 border-[#0a0a0a] hover:!bg-white transition-colors" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

function Flow({ nodes, onOpenNode, onUpdateNodePosition, searchQuery }: GraphViewProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // Map our AppNode to ReactFlow Node
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
        searchActive: isSearchActive
      },
    }));
  }, [nodes, searchQuery]);

  // Build edges based on linkedNodeIds
  const initialEdges: Edge[] = useMemo(() => {
    return nodes.flatMap(n => 
      n.linkedNodeIds.map(targetId => ({
        id: `e-${n.id}-${targetId}`,
        source: n.id,
        target: targetId,
        animated: true,
        style: { stroke: '#4b5563', strokeWidth: 2, opacity: 0.6 },
        type: 'smoothstep'
      }))
    );
  }, [nodes]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle focus on searched nodes
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
      setEdges((eds) => addEdge(params, eds));
      // Update DB to persist connection
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
        fitView
        className="dark"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#262626" />
        
        {/* Custom Zoom/Pan Controls */}
        <Panel position="bottom-right" className="flex gap-2 bg-neutral-900/80 backdrop-blur border border-neutral-800 p-2 rounded-2xl shadow-xl mb-4 mr-4">
          <button onClick={() => zoomOut()} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
            <ZoomOut size={20} />
          </button>
          <button onClick={() => zoomIn()} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => fitView({ duration: 800 })} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
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
