import React from 'react';
import { ArrowLeft, Image as ImageIcon, Sliders, Save, Download } from 'lucide-react';

interface PhotoEditorProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function PhotoEditor({ nodeId, onClose, onDelete }: PhotoEditorProps) {
  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <span className="font-semibold text-lg flex items-center gap-2"><ImageIcon size={20}/> محرر الصور (Beta)</span>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-2 transition-colors">
            <Save size={16}/> حفظ
          </button>
        </div>
      </div>
      
      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-neutral-950 border-l border-neutral-800 p-4 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-400">التعديلات الأساسية</h3>
            <div className="space-y-2">
              <label className="text-xs flex justify-between">السطوع <span>50%</span></label>
              <input type="range" className="w-full accent-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs flex justify-between">التباين <span>50%</span></label>
              <input type="range" className="w-full accent-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs flex justify-between">التشبع <span>50%</span></label>
              <input type="range" className="w-full accent-blue-500" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-400">فلاتر</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-neutral-800 rounded text-xs hover:bg-blue-600 transition-colors">أبيض وأسود</button>
              <button className="p-2 bg-neutral-800 rounded text-xs hover:bg-blue-600 transition-colors">داكن</button>
              <button className="p-2 bg-neutral-800 rounded text-xs hover:bg-blue-600 transition-colors">دافئ</button>
              <button className="p-2 bg-neutral-800 rounded text-xs hover:bg-blue-600 transition-colors">بارد</button>
            </div>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 bg-neutral-800 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl aspect-video border-2 border-dashed border-neutral-600 rounded-2xl flex flex-col items-center justify-center text-neutral-500 gap-4 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer bg-neutral-900/50">
            <Download size={48} />
            <p>اسحب وأفلت صورة هنا أو انقر للرفع</p>
          </div>
        </div>
      </div>
    </div>
  );
}
