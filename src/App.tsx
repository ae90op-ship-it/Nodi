import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { GraphView } from './components/GraphView';
import { QuickAddMenu } from './components/QuickAddMenu';
import { TapeCalculator } from './components/TapeCalculator';
import { NoteEditor } from './components/NoteEditor';
import { Whiteboard } from './components/Whiteboard';
import type { AppModule } from './types';

export default function App() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Live query for all nodes to feed the graph
  const nodes = useLiveQuery(() => db.nodes.toArray(), []) || [];

  const handleAddNode = async (type: AppModule) => {
    const id = uuidv4();
    let title = 'عقدة جديدة';
    if (type === 'whiteboard') title = 'سبورة تحليل';
    if (type === 'calctape') title = 'آلة حاسبة';
    if (type === 'note') title = 'ملاحظة';
    if (type === 'drawing') title = 'رسم سريع';

    // Calculate a good starting position (centered broadly)
    const x = Math.random() * 200 - 100;
    const y = Math.random() * 200 - 100;

    await db.nodes.add({
      id,
      title,
      type,
      x,
      y,
      linkedNodeIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Initialize specific data stores
    if (type === 'calctape') {
      await db.calctapes.add({ id, lines: [], updatedAt: Date.now() });
    } else if (type === 'note') {
      await db.notes.add({ id, content: '', updatedAt: Date.now() });
    } else if (type === 'whiteboard' || type === 'drawing') {
      await db.whiteboards.add({ id, elements: [], updatedAt: Date.now() });
    }

    setActiveNodeId(id);
  };

  const handleOpenNode = (id: string) => {
    setActiveNodeId(id);
  };

  const handleUpdateNodePosition = async (id: string, x: number, y: number) => {
    await db.nodes.update(id, { x, y });
  };

  // Render the active view
  let content = null;
  if (activeNodeId) {
    const activeNode = nodes.find(n => n.id === activeNodeId);
    if (activeNode) {
      if (activeNode.type === 'calctape') {
        content = <TapeCalculator nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} />;
      } else if (activeNode.type === 'note') {
        content = <NoteEditor nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} />;
      } else if (activeNode.type === 'whiteboard' || activeNode.type === 'drawing') {
        content = <Whiteboard nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} />;
      }
    } else {
      setActiveNodeId(null); // Node not found
    }
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {!activeNodeId ? (
        <>
          <GraphView 
            nodes={nodes} 
            onOpenNode={handleOpenNode} 
            onUpdateNodePosition={handleUpdateNodePosition} 
          />
          <QuickAddMenu onAdd={handleAddNode} />
          {/* Top Bar Simulated */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none z-10">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pointer-events-auto">
              Nibras
            </h1>
            <div className="flex gap-2 pointer-events-auto">
              {/* Future settings / search */}
            </div>
          </div>
        </>
      ) : (
        content
      )}
    </div>
  );
}
