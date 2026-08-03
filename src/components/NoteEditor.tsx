import React, { useState, useEffect, useCallback, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Edit3, Eye, Trash2, CheckSquare, Wand2, Tag } from 'lucide-react';
import { db } from '../db';
import debounce from 'lodash.debounce';
import { useSettings } from '../SettingsContext';

interface NoteEditorProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function NoteEditor({ nodeId, onClose, onDelete }: NoteEditorProps) {
  const { settings } = useSettings();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("ملاحظة جديدة");
  const [isEditing, setIsEditing] = useState(true);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const node = await db.nodes.get(nodeId);
      if (node) {
        setTitle(node.title);
        setTags(node.tags || []);
      }
      const data = await db.notes.get(nodeId);
      if (data) {
        setContent(data.content);
        if (data.content.length > 0) setIsEditing(false);
      }
    };
    loadData();
  }, [nodeId]);

  const generateTags = async () => {
    if (!content.trim() || isGeneratingTags) return;
    setIsGeneratingTags(true);
    try {
      const response = await fetch('/api/gemini/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.tags && Array.isArray(data.tags)) {
          const newTags = Array.from(new Set([...tags, ...data.tags]));
          setTags(newTags);
          await db.nodes.update(nodeId, { tags: newTags });
        }
      }
    } catch (e) {
      console.error('Failed to generate tags:', e);
    } finally {
      setIsGeneratingTags(false);
    }
  };


  const debouncedSave = useRef(
    debounce(async (newContent: string) => {
      await db.notes.put({
        id: nodeId,
        content: newContent,
        updatedAt: Date.now()
      });
    }, 500)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave(newContent);
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle });
  };

  const toggleCheckbox = (lineIndex: number) => {
    const lines = content.split('\n');
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      if (lines[lineIndex].includes('[ ]')) {
        lines[lineIndex] = lines[lineIndex].replace('[ ]', '[x]');
      } else if (lines[lineIndex].includes('[x]') || lines[lineIndex].includes('[X]')) {
        lines[lineIndex] = lines[lineIndex].replace(/\[[xX]\]/, '[ ]');
      }
    }
    
    const newContent = lines.join('\n');
    setContent(newContent);
    debouncedSave(newContent);
  };

  const addChecklist = () => {
    const addition = "\n- [ ] مهمة جديدة\n- [ ] مهمة أخرى\n";
    setContent(prev => prev + addition);
    debouncedSave(content + addition);
    setIsEditing(true);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <input 
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-lg font-semibold outline-none focus:border-b focus:border-blue-500 w-48 md:w-64"
            placeholder="عنوان الملاحظة"
          />
        </div>
        <div className="flex gap-4 items-center">
          {tags.length > 0 && (
            <div className="hidden md:flex gap-1 items-center">
              <Tag size={14} className="text-neutral-400" />
              {tags.map(tag => (
                <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button 
            onClick={generateTags}
            disabled={isGeneratingTags}
            className={`p-2 rounded-full transition-colors hidden sm:block ${isGeneratingTags ? 'text-blue-400 animate-pulse' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}
            title="اقتراح وسوم بذكاء اصطناعي"
          >
            <Wand2 size={20} />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors" title="حذف">
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={addChecklist} 
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full transition-colors hidden sm:block" 
            title="إضافة قائمة مهام"
          >
            <CheckSquare size={20} />
          </button>
          <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
            <button 
              onClick={() => setIsEditing(true)} 
              className={`p-2 rounded-md flex items-center gap-2 transition-colors ${isEditing ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
            >
              <Edit3 size={16} /> <span className="text-sm hidden sm:inline">تعديل</span>
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className={`p-2 rounded-md flex items-center gap-2 transition-colors ${!isEditing ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'}`}
            >
              <Eye size={16} /> <span className="text-sm hidden sm:inline">معاينة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        {isEditing ? (
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full bg-transparent outline-none resize-none text-lg leading-relaxed text-neutral-800 dark:text-neutral-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
            placeholder="اكتب ملاحظاتك هنا... يدعم Markdown (يمكنك كتابة - [ ] للقوائم)"
          />
        ) : (
          <div className="prose prose-neutral dark:prose-invert prose-amber max-w-none markdown-body" dir="auto">
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={{
                ul: ({ children, ...props }) => {
                  // Reset counter for each top level render is tricky, but let's assume it renders in order.
                  // Instead of a global, let's use a simple counter for the current render pass.
                  return <ul {...props}>{children}</ul>;
                },
                li: ({ node, checked, children, ...props }: any) => {
                  if (typeof checked === 'boolean') {
                    // Extract index based on source position if possible, otherwise rely on a counter strategy.
                    // To do this simply, we will parse the position from the node if it's available.
                    // Or, we can use the line number from node.position.start.line
                    const lineIndex = node?.position?.start?.line ? node.position.start.line - 1 : -1;
                    
                    return (
                      <li className="flex items-start gap-2" {...props}>
                        <input 
                          type="checkbox" 
                          checked={checked} 
                          onChange={() => {
                            if (lineIndex >= 0) toggleCheckbox(lineIndex);
                          }}
                          className="mt-1 cursor-pointer w-4 h-4 accent-blue-500" 
                        />
                        <span className={checked ? 'line-through opacity-60' : ''}>{children}</span>
                      </li>
                    );
                  }
                  return <li {...props}>{children}</li>;
                }
              }}
            >
              {content || '*لا يوجد محتوى بعد.*'}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
