import React, { useState } from 'react';
import { Plus, PenTool, Calculator, FileText, Image as ImageIcon, Table, Camera } from 'lucide-react';
import { cn } from '../utils';
import { useSettings } from '../SettingsContext';

interface QuickAddMenuProps {
  onAdd: (type: 'whiteboard' | 'calctape' | 'note' | 'drawing' | 'photo_editor' | 'spreadsheet') => void;
}

export function QuickAddMenu({ onAdd }: QuickAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const isAr = settings.language === 'ar';
  
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSelect = (type: 'whiteboard' | 'calctape' | 'note' | 'drawing' | 'photo_editor' | 'spreadsheet') => {
    onAdd(type);
    setIsOpen(false);
  };

  return (
    <div className={`fixed bottom-6 ${isAr ? 'right-6' : 'left-6'} z-50`}>
      {/* Menu Items */}
      <div className={cn(
        "absolute bottom-16 flex flex-col gap-3 transition-all duration-300 origin-bottom",
        isAr ? "right-0 items-end" : "left-0 items-start",
        isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
      )}>
        <button 
          onClick={() => handleSelect('whiteboard')}
          className="flex items-center gap-3 bg-neutral-800 text-white rounded-full pl-4 pr-3 py-2 shadow-lg hover:bg-neutral-700 border border-neutral-700"
        >
          <span className="text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'سبورة التحليل' : 'Analysis Board'}</span>
          <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
            <ImageIcon size={18} />
          </div>
        </button>
        <button 
          onClick={() => handleSelect('calctape')}
          className="flex items-center gap-3 bg-neutral-800 text-white rounded-full pl-4 pr-3 py-2 shadow-lg hover:bg-neutral-700 border border-neutral-700"
        >
          <span className="text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'آلة حاسبة' : 'Tape Calculator'}</span>
          <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400">
            <Calculator size={18} />
          </div>
        </button>
        <button 
          onClick={() => handleSelect('note')}
          className="flex items-center gap-3 bg-neutral-800 text-white rounded-full pl-4 pr-3 py-2 shadow-lg hover:bg-neutral-700 border border-neutral-700"
        >
          <span className="text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'ملاحظات' : 'Notes'}</span>
          <div className="bg-amber-500/20 p-2 rounded-full text-amber-400">
            <FileText size={18} />
          </div>
        </button>
        <button 
          onClick={() => handleSelect('drawing')}
          className="flex items-center gap-3 bg-neutral-800 text-white rounded-full pl-4 pr-3 py-2 shadow-lg hover:bg-neutral-700 border border-neutral-700"
        >
          <span className="text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'رسم سريع' : 'Quick Draw'}</span>
          <div className="bg-purple-500/20 p-2 rounded-full text-purple-400">
            <PenTool size={18} />
          </div>
        </button>
        <button 
          onClick={() => handleSelect('photo_editor')}
          className="flex items-center gap-3 bg-neutral-800 text-white rounded-full pl-4 pr-3 py-2 shadow-lg hover:bg-neutral-700 border border-neutral-700"
        >
          <span className="text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'محرر الصور' : 'Photo Editor'}</span>
          <div className="bg-pink-500/20 p-2 rounded-full text-pink-400">
            <Camera size={18} />
          </div>
        </button>
        <button 
          onClick={() => handleSelect('spreadsheet')}
          className="flex items-center gap-3 bg-neutral-800 text-white rounded-full pl-4 pr-3 py-2 shadow-lg hover:bg-neutral-700 border border-neutral-700"
        >
          <span className="text-sm whitespace-nowrap" dir={isAr ? 'rtl' : 'ltr'}>{isAr ? 'جدول بيانات' : 'Spreadsheet'}</span>
          <div className="bg-indigo-500/20 p-2 rounded-full text-indigo-400">
            <Table size={18} />
          </div>
        </button>
      </div>

      {/* Main FAB */}
      <button 
        onClick={toggleMenu}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-blue-500 transition-transform active:scale-95 z-50 relative"
      >
        <Plus size={28} className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
      </button>
    </div>
  );
}
