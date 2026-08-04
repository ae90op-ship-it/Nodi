import React, { useState, useEffect, useCallback, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, Edit3, Eye, Trash2, CheckSquare, Wand2, Tag, Pin, Lock, Link as LinkIcon, 
  Bold, Italic, List, ListOrdered, Quote, Code, Mic, Download, Palette, Maximize, 
  Copy, Save, Clock, History, FileText, FileDown, MicOff, Play, Pause, Unlock
} from 'lucide-react';
import { db } from '../db';
import debounce from 'lodash.debounce';
import { useSettings } from '../SettingsContext';
import { NoteData, AppNode } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface NoteEditorProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function NoteEditor({ nodeId, onClose, onDelete }: NoteEditorProps) {
  const { settings } = useSettings();
  const isAr = settings.language === 'ar';
  
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("ملاحظة جديدة");
  const [node, setNode] = useState<AppNode | null>(null);
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  // Features state
  const [isLocked, setIsLocked] = useState(false); // PIN lock state
  const [isUnlocked, setIsUnlocked] = useState(false); // If user entered correct PIN
  const [pinInput, setPinInput] = useState('');
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b', 'transparent'];

  useEffect(() => {
    const loadData = async () => {
      const n = await db.nodes.get(nodeId);
      if (n) {
        setNode(n);
        setTitle(n.title);
        if (n.excerpt === undefined) {
            // init
        }
      }
      const data = await db.notes.get(nodeId);
      if (data) {
        setNoteData(data);
        setContent(data.content);
        if (data.pinCode) {
          setIsLocked(true);
        } else {
          setIsUnlocked(true);
        }
      }
    };
    loadData();
  }, [nodeId]);

  // Excerpt generation
  const updateExcerpt = async (text: string) => {
    const excerpt = text.substring(0, 50).replace(/\n/g, ' ') + (text.length > 50 ? '...' : '');
    await db.nodes.update(nodeId, { excerpt });
  };

  const debouncedSave = useRef(
    debounce(async (newContent: string, currentData: NoteData | null) => {
      setIsSaving(true);
      setSaveStatus(isAr ? 'جاري الحفظ...' : 'Saving...');
      
      const versions = currentData?.versions || [];
      // Keep last 10 versions, add new version every few saves (for simplicity, add on every debounced save)
      const newVersions = [{ timestamp: Date.now(), content: newContent }, ...versions].slice(0, 10);
      
      await db.notes.put({
        id: nodeId,
        content: newContent,
        updatedAt: Date.now(),
        versions: newVersions,
        pinCode: currentData?.pinCode,
        attachments: currentData?.attachments
      });
      
      await updateExcerpt(newContent);
      
      setIsSaving(false);
      setSaveStatus(isAr ? 'تم الحفظ' : 'Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (node?.isReadOnly) return;
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave(newContent, noteData);
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (node?.isReadOnly) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle });
  };

  // Feature: Pin
  const togglePin = async () => {
    if (node) {
      const newPinned = !node.isPinned;
      await db.nodes.update(nodeId, { isPinned: newPinned });
      setNode({ ...node, isPinned: newPinned });
    }
  };

  // Feature: ReadOnly
  const toggleReadOnly = async () => {
    if (node) {
      const newRO = !node.isReadOnly;
      await db.nodes.update(nodeId, { isReadOnly: newRO });
      setNode({ ...node, isReadOnly: newRO });
      if (newRO) setIsEditing(false);
    }
  };

  // Feature: Color
  const changeColor = async (color: string) => {
    if (node) {
      await db.nodes.update(nodeId, { color: color === 'transparent' ? undefined : color });
      setNode({ ...node, color: color === 'transparent' ? undefined : color });
      setShowColorPicker(false);
    }
  };

  // Feature: PIN Lock
  const setupPin = async () => {
    const pin = prompt(isAr ? 'أدخل رمز PIN جديد لحماية الملاحظة:' : 'Enter new PIN to protect note:');
    if (pin && noteData) {
      await db.notes.update(nodeId, { pinCode: pin });
      setNoteData({ ...noteData, pinCode: pin });
      alert(isAr ? 'تم تعيين الرمز بنجاح' : 'PIN set successfully');
    }
  };

  const removePin = async () => {
    if (noteData) {
      await db.notes.update(nodeId, { pinCode: undefined });
      setNoteData({ ...noteData, pinCode: undefined });
      setIsLocked(false);
      alert(isAr ? 'تم إزالة الرمز' : 'PIN removed');
    }
  };

  const unlockNote = () => {
    if (pinInput === noteData?.pinCode) {
      setIsUnlocked(true);
    } else {
      alert(isAr ? 'الرمز خاطئ' : 'Incorrect PIN');
    }
  };

  // Feature: Copy
  const copyContent = () => {
    navigator.clipboard.writeText(content);
    setSaveStatus(isAr ? 'تم النسخ' : 'Copied');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Feature: Formatting Toolbar
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || node?.isReadOnly) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);
    
    const newContent = before + prefix + selected + suffix + after;
    setContent(newContent);
    debouncedSave(newContent, noteData);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Feature: Speech to Text
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isAr ? 'متصفحك لا يدعم التعرف على الصوت' : 'Your browser does not support speech recognition');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = isAr ? 'ar-SA' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setContent(prev => {
          const newContent = prev + finalTranscript;
          debouncedSave(newContent, noteData);
          return newContent;
        });
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // Feature: Export
  const exportNote = (format: 'txt' | 'md' | 'json') => {
    let dataStr = '';
    let mimeType = '';
    let ext = '';
    
    if (format === 'txt' || format === 'md') {
      dataStr = content;
      mimeType = 'text/plain';
      ext = format;
    } else {
      dataStr = JSON.stringify({ node, noteData }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    }
    
    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  // Feature: Version History
  const restoreVersion = (verContent: string) => {
    if (node?.isReadOnly) return;
    setContent(verContent);
    debouncedSave(verContent, noteData);
    setShowHistory(false);
  };

  // Stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTime = Math.ceil(wordCount / 200) || 1; // 200 words per minute

  if (isLocked && !isUnlocked) {
    return (
      <div className="absolute inset-0 z-50 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center fade-in">
        <Lock size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-xl font-bold mb-6">{isAr ? 'الملاحظة مقفلة' : 'Note Locked'}</h2>
        <input 
          type="password"
          value={pinInput}
          onChange={e => setPinInput(e.target.value)}
          placeholder="PIN"
          className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-center mb-4 tracking-widest text-lg focus:outline-none focus:border-accent"
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">{isAr ? 'إغلاق' : 'Close'}</button>
          <button onClick={unlockNote} className="px-4 py-2 bg-accent text-white rounded-xl">{isAr ? 'فتح' : 'Unlock'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 z-50 bg-white dark:bg-neutral-900 flex flex-col fade-in ${isFullscreen ? 'fixed inset-0 z-[200]' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0" style={{ backgroundColor: node?.color ? `${node.color}20` : 'transparent' }}>
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button onClick={onClose} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={20} className={isAr ? 'rotate-180' : ''} />
          </button>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={node?.isReadOnly}
            className="font-bold text-lg md:text-xl bg-transparent outline-none border-b-2 border-transparent focus:border-accent transition-colors w-full min-w-0"
          />
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <span className="text-xs text-neutral-400 mr-2">{saveStatus}</span>
          
          <button onClick={copyContent} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full" title={isAr ? 'نسخ' : 'Copy'}>
            <Copy size={18} />
          </button>
          
          <div className="relative">
            <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full">
              <Palette size={18} />
            </button>
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-2 p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 flex gap-1 flex-wrap w-48 z-50">
                {colors.map(c => (
                  <button key={c} onClick={() => changeColor(c)} className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700" style={{ backgroundColor: c === 'transparent' ? '#fff' : c }}>
                    {c === 'transparent' && <span className="text-red-500 block text-center leading-8 text-xs font-bold">X</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowHistory(!showHistory)} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full" title={isAr ? 'السجل' : 'History'}>
            <History size={18} />
          </button>

          <button onClick={togglePin} className={`p-2 rounded-full transition-colors ${node?.isPinned ? "bg-accent text-white dark:bg-accent" : "bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100"}`}>
            <Pin size={18} fill={node?.isPinned ? "currentColor" : "none"} />
          </button>
          
          <button onClick={toggleReadOnly} className={`p-2 rounded-full transition-colors ${node?.isReadOnly ? "bg-amber-500 text-white dark:bg-amber-600" : "bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100"}`}>
            {node?.isReadOnly ? <Eye size={18} /> : <Eye size={18} />}
          </button>

          {noteData?.pinCode ? (
            <button onClick={removePin} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-red-500"><Unlock size={18} /></button>
          ) : (
            <button onClick={setupPin} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full"><Lock size={18} /></button>
          )}

          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full">
              <Download size={18} />
            </button>
            {showExport && (
              <div className="absolute top-full right-0 mt-2 py-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 w-32 z-50 flex flex-col">
                <button onClick={() => exportNote('md')} className="px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-700">Markdown (.md)</button>
                <button onClick={() => exportNote('txt')} className="px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-700">Text (.txt)</button>
                <button onClick={() => exportNote('json')} className="px-4 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-700">JSON (.json)</button>
              </div>
            )}
          </div>
          
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 bg-black/10 dark:bg-white/20 hover:bg-black/20 dark:hover:bg-white/30 text-neutral-800 dark:text-neutral-100 rounded-full hidden md:block">
            <Maximize size={18} />
          </button>

          {onDelete && (
            <button onClick={onDelete} className="p-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-full transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {!node?.isReadOnly && (
        <div className="flex items-center gap-1 p-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto shrink-0 scrollbar-hide">
          <button onClick={() => setIsEditing(!isEditing)} className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shrink-0 ${!isEditing ? 'bg-accent text-white' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>
            {isEditing ? <Eye size={16} /> : <Edit3 size={16} />}
            {isAr ? (isEditing ? 'معاينة' : 'تعديل') : (isEditing ? 'Preview' : 'Edit')}
          </button>
          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700 mx-2 shrink-0" />
          
          <button onClick={() => insertFormatting('**', '**')} className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"><Bold size={16} /></button>
          <button onClick={() => insertFormatting('*', '*')} className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"><Italic size={16} /></button>
          <button onClick={() => insertFormatting('- ')} className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"><List size={16} /></button>
          <button onClick={() => insertFormatting('1. ')} className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"><ListOrdered size={16} /></button>
          <button onClick={() => insertFormatting('> ')} className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"><Quote size={16} /></button>
          <button onClick={() => insertFormatting('```\n', '\n```')} className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"><Code size={16} /></button>
          
          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700 mx-2 shrink-0" />
          <button onClick={toggleSpeechRecognition} className={`p-1.5 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-md flex items-center gap-1 shrink-0 transition-colors ${isRecording ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"}`}>
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span className="text-xs">{isRecording ? (isAr ? 'إيقاف' : 'Stop') : (isAr ? 'إملاء' : 'Dictate')}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Editor / Preview */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-4xl flex flex-col relative h-full">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                disabled={node?.isReadOnly}
                className="flex-1 w-full h-full bg-transparent resize-none outline-none text-lg md:text-xl leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans"
                placeholder={isAr ? 'اكتب ملاحظاتك هنا... يدعم Markdown' : 'Start typing... Supports Markdown'}
              />
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-none w-full markdown-body h-full overflow-y-auto">
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
              </div>
            )}
          </div>
        </div>
        
        {/* History Sidebar */}
        {showHistory && (
          <div className="w-64 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 overflow-y-auto shrink-0 flex flex-col">
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 font-bold text-sm">
              {isAr ? 'سجل التعديلات' : 'Version History'}
            </div>
            <div className="flex-1 p-2 flex flex-col gap-2">
              {noteData?.versions?.map((v, i) => (
                <button 
                  key={v.timestamp}
                  onClick={() => restoreVersion(v.content)}
                  className="p-3 bg-white dark:bg-neutral-800 rounded-lg text-left shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-accent transition-colors"
                >
                  <div className="text-xs text-neutral-500 mb-1">{new Date(v.timestamp).toLocaleString(isAr ? 'ar' : 'en')}</div>
                  <div className="text-sm truncate text-neutral-700 dark:text-neutral-300">{v.content.substring(0, 30) || '...'}</div>
                </button>
              ))}
              {(!noteData?.versions || noteData.versions.length === 0) && (
                <div className="text-xs text-center text-neutral-400 p-4">
                  {isAr ? 'لا يوجد سجل' : 'No history yet'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-500 flex justify-between shrink-0">
        <div className="flex gap-4">
          <span>{wordCount} {isAr ? 'كلمة' : 'words'}</span>
          <span>{charCount} {isAr ? 'حرف' : 'characters'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{readTime} {isAr ? 'دقيقة قراءة' : 'min read'}</span>
        </div>
      </div>
    </div>
  );
}
