import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls, MiniMap,
  Background,
  useNodesState,
  useEdgesState, useOnSelectionChange,
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
import { Eye, EyeOff, PenTool, Calculator, FileText, Image as ImageIcon, ZoomIn, ZoomOut, Maximize, Minimize, Box, Search, Trash2, Grid, Copy, Lock, Unlock, Pin, Download, Palette, Link as LinkIcon, Move, Tag, Map as MapIcon } from 'lucide-react';
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
  onToggleReadOnly?: () => void;
  onTogglePin?: () => void;
  onExport?: () => void;
  onChangeColor?: (color: string) => void;
  onUpdateContent?: (content: string) => void;
  onUpdateTags?: (tags: string[]) => void;
  onConnectStart?: () => void;
} & Record<string, unknown>;

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'];

function MediaNodeContent({ nodeId, mimeType, name }: { nodeId: string, mimeType?: string, name?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url = '';
    let isMounted = true;
    
    db.files.get(nodeId).then(file => {
      if (isMounted && file && file.blob) {
        url = URL.createObjectURL(file.blob);
        setBlobUrl(url);
      } else if (isMounted && !file) {
        setError('File not found in storage');
      }
    }).catch(err => {
      if (isMounted) setError('Failed to load media');
    });
    
    return () => {
      isMounted = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [nodeId]);

  if (error) return <div className="p-4 text-red-500 text-xs text-center w-full">{error}</div>;
  if (!blobUrl) return <div className="p-4 text-neutral-500 text-xs text-center w-full animate-pulse">Loading media...</div>;

  if (mimeType?.startsWith('image/')) {
    return <img src={blobUrl} alt={name || 'image'} className="w-full h-full object-contain pointer-events-none" loading="lazy" />;
  } else if (mimeType?.startsWith('video/')) {
    return <video src={blobUrl} controls preload="none" className="w-full h-full object-contain max-h-[300px]" />;
  } else if (mimeType?.startsWith('audio/')) {
    return <div className="p-4 flex items-center justify-center bg-white/50 dark:bg-black/20 w-full"><audio src={blobUrl} controls preload="none" className="w-full max-w-[200px]" /></div>;
  } else {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-2 text-center bg-white/50 dark:bg-black/20 w-full">
        <FileText size={24} className="text-neutral-500" />
        <span className="text-xs truncate w-full max-w-[150px]">{name || 'Unknown File'}</span>
        <a href={blobUrl} download={name || 'file'} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full mt-2 hover:bg-blue-600 transition-colors pointer-events-auto">Download</a>
      </div>
    );
  }
}

