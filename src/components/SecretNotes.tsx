import React, { useState, useEffect } from 'react';
import { X, Lock, Plus, Trash2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';

interface SecretNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export function SecretNotes({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const [notes, setNotes] = useState<SecretNote[]>([]);
  const [activeNote, setActiveNote] = useState<SecretNote | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fikrati-secret-notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const saveNotes = (newNotes: SecretNote[]) => {
    setNotes(newNotes);
    localStorage.setItem('fikrati-secret-notes', JSON.stringify(newNotes));
  };

  const createNote = () => {
    const newNote: SecretNote = {
      id: Date.now().toString(),
      title: settings.language === 'ar' ? 'ملاحظة سرية جديدة' : 'New Secret Note',
      content: '',
      createdAt: Date.now()
    };
    saveNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };

  const updateActiveNote = (content: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, content };
    setActiveNote(updated);
    saveNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const updateActiveNoteTitle = (title: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, title };
    setActiveNote(updated);
    saveNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNote = (id: string) => {
    if (confirm(settings.language === 'ar' ? 'حذف هذه الملاحظة السرية نهائياً؟' : 'Delete this secret note permanently?')) {
      saveNotes(notes.filter(n => n.id !== id));
      if (activeNote?.id === id) setActiveNote(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-5xl w-full h-[80vh] text-neutral-200" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-neutral-800 flex flex-col bg-neutral-950">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
            <h2 className="text-xl font-bold font-mono flex items-center gap-2 text-red-500">
              <Lock size={20} />
              {settings.language === 'ar' ? 'خزنة الأسرار' : 'Secret Vault'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-red-500 hover:text-white rounded-full transition-colors md:hidden">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <button 
              onClick={createNote}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
            >
              <Plus size={18} /> {settings.language === 'ar' ? 'ملاحظة جديدة' : 'New Note'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {notes.map(note => (
              <div 
                key={note.id}
                onClick={() => setActiveNote(note)}
                className={`p-3 rounded-xl cursor-pointer transition-colors group flex justify-between items-start ${activeNote?.id === note.id ? 'bg-neutral-800 border border-neutral-700' : 'hover:bg-neutral-900 border border-transparent'}`}
              >
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold truncate text-neutral-200">{note.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="text-neutral-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-neutral-600 p-4 text-sm font-mono">
                {settings.language === 'ar' ? 'لا توجد ملاحظات سرية' : 'No secret notes'}
              </p>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-neutral-900 relative">
          <div className="hidden md:flex absolute top-4 left-4 z-10">
            <button onClick={onClose} className="p-2 bg-neutral-800 hover:bg-red-500 text-neutral-400 hover:text-white rounded-full transition-colors shadow-lg">
              <X size={20} />
            </button>
          </div>
          
          {activeNote ? (
            <div className="flex-1 flex flex-col p-6 h-full">
              <input 
                value={activeNote.title}
                onChange={(e) => updateActiveNoteTitle(e.target.value)}
                className="text-2xl font-bold bg-transparent border-none outline-none text-neutral-100 mb-4 px-2"
                placeholder={settings.language === 'ar' ? 'عنوان الملاحظة' : 'Note Title'}
              />
              <textarea
                value={activeNote.content}
                onChange={(e) => updateActiveNote(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 outline-none text-neutral-300 resize-none font-mono focus:ring-1 focus:ring-red-500 transition-shadow"
                placeholder={settings.language === 'ar' ? 'اكتب أسرارك هنا...' : 'Write your secrets here...'}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-600 flex-col">
              <Lock size={64} className="mb-4 opacity-20" />
              <p className="font-mono">{settings.language === 'ar' ? 'اختر ملاحظة أو أنشئ واحدة جديدة' : 'Select a note or create a new one'}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
