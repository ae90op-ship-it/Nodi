import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { ArrowLeft, Save, Edit3, Eye } from 'lucide-react';
import { db } from '../db';

interface NoteEditorProps {
  nodeId: string;
  onClose: () => void;
}

export function NoteEditor({ nodeId, onClose }: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("ملاحظة جديدة");
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    async function loadData() {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);

      const data = await db.notes.get(nodeId);
      if (data) {
        setContent(data.content);
      }
    }
    loadData();
  }, [nodeId]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle, updatedAt: Date.now() });
  };

  const saveState = async () => {
    await db.notes.put({
      id: nodeId,
      content,
      updatedAt: Date.now()
    });
  };

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => saveState(), 1000);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <input 
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-lg font-semibold outline-none focus:border-b focus:border-amber-500 w-64"
            placeholder="عنوان الملاحظة"
          />
        </div>
        <div className="flex gap-2 bg-neutral-800 rounded-lg p-1">
          <button 
            onClick={() => setIsEditing(true)} 
            className={`p-2 rounded-md flex items-center gap-2 ${isEditing ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <Edit3 size={16} /> <span className="text-sm">تعديل</span>
          </button>
          <button 
            onClick={() => setIsEditing(false)} 
            className={`p-2 rounded-md flex items-center gap-2 ${!isEditing ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            <Eye size={16} /> <span className="text-sm">معاينة</span>
          </button>
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent outline-none resize-none text-lg leading-relaxed text-neutral-300 placeholder:text-neutral-600"
            placeholder="اكتب ملاحظاتك هنا... يدعم Markdown"
          />
        ) : (
          <div className="prose prose-invert prose-amber max-w-none markdown-body" dir="auto">
            <Markdown>{content || '*لا يوجد محتوى بعد.*'}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