const CustomNode = ({ data, selected, id }: NodeProps<FlowNode<CustomNodeData>>) => {
  const { settings } = useSettings();
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
      case 'photo_editor': return ImageIcon;
      case 'spreadsheet': return Grid;
      case 'quick_note': return FileText;
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
      case 'photo_editor': return 'text-pink-600 bg-pink-100 border-pink-300 dark:text-pink-400 dark:bg-pink-900/30 dark:border-pink-500/50';
      case 'spreadsheet': return 'text-cyan-600 bg-cyan-100 border-cyan-300 dark:text-cyan-400 dark:bg-cyan-900/30 dark:border-cyan-500/50';
      case 'quick_note': return 'text-yellow-800 bg-yellow-50 border-yellow-300 dark:text-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-600/50';
      default: return 'text-neutral-600 bg-neutral-200 border-neutral-300 dark:text-neutral-400 dark:bg-neutral-800/80 dark:border-neutral-600';
    }
  }, [data.type, data.color]);

  const customStyle = data.color ? {
    backgroundColor: `${data.color}20`,
    borderColor: data.color,
    color: data.color
  } : {};

  const isMatched = data.isMatched;
  const isCircular = data.shape === 'circular' && data.type !== 'quick_note';

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

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const renderContextMenu = () => (
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
        <label className="w-5 h-5 rounded-full hover:scale-110 transition-transform border border-neutral-300 dark:border-neutral-600 flex items-center justify-center cursor-pointer overflow-hidden" title="Custom Color">
          <input 
            type="color" 
            className="opacity-0 absolute"
            onChange={(e) => { data.onChangeColor?.(e.target.value); setShowContextMenu(false); }}
          />
          <span className="text-[10px] bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 w-full h-full block"></span>
        </label>
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
          {data.isLocked ? 'فك قفل التحريك' : 'قفل التحريك'}
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onToggleReadOnly?.(); setShowContextMenu(false); }}>
          {data.isReadOnly ? <Eye size={14} /> : <EyeOff size={14} />}
          {data.isReadOnly ? 'إلغاء القراءة فقط' : 'قراءة فقط'}
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onTogglePin?.(); setShowContextMenu(false); }}>
          <Pin size={14} />
          {data.isPinned ? 'إزالة التثبيت' : 'تثبيت في الأعلى'}
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onDuplicate?.(); setShowContextMenu(false); }}>
          <Copy size={14} /> تكرار (نسخ)
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onExport?.(); setShowContextMenu(false); }}>
          <Download size={14} /> تصدير البيانات
        </button>
        <div className="px-2 py-1 flex items-center gap-2">
          <Tag size={14} className="text-neutral-500" />
          <input 
            type="text" 
            placeholder="Tags (comma separated)"
            defaultValue={(data.tags || []).join(', ')}
            onBlur={(e) => {
              const val = e.target.value.trim();
              const newTags = val ? val.split(',').map(t => t.trim()).filter(Boolean) : [];
              data.onUpdateTags?.(newTags);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
                setShowContextMenu(false);
              }
            }}
            className="w-full text-xs bg-transparent border-b border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-blue-500 placeholder-neutral-400"
          />
        </div>
        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
        <button className="flex items-center gap-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-left" onClick={() => { data.onDelete?.(); setShowContextMenu(false); }}>
          <Trash2 size={14} /> حذف نهائي
        </button>
      </div>
    </div>
  );

  const [noteContent, setNoteContent] = useState(data.content || '');

  if (data.type === 'group') {
    return (
      <div 
        className={`border-2 border-dashed rounded-3xl transition-all duration-300 relative group
          ${data.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${colorClass || 'border-neutral-300 dark:border-neutral-700 bg-black/5 dark:bg-white/5'}
          ${selected ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{
          width: data.width || 400,
          height: data.height || 300,
          ...customStyle,
          zIndex: data.isPinned ? 40 : 0
        }}
        dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-t-3xl border-b border-black/10 dark:border-white/10">
          <span className="font-bold text-sm text-neutral-700 dark:text-neutral-300">{data.title}</span>
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              await db.nodes.update(data.id, { collapsed: !data.collapsed });
            }}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            {data.collapsed ? <Maximize size={16} /> : <Minimize size={16} />}
          </button>
        </div>
        {showContextMenu && renderContextMenu()}
      </div>
    );
  }

  if (data.type === 'media' || data.type === 'voice_note') {
    return (
      <div 
        className={`shadow-2xl border flex flex-col transition-all duration-300 relative group
          ${data.isLocked ? 'cursor-not-allowed' : 'cursor-default'}
          w-64 h-auto min-h-[100px] rounded-xl overflow-hidden
          ${colorClass}
          ${isMatched || data.isPinned ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent scale-105' : ''}
          ${!isMatched && data.searchActive && !data.isPinned ? 'opacity-30 grayscale' : 'opacity-100'}
          ${selected ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{
          ...customStyle,
          zIndex: data.isPinned ? 50 : 1
        }}
        dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {data.isPinned && <Pin size={14} className="absolute top-1 right-2 text-blue-500 z-10 drop-shadow-md" fill="currentColor" />}
        {data.isLocked && <Lock size={14} className="absolute top-1 left-2 text-red-500 z-10 drop-shadow-md" />}
        {data.isReadOnly && <Eye size={14} className="absolute top-1 left-6 text-amber-500 z-10 drop-shadow-md" />}
        
        <div className="flex-1 flex flex-col items-center justify-center relative pointer-events-none">
          <MediaNodeContent nodeId={data.id} mimeType={data.mimeType as string} name={data.title} />
        </div>

        {/* Handles */}
        
        {/* 8 Handles */}
        <Handle type="source" id="t" position={Position.Top} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="b" position={Position.Bottom} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="l" position={Position.Left} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="r" position={Position.Right} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        
        <Handle type="source" id="tl" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="tr" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="bl" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="br" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />

        
        {showContextMenu && renderContextMenu()}
      </div>
    );
  }

  if (data.type === 'quick_note') {
    return (
      <div 
        className={`shadow-2xl border flex flex-col transition-all duration-300 relative group
          ${data.isLocked ? 'cursor-not-allowed' : 'cursor-default'}
          w-64 h-64 rounded-xl overflow-hidden
          ${colorClass}
          ${isMatched || data.isPinned ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent scale-105' : ''}
          ${!isMatched && data.searchActive && !data.isPinned ? 'opacity-30 grayscale' : 'opacity-100'}
          ${selected ? 'ring-2 ring-blue-500' : ''}
        `}
        style={{
          ...customStyle,
          zIndex: data.isPinned ? 50 : 1
        }}
        dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {data.isPinned && <Pin size={14} className="absolute top-1 right-2 text-blue-500 z-10 drop-shadow-md" fill="currentColor" />}
        {data.isLocked && <Lock size={14} className="absolute top-1 left-2 text-red-500 z-10 drop-shadow-md" />}
        {data.isReadOnly && <Eye size={14} className="absolute top-1 left-6 text-amber-500 z-10 drop-shadow-md" />}
        
        {/* 8 Handles */}
        <Handle type="source" id="t" position={Position.Top} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="b" position={Position.Bottom} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="l" position={Position.Left} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="r" position={Position.Right} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        
        <Handle type="source" id="tl" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="tr" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="bl" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="br" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />

        
        <div 
          className="h-10 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center justify-center px-6 font-bold custom-drag-handle"
          style={data.color ? { backgroundColor: `${data.color}40`, borderColor: data.color } : {}}
        >
          <span className="truncate w-full text-center">{data.title}</span>
        </div>
        
        <div className="flex-1 p-3 cursor-text relative bg-white/50 dark:bg-black/20">
          <textarea 
            className="w-full h-full bg-transparent resize-none outline-none text-sm nodrag font-mono text-neutral-800 dark:text-neutral-200"
            placeholder="اكتب ملاحظتك هنا..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onBlur={() => data.onUpdateContent?.(noteContent)}
            disabled={data.isLocked}
          />
        </div>

        {showContextMenu && renderContextMenu()}
      </div>
    );
  }

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
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      title={data.title}
    >
      {/* Visual Pins & Locks */}
      {data.isPinned && <Pin size={12} className="absolute top-[-6px] right-[-6px] text-blue-500 drop-shadow-md" fill="currentColor" />}
      {data.isLocked && <Lock size={12} className="absolute bottom-[-6px] left-[-6px] text-red-500 drop-shadow-md" />}
      {data.isReadOnly && <Eye size={12} className="absolute bottom-[-6px] left-[10px] text-amber-500 drop-shadow-md" />}

      
        {/* 8 Handles */}
        <Handle type="source" id="t" position={Position.Top} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="b" position={Position.Bottom} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="l" position={Position.Left} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="r" position={Position.Right} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        
        <Handle type="source" id="tl" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="tr" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="bl" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="br" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />

      <Icon size={isCircular ? 24 : 20} />
      <span className={`font-semibold whitespace-nowrap ${isCircular ? 'text-xs truncate w-full text-center' : 'text-sm'}`}>{data.title}</span>
      {data.tags && data.tags.length > 0 && !isCircular && (
        <div className="flex gap-1 overflow-hidden absolute -bottom-2 right-2 max-w-full">
          {data.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full truncate max-w-[60px]">
              {tag}
            </span>
          ))}
        </div>
      )}
      {showContextMenu && renderContextMenu()}
      </div>
  );
};

