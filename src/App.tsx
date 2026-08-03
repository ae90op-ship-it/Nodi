import React, { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Settings as SettingsIcon, Download, Upload, Plus, Clock, ChevronRight, ChevronLeft, Tag } from 'lucide-react';
import { db } from './db';
import { GraphView } from './components/GraphView';
import { QuickAddMenu } from './components/QuickAddMenu';
import { TapeCalculator } from './components/TapeCalculator';
import { NoteEditor } from './components/NoteEditor';
import { Whiteboard } from './components/Whiteboard';
import { SettingsModal } from './components/SettingsModal';
import { PhotoEditor } from './components/PhotoEditor';
import { Spreadsheet } from './components/Spreadsheet';
import { GravityGame } from './components/GravityGame';
import { useSettings } from './SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { VoiceRecorderOverlay } from './components/VoiceRecorderOverlay';
import type { AppModule } from './types';

export default function App() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [recentNodes, setRecentNodes] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inlineNote, setInlineNote] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  
  const createNodeFactory = useCallback(async (type: AppModule, options?: { title?: string; x?: number; y?: number; blob?: Blob; mimeType?: string; name?: string; content?: string }) => {
    try {
      const id = uuidv4();
      const t = settings.language === 'ar';
      
      let title = options?.title;
      if (!title) {
        title = t ? 'عقدة جديدة' : 'New Node';
        switch (type) {
          case 'whiteboard': title = t ? 'سبورة تحليل' : 'Analysis Board'; break;
          case 'calctape': title = t ? 'آلة حاسبة' : 'Tape Calc'; break;
          case 'note': title = t ? 'ملاحظة' : 'Note'; break;
          case 'quick_note': title = t ? 'ملاحظة سريعة' : 'Quick Note'; break;
          case 'drawing': title = t ? 'رسم سريع' : 'Quick Draw'; break;
          case 'photo_editor': title = t ? 'محرر صور' : 'Photo Editor'; break;
          case 'spreadsheet': title = t ? 'جدول بيانات' : 'Spreadsheet'; break;
          case 'voice_note': title = t ? 'ملاحظة صوتية' : 'Voice Note'; break;
          case 'media': title = options?.name || (t ? 'ملف' : 'File'); break;
        }
      }

      const x = options?.x ?? (Math.random() * 200 - 100);
      const y = options?.y ?? (Math.random() * 200 - 100);

      await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos, db.files], async () => {
        await db.nodes.add({
          id,
          title,
          type,
          x,
          y,
          linkedNodeIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: type === 'media' || type === 'voice_note',
          isPinned: false,
        });

        switch (type) {
          case 'calctape':
            await db.calctapes.add({ id, lines: [], updatedAt: Date.now() });
            break;
          case 'note':
          case 'quick_note':
            await db.notes.add({ id, content: options?.content || '', updatedAt: Date.now() });
            break;
          case 'whiteboard':
          case 'drawing':
            await db.whiteboards.add({ id, elements: [], updatedAt: Date.now() });
            break;
          case 'spreadsheet':
            await db.spreadsheets.add({ id, cells: {}, updatedAt: Date.now() });
            break;
          case 'photo_editor':
            await db.photos.add({ id, updatedAt: Date.now() });
            break;
          case 'voice_note':
          case 'media':
            if (options?.blob) {
              await db.files.add({
                id,
                blob: options.blob,
                mimeType: options.mimeType || 'application/octet-stream',
                name: options.name || title,
                updatedAt: Date.now(),
              });
            }
            break;
        }
      });
      
      setRecentNodes(prev => [id, ...prev].slice(0, 10));
      return id;
    } catch (error) {
      console.error("Failed to create node:", error);
      alert(settings.language === 'ar' ? 'حدث خطأ أثناء إنشاء العقدة.' : 'Error creating node.');
      return null;
    }
  }, [settings.language]);

  const handleMediaUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type) || file.type === type);
    
    if (!isAllowed) {
       alert(settings.language === 'ar' ? 'صيغة الملف غير مدعومة' : 'Unsupported file format');
       return;
    }

    await createNodeFactory('media', {
      title: file.name,
      blob: file,
      mimeType: file.type,
      name: file.name
    });

    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = '';
    }
  }, [createNodeFactory, settings.language]);

  const handleVoiceNoteSave = useCallback(async (blob: Blob) => {
    setShowVoiceRecorder(false);
    await createNodeFactory('voice_note', {
      blob,
      mimeType: 'audio/webm'
    });
  }, [createNodeFactory]);

  const handleInlineNoteSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineNote.trim()) return;
    
    await createNodeFactory('quick_note', {
      content: inlineNote.trim(),
      y: -150
    });
    setInlineNote('');
  }, [inlineNote, createNodeFactory]);


  useEffect(() => {
    const handleSave = () => {
      setIsSaved(true);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => setIsSaved(false), 2000);
    };
    window.addEventListener('dataSaved', handleSave);
    return () => {
      window.removeEventListener('dataSaved', handleSave);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  const nodes = useLiveQuery(() => db.nodes.toArray(), []) || [];
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    nodes.forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [nodes]);

  const handleAddNode = useCallback(async (type: AppModule = 'note') => {
    const id = await createNodeFactory(type);
    if (id) setActiveNodeId(id);
  }, [createNodeFactory]);

  useKeyboardShortcuts(() => handleAddNode('note'));

  const handleOpenNode = useCallback((id: string) => {
    setActiveNodeId(id);
    setRecentNodes(prev => {
      const filtered = prev.filter(nId => nId !== id);
      return [id, ...filtered].slice(0, 10);
    });
  }, []);

  const handleUpdateNodePosition = useCallback(async (id: string, x: number, y: number) => {
    await db.nodes.update(id, { x, y });
  }, []);

  const handleDeleteNode = useCallback(async (id: string, type: AppModule) => {
    try {
      await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos], async () => {
        await db.nodes.delete(id);
        switch (type) {
          case 'calctape': await db.calctapes.delete(id); break;
          case 'note':
          case 'quick_note': await db.notes.delete(id); break;
          case 'whiteboard':
          case 'drawing': await db.whiteboards.delete(id); break;
          case 'spreadsheet': await db.spreadsheets.delete(id); break;
          case 'photo_editor': await db.photos.delete(id); break;
          case 'voice_note':
          case 'media': await db.files.delete(id); break;
          default: break;
        }
      });
      if (activeNodeId === id) {
        setActiveNodeId(null);
      }
    } catch (e) {
      console.error("Failed to delete node:", e);
    }
  }, [activeNodeId]);

  const activeNode = activeNodeId ? nodes.find(n => n.id === activeNodeId) : null;
  
  useEffect(() => {
    if (activeNodeId && nodes.length > 0 && !activeNode) {
      setActiveNodeId(null);
    }
  }, [activeNodeId, activeNode, nodes.length]);

  const renderContent = () => {
    if (!activeNode) return null;
    
    const onDelete = () => handleDeleteNode(activeNode.id, activeNode.type);

    if (activeNode.type === 'calctape') {
      return <TapeCalculator nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} onDelete={onDelete} />;
    } else if (activeNode.type === 'note' || activeNode.type === 'quick_note') {
      return <NoteEditor nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} onDelete={onDelete} />;
    } else if (activeNode.type === 'whiteboard' || activeNode.type === 'drawing') {
      return <Whiteboard nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} onDelete={onDelete} />;
    } else if (activeNode.type === 'photo_editor') {
      return <PhotoEditor nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} onDelete={onDelete} />;
    } else if (activeNode.type === 'spreadsheet') {
      return <Spreadsheet nodeId={activeNode.id} onClose={() => setActiveNodeId(null)} onDelete={onDelete} />;
    }
    return null;
  };

  const exportData = async () => {
    const allNodes = await db.nodes.toArray();
    const calctapes = await db.calctapes.toArray();
    const notes = await db.notes.toArray();
    const whiteboards = await db.whiteboards.toArray();
    const spreadsheets = await db.spreadsheets.toArray();
    const photos = await db.photos.toArray();
    const data = { nodes: allNodes, calctapes, notes, whiteboards, spreadsheets, photos };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nibras-backup.json';
    a.click();
  };

  const handleSecretCode = useCallback(async (code: string) => {
    switch (code) {
      case '1001': // Dark Mode OLED
        updateSettings({ theme: 'dark', backgroundColor: '#000000' });
        break;
      case '1002': // Dot Grid
        updateSettings({ backgroundImage: 'radial-gradient(circle, #555 1px, transparent 1px)', canvasOpacity: 15 });
        break;
      case '2001': // Quick Note
        handleAddNode('quick_note');
        setIsSettingsOpen(false);
        break;
      case '2002': // Photo Editor
        handleAddNode('photo_editor');
        setIsSettingsOpen(false);
        break;
      case '2003': // Spreadsheet
        handleAddNode('spreadsheet');
        setIsSettingsOpen(false);
        break;
      case '3001': // Export Data
        exportData();
        break;
      case '3600': // Game
        setIsGameOpen(true);
        setIsSettingsOpen(false);
        break;
      case '3002': // Delete all
        try {
          const allNodes = await db.nodes.toArray();
          for (const n of allNodes) {
            await handleDeleteNode(n.id, n.type);
          }
        } catch (e) { console.error(e); }
        break;
      case '4001': // Focus Mode
        setIsFocusMode(prev => !prev);
        setIsSettingsOpen(false);
        break;
      case '4002': // Reset Graph Layout
        try {
          const allNodes = await db.nodes.toArray();
          for (const n of allNodes) {
            await db.nodes.update(n.id, { x: 0, y: 0 });
          }
        } catch (e) { console.error(e); }
        break;
      case '5001': // Toggle Language
        updateSettings({ language: settings.language === 'ar' ? 'en' : 'ar' });
        break;
      case '5002': // Animated Gradient
        updateSettings({ backgroundColor: 'linear-gradient(270deg, #ff7eb3, #ff758c, #ff7eb3)', backgroundImage: 'none' }); // Simplistic simulation
        break;
      case '7001': // Stats
        db.nodes.count().then(c => alert(`Total Nodes: ${c}`));
        break;
      case '8001': // Random Test Nodes
        for(let i=0; i<5; i++) {
          handleAddNode('note');
        }
        break;
      case '9001': // Fake Lock
        setIsLocked(true);
        setIsSettingsOpen(false);
        break;
      default:
        break;
    }
  }, [updateSettings, handleAddNode, handleDeleteNode, settings.language]);

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos], async () => {
          await db.nodes.clear();
          await db.calctapes.clear();
          await db.notes.clear();
          await db.whiteboards.clear();
          await db.spreadsheets.clear();
          await db.photos.clear();
          
          if (data.nodes) await db.nodes.bulkAdd(data.nodes);
          if (data.calctapes) await db.calctapes.bulkAdd(data.calctapes);
          if (data.notes) await db.notes.bulkAdd(data.notes);
          if (data.whiteboards) await db.whiteboards.bulkAdd(data.whiteboards);
          if (data.spreadsheets) await db.spreadsheets.bulkAdd(data.spreadsheets);
          if (data.photos) await db.photos.bulkAdd(data.photos);
        });
        alert(settings.language === 'ar' ? 'تم استيراد البيانات بنجاح!' : 'Data imported successfully!');
      } catch (err) {
        console.error(err);
        alert(settings.language === 'ar' ? 'فشل استيراد البيانات.' : 'Failed to import data.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative flex flex-col transition-colors duration-300"
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {!activeNodeId ? (
        <div className="w-full h-full relative fade-in">
          {/* Graph Background Overlay */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
            style={{
              backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: settings.canvasOpacity / 100
            }}
          />
          <div className="absolute inset-0 z-10">
            <GraphView 
              nodes={nodes} 
              onOpenNode={handleOpenNode} 
              onUpdateNodePosition={handleUpdateNodePosition}
              onDeleteNode={handleDeleteNode}
              searchQuery={deferredSearchQuery}
            />
          </div>
          <div className="z-20 relative">
            <QuickAddMenu 
              onAdd={handleAddNode} 
              onRecordAudio={() => setShowVoiceRecorder(true)}
              onUploadMedia={() => mediaFileInputRef.current?.click()}
            />
          </div>
          
          <input 
            type="file" 
            ref={mediaFileInputRef} 
            className="hidden" 
            onChange={handleMediaUpload} 
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          {showVoiceRecorder && (
            <VoiceRecorderOverlay 
              onSave={handleVoiceNoteSave} 
              onCancel={() => setShowVoiceRecorder(false)} 
            />
          )}

          {/* Recent Nodes Sidebar */}
          <div className={`absolute top-24 ${settings.language === 'ar' ? 'right-0' : 'left-0'} z-30 flex items-start pointer-events-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : settings.language === 'ar' ? 'translate-x-[calc(100%-40px)]' : '-translate-x-[calc(100%-40px)]'}`}>
            <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-r-2xl shadow-xl w-64 max-h-[60vh] overflow-hidden flex flex-col pointer-events-auto" dir={settings.language === 'ar' ? 'rtl' : 'ltr'} style={{ borderRadius: settings.language === 'ar' ? '1rem 0 0 1rem' : '0 1rem 1rem 0' }}>
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-black/5 dark:bg-white/5">
                <h3 className="font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                  <Clock size={18} className="text-blue-500" />
                  {settings.language === 'ar' ? 'السجل الأخير' : 'Recent Nodes'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {recentNodes.length === 0 ? (
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center py-4">
                    {settings.language === 'ar' ? 'لا يوجد سجل' : 'No history yet'}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {recentNodes.map(id => {
                      const node = nodes.find(n => n.id === id);
                      if (!node) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => handleOpenNode(id)}
                          className="text-left w-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-sm truncate text-neutral-700 dark:text-neutral-300 transition-colors"
                        >
                          {node.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 p-2 shadow-xl pointer-events-auto hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
              style={{ borderRadius: settings.language === 'ar' ? '1rem 0 0 1rem' : '0 1rem 1rem 0' }}
            >
              {settings.language === 'ar' ? (isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />) : (isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />)}
            </button>
          </div>

          {/* Top Bar Area */}
          {!isFocusMode && (
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col gap-4 pointer-events-none z-30 fade-in">
              <div className="flex justify-between items-start w-full">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-5 py-2 md:px-6 md:py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 pointer-events-auto shadow-sm flex items-center gap-4">
                  <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
                    Nibras
                  </h1>
                  {isSaved && (
                    <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full animate-fade-in-up">
                      {settings.language === 'ar' ? 'تم الحفظ' : 'Saved'}
                    </span>
                  )}
                </div>
                
                {/* Inline Quick Note Form */}
                <form 
                  onSubmit={handleInlineNoteSubmit} 
                  className="hidden md:flex flex-1 max-w-md mx-4 pointer-events-auto"
                >
                  <input 
                    type="text" 
                    value={inlineNote}
                    onChange={e => setInlineNote(e.target.value)}
                    placeholder={settings.language === 'ar' ? 'اكتب ملاحظة سريعة ثم اضغط Enter...' : 'Type a quick note & press Enter...'}
                    className="w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl py-2 px-4 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm placeholder:text-neutral-400"
                  />
                </form>

                <div className="flex gap-2 md:gap-4 pointer-events-auto items-center">
                  {/* Import/Export */}
                  <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={importData} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 md:p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl transition-all shadow-sm active:scale-95"
                    title={settings.language === 'ar' ? 'استيراد نسخة احتياطية' : 'Import Backup'}
                  >
                    <Upload size={20} />
                  </button>
                  <button 
                    onClick={exportData}
                    className="p-2 md:p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl transition-all shadow-sm active:scale-95"
                    title={settings.language === 'ar' ? 'تصدير نسخة احتياطية' : 'Export Backup'}
                  >
                    <Download size={20} />
                  </button>

                  {/* Search Bar */}
                  <div className="relative group hidden sm:block">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder={settings.language === 'ar' ? 'البحث عن عقدة...' : 'Search nodes...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-2xl py-2 md:py-3 pr-11 pl-4 w-48 focus:w-64 outline-none focus:border-blue-500/50 transition-all duration-300 placeholder:text-neutral-400 shadow-sm"
                    />
                  </div>

                  {/* Settings Button */}
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 md:p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl transition-all shadow-sm active:scale-95"
                  >
                    <SettingsIcon size={22} />
                  </button>
                </div>
              </div>

              {/* Tag Filters */}
              {uniqueTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pointer-events-auto">
                  <Tag size={16} className="text-neutral-500 mr-1" />
                  {uniqueTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (searchQuery === tag) {
                          setSearchQuery('');
                        } else {
                          setSearchQuery(tag);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors shadow-sm ${searchQuery === tag ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full bg-white dark:bg-neutral-900 overflow-hidden fade-in z-40 relative">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      )}

      <ErrorBoundary><SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSecretCode={handleSecretCode} /></ErrorBoundary>
      
      {isGameOpen && <ErrorBoundary><GravityGame onClose={() => setIsGameOpen(false)} /></ErrorBoundary>}
      
      {isLocked && (
        <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-white fade-in">
          <div className="p-4 bg-red-500 rounded-full mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{settings.language === 'ar' ? 'واجهة مقفلة' : 'Interface Locked'}</h2>
          <p className="text-neutral-400 mb-8">{settings.language === 'ar' ? 'قم بإدخال رمز الفك للمتابعة.' : 'Enter unlock code to continue.'}</p>
          <input 
            type="password" 
            placeholder="****"
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 w-48 text-center text-2xl tracking-widest outline-none focus:border-blue-500 transition-colors"
            onChange={(e) => {
              if(e.target.value === '9001') setIsLocked(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
