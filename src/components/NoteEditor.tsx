import React, { useState, useEffect, useCallback, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Edit3, Eye, Trash2, CheckSquare } from 'lucide-react';
import { db } from '../db';
import debounce from 'lodash.debounce';

interface NoteEditorProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function NoteEditor({ nodeId, onClose, onDelete }: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("ملاحظة جديدة");
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);
      const data = await db.notes.get(nodeId);
      if (data) {
        setContent(data.content);
        if (data.content.length > 0) setIsEditing(false);
      }
    };
    loadData();
  }, [nodeId]);

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
    let checkboxCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^(\s*[-*+]\s+)\[[ xX]\]/)) {
        if (checkboxCount === lineIndex) {
          if (lines[i].includes('[ ]')) {
            lines[i] = lines[i].replace('[ ]', '[x]');
          } else {
            lines[i] = lines[i].replace(/\[[xX]\]/, '[ ]');
          }
          break;
        }
        checkboxCount++;
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
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100" dir="rtl">
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
                li: ({ node, checked, children, ...props }) => {
                  if (typeof checked === 'boolean') {
                    // Extract index by finding siblings
                    let index = 0;
                    // Note: We need a reliable way to map back to original text index.
                    // ReactMarkdown provides `sourcePosition` if enabled, but simpler is counting rendered checkboxes.
                    // This is a hacky but functional approach for simple editors:
                    return (
                      <li className="flex items-start gap-2" {...props}>
                        <input type="checkbox" checked={checked} readOnly className="mt-1" />
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