interface CustomEdgeData {
  label: string;
  sourceNodeId: string;
  targetNodeId: string;
  onLabelChange: (sourceId: string, targetId: string, label: string) => void;
}

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
}: EdgeProps<any>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

      const dataAny = data as any;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((dataAny?.label as string) || '');

  const onLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    if (dataAny?.onLabelChange && dataAny.sourceNodeId) {
      dataAny.onLabelChange(dataAny.sourceNodeId, dataAny.targetNodeId, label);
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
  const [showMiniMap, setShowMiniMap] = useState(false);
  
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
      await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos], async () => {
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
        } else if (node.type === 'note' || node.type === 'quick_note') {
          const data = await db.notes.get(node.id);
          await db.notes.add({ id: newId, content: data?.content || '', updatedAt: Date.now() });
        } else if (node.type === 'whiteboard' || node.type === 'drawing') {
          const data = await db.whiteboards.get(node.id);
          await db.whiteboards.add({ id: newId, elements: data?.elements || [], updatedAt: Date.now() });
        } else if (node.type === 'spreadsheet') {
          const data = await db.spreadsheets.get(node.id);
          await db.spreadsheets.add({ id: newId, cells: data?.cells || {}, updatedAt: Date.now() });
        } else if (node.type === 'photo_editor') {
          const data = await db.photos.get(node.id);
          await db.photos.add({ id: newId, imageUrl: data?.imageUrl, filters: data?.filters, rotation: data?.rotation, updatedAt: Date.now() });
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
      else if (node.type === 'note' || node.type === 'quick_note') dataToExport.data = await db.notes.get(node.id);
      else if (node.type === 'spreadsheet') dataToExport.data = await db.spreadsheets.get(node.id);
      else if (node.type === 'photo_editor') dataToExport.data = await db.photos.get(node.id);
      else dataToExport.data = await db.whiteboards.get(node.id);
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `nibras-export-${node.title}.json`;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  }, []);

  const initialNodes: FlowNode[] = useMemo(() => {
    const isSearchActive = searchQuery.trim().length > 0;
    const lowerQuery = searchQuery.toLowerCase();
    
    // Determine which groups are collapsed
    const collapsedGroupIds = new Set(nodes.filter(n => n.type === 'group' && n.collapsed).map(n => n.id));

    // Sort so pinned are last (highest z-index effectively in standard render, though we use zIndex style)
    const sortedNodes = [...nodes].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? 1 : -1));

    return sortedNodes.map(n => {
      const isHidden = n.parentId ? collapsedGroupIds.has(n.parentId) : false;
      return {
        id: n.id,
        type: 'custom',
        position: { x: n.x, y: n.y },
        draggable: !n.isLocked,
        parentId: n.parentId,
        hidden: isHidden,
        style: n.type === 'group' ? { width: n.width || 400, height: n.height || 300, backgroundColor: 'transparent' } : undefined,
        data: {
          ...n,
          isMatched: isSearchActive && (n.title.toLowerCase().includes(lowerQuery) || (n.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))),
          searchActive: isSearchActive,
          shape: settings.nodeShape,
          onDelete: () => onDeleteNode(n.id, n.type),
          onDuplicate: () => handleDuplicate(n),
          onExport: () => handleExport(n),
          onToggleLock: async () => await db.nodes.update(n.id, { isLocked: !n.isLocked }),
          onToggleReadOnly: async () => await db.nodes.update(n.id, { isReadOnly: !n.isReadOnly }),
          onTogglePin: async () => await db.nodes.update(n.id, { isPinned: !n.isPinned }),
          onChangeColor: async (color: string) => await db.nodes.update(n.id, { color }),
          onUpdateContent: async (content: string) => await db.nodes.update(n.id, { content }),
          onUpdateTags: async (tags: string[]) => await db.nodes.update(n.id, { tags }),
        },
      };
    });
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
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map(n => n.id));
    },
  });

  const handleGroupNodes = async () => {
    if (selectedNodes.length < 2) return;
    
    // Calculate bounding box of selected nodes
    const selectedAppNodes = nodes.filter(n => selectedNodes.includes(n.id));
    const minX = Math.min(...selectedAppNodes.map(n => n.x));
    const minY = Math.min(...selectedAppNodes.map(n => n.y));
    const maxX = Math.max(...selectedAppNodes.map(n => n.x + 200)); // approx width
    const maxY = Math.max(...selectedAppNodes.map(n => n.y + 150)); // approx height
    
    const groupId = uuidv4();
    await db.nodes.add({
      id: groupId,
      title: 'مجموعة جديدة (Container)',
      type: 'group',
      x: minX - 50,
      y: minY - 50,
      width: (maxX - minX) + 100,
      height: (maxY - minY) + 100,
      linkedNodeIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update children to have parentId
    for (const nodeId of selectedNodes) {
      const node = await db.nodes.get(nodeId);
      if (node && node.type !== 'group') { // dont nest groups for now
        await db.nodes.update(nodeId, {
          parentId: groupId,
          // Calculate relative position to parent if ReactFlow requires it?
          // ReactFlow requires child node position to be relative to parent if it has parentId!
          x: node.x - (minX - 50),
          y: node.y - (minY - 50)
        });
      }
    }
    setSelectedNodes([]);
  };

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

  const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

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

  const handleNodeDragStart = useCallback(() => {
    document.body.classList.add('dragging-node');
  }, []);

  const handleConnectStart = useCallback(() => {
    document.body.classList.add('dragging-node');
  }, []);

  const handleConnectEnd = useCallback(() => {
    document.body.classList.remove('dragging-node');
  }, []);

  const handleNodeDragStop = (event: React.MouseEvent | MouseEvent | TouchEvent, node: FlowNode) => {
    document.body.classList.remove('dragging-node');
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
          isValidConnection={isValidConnection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
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
        <Controls className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden" />
        {showMiniMap && <MiniMap zoomable pannable className="rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden" maskColor="rgba(0,0,0,0.1)" />}
        <Panel position="bottom-right" className="mb-4 mr-4">
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            title="Toggle MiniMap"
          >
            <MapIcon size={20} />
          </button>
        </Panel>
        
        {selectedNodes.length > 1 && (
          <Panel position="top-center" className="flex gap-2 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-2 rounded-2xl shadow-xl mt-4 pointer-events-auto z-50">
            <button 
              onClick={handleGroupNodes}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold shadow-md active:scale-95 flex items-center gap-2"
            >
              <Box size={18} />
              {settings.language === 'ar' ? 'تجميع في حاوية' : 'Group in Container'}
            </button>
          </Panel>
        )}
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
