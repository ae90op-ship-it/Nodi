import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Settings as SettingsIcon } from 'lucide-react';
import { db } from './db';
import { GraphView } from './components/GraphView';
import { QuickAddMenu } from './components/QuickAddMenu';
import { TapeCalculator } from './components/TapeCalculator';
import { NoteEditor } from './components/NoteEditor';
import { Whiteboard } from './components/Whiteboard';
import { SettingsModal } from './components/SettingsModal';
import { useSettings } from './SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { AppModule } from './types';

export default function App() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useSettings();

  // Live query for all nodes to feed the graph
  const nodes = useLiveQuery(() => db.nodes.toArray(), []) || [];

  const handleAddNode = async (type: AppModule) => {
    try {
      const id = uuidv4();
      const t = settings.language === 'ar';
      let title = t ? 'عقدة جديدة' : 'New Node';
      if (type === 'whiteboard') title = t ? 'سبورة تحليل' : 'Analysis Board';
      if (type === 'calctape') title = t ? 'آلة حاسبة' : 'Tape Calc';
      if (type === 'note') title = t ? 'ملاحظة' : 'Note';
      if (type === 'drawing') title = t ? 'رسم سريع' : 'Quick Draw';

      // Calculate a good starting position
      const x = Math.random() * 200 - 100;
      const y = Math.random() * 200 - 100;

      // Use Dexie transaction to ensure data integrity
      await db.transaction('rw', db.nodes, db.calctapes, db.notes, db.whiteboards, async () => {
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
      });

      setActiveNodeId(id);
    } catch (error) {
      console.error("Failed to add node transaction:", error);
      alert("حدث خطأ أثناء إنشاء العقدة.");
    }
  };

  const handleOpenNode = useCallback((id: string) => {
    setActiveNodeId(id);
  }, []);

  const handleUpdateNodePosition = useCallback(async (id: string, x: number, y: number) => {
    await db.nodes.update(id, { x, y });
  }, []);

  const activeNode = activeNodeId ? nodes.find(n => n.id === activeNodeId) : null;
  // Clear activeNodeId if node doesn't exist anymore to avoid blank screen
  useEffect(() => {
    if (activeNodeId && nodes.length > 0 && !activeNode) {
      setActiveNodeId(null);
    }
  }, [activeNodeId, activeNode, nodes.length]);

  // Render the active view
  const renderContent = () => {
    if (!activeNode) return null;
    
    if (activeNode.type === 'calctape') {
      return <TapeCalculator nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} />;
    } else if (activeNode.type === 'note') {
      return <NoteEditor nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} />;
    } else if (activeNode.type === 'whiteboard' || activeNode.type === 'drawing') {
      return <Whiteboard nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} />;
    }
    return null;
  };

  return (
    <div 
      className="w-screen h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-500"
      style={{ 
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="w-full h-full max-w-[1600px] bg-neutral-950/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-neutral-800/50 overflow-hidden relative"
        dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      >
        <AnimatePresence mode="wait">
          {!activeNodeId ? (
            <motion.div 
              key="graph"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full relative"
            >
              <GraphView 
                nodes={nodes} 
                onOpenNode={handleOpenNode} 
                onUpdateNodePosition={handleUpdateNodePosition}
                searchQuery={searchQuery}
              />
              <QuickAddMenu onAdd={handleAddNode} />
              
              {/* Top Bar Simulated */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
                <div className="bg-neutral-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-neutral-800 pointer-events-auto">
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Nibras
                  </h1>
                </div>
                
                <div className="flex gap-4 pointer-events-auto items-center">
                  {/* Search Bar */}
                  <div className="relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder={settings.language === 'ar' ? 'البحث عن عقدة...' : 'Search nodes...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 text-white rounded-2xl py-3 pr-11 pl-4 w-64 focus:w-80 outline-none focus:border-blue-500/50 transition-all duration-300 placeholder:text-neutral-500"
                    />
                  </div>

                  {/* Settings Button */}
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-3 bg-neutral-900/50 backdrop-blur-md border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    <SettingsIcon size={22} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full bg-neutral-900 overflow-hidden"
            >
              <ErrorBoundary>
                {renderContent()}
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}
