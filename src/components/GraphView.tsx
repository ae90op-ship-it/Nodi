import React, { useCallback, useMemo } from 'react';
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
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PenTool, Calculator, FileText, Image as ImageIcon } from 'lucide-react';
import type { AppNode } from '../types';

interface GraphViewProps {
  nodes: AppNode[];
  onOpenNode: (id: string) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
}

// Custom Node Component to render the styled cards on the graph
const CustomNode = ({ data }: NodeProps<FlowNode<AppNode>>) => {
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

  return (
    <div 
      className={`px-4 py-3 shadow-xl rounded-xl border ${colorClass} backdrop-blur-md min-w-[140px] flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
      dir="rtl"
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-neutral-500" />
      <Icon size={20} />
      <span className="font-semibold text-sm whitespace-nowrap">{data.title}</span>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-neutral-500" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export function GraphView({ nodes, onOpenNode, onUpdateNodePosition }: GraphViewProps) {
  // Map our AppNode to ReactFlow Node
  const initialNodes: FlowNode<AppNode>[] = nodes.map(n => ({
    id: n.id,
    type: 'custom',
    position: { x: n.x, y: n.y },
    data: n,
  }));

  // Build edges based on linkedNodeIds
  const initialEdges: Edge[] = nodes.flatMap(n => 
    n.linkedNodeIds.map(targetId => ({
      id: `e-${n.id}-${targetId}`,
      source: n.id,
      target: targetId,
      animated: true,
      style: { stroke: '#4b5563', strokeWidth: 2 }
    }))
  );

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  React.useEffect(() => {
    setNodes(nodes.map(n => ({
      id: n.id,
      type: 'custom',
      position: { x: n.x, y: n.y },
      data: n,
    })));
  }, [nodes, setNodes]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleNodeDragStop = (event: React.MouseEvent, node: FlowNode) => {
    onUpdateNodePosition(node.id, node.position.x, node.position.y);
  };

  const handleNodeClick = (event: React.MouseEvent, node: FlowNode) => {
    onOpenNode(node.id);
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a]">
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
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#262626" />
        <Controls className="bg-neutral-900 border-neutral-800 fill-neutral-400" />
      </ReactFlow>
    </div>
  );
}
