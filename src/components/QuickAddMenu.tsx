import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Plus, PenTool, Calculator, FileText, Image as ImageIcon, Table, Camera, Mic, Upload, Zap, Settings, X, GripVertical, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils';
import { useSettings } from '../SettingsContext';
import { AppModule } from '../types';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface QuickAddMenuProps {
  onAdd: (type: AppModule, extraData?: any) => void;
  onRecordAudio?: () => void;
  onUploadMedia?: () => void;
}

type TabType = 'programs' | 'shortcuts';

interface ShortcutItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: React.ReactNode;
  action: () => void;
  isHidden: boolean;
  order: number;
}

export const QuickAddMenu = memo(({ onAdd, onRecordAudio, onUploadMedia }: QuickAddMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('programs');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { settings } = useSettings();
  const isAr = settings.language === 'ar';
  
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setIsEditMode(false);
  }, []);

  const menuRef = useOutsideClick<HTMLDivElement>(closeMenu);

  // Esc key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeMenu]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) setIsEditMode(false);
  }, [isOpen]);

  const handleSelect = useCallback((type: AppModule) => {
    onAdd(type);
    closeMenu();
  }, [onAdd, closeMenu]);

  // Program Items
  const programs = [
    { id: 'spreadsheet', labelAr: 'جدول بيانات', labelEn: 'Spreadsheet', icon: <Table size={24} className="text-indigo-400" />, action: () => handleSelect('spreadsheet') },
    { id: 'photo_editor', labelAr: 'محرر الصور', labelEn: 'Photo Editor', icon: <Camera size={24} className="text-pink-400" />, action: () => handleSelect('photo_editor') },
    { id: 'drawing', labelAr: 'رسم', labelEn: 'Drawing', icon: <PenTool size={24} className="text-purple-400" />, action: () => handleSelect('drawing') },
    { id: 'note', labelAr: 'ملاحظات', labelEn: 'Notes', icon: <FileText size={24} className="text-amber-400" />, action: () => handleSelect('note') },
    { id: 'calctape', labelAr: 'آلة حاسبة', labelEn: 'Calculator', icon: <Calculator size={24} className="text-emerald-400" />, action: () => handleSelect('calctape') },
    { id: 'whiteboard', labelAr: 'سبورة تحليل', labelEn: 'Whiteboard', icon: <ImageIcon size={24} className="text-accent" />, action: () => handleSelect('whiteboard') }
  ];

  // Default Shortcuts
  const defaultShortcuts: Omit<ShortcutItem, 'isHidden' | 'order'>[] = [
    { id: 'quick_note', labelAr: 'ملاحظة سريعة', labelEn: 'Quick Note', icon: <Zap size={24} className="text-yellow-400" />, action: () => handleSelect('quick_note') },
    { id: 'voice_note', labelAr: 'ملاحظة صوتية', labelEn: 'Voice Note', icon: <Mic size={24} className="text-red-400" />, action: () => { closeMenu(); onRecordAudio?.(); } },
    { id: 'media', labelAr: 'إضافة وسائط', labelEn: 'Add Media', icon: <Upload size={24} className="text-orange-400" />, action: () => { closeMenu(); onUploadMedia?.(); } }
  ];

  // Load saved preferences
  const [shortcutPrefs, setShortcutPrefs] = useState<Record<string, { isHidden: boolean, order: number }>>({});
  
  useEffect(() => {
    const saved = localStorage.getItem('nibras-shortcuts-config');
    if (saved) {
      try {
        setShortcutPrefs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse shortcuts config', e);
      }
    }
  }, []);

  const saveShortcutPrefs = useCallback((prefs: typeof shortcutPrefs) => {
    setShortcutPrefs(prefs);
    localStorage.setItem('nibras-shortcuts-config', JSON.stringify(prefs));
  }, []);

  // Merge defaults with prefs
  const shortcuts: ShortcutItem[] = defaultShortcuts.map((sc, idx) => ({
    ...sc,
    isHidden: shortcutPrefs[sc.id]?.isHidden ?? false,
    order: shortcutPrefs[sc.id]?.order ?? idx,
  })).sort((a, b) => a.order - b.order);

  const toggleShortcutVisibility = (id: string) => {
    const newPrefs = { ...shortcutPrefs };
    const current = shortcuts.find(s => s.id === id);
    if (current) {
      newPrefs[id] = { isHidden: !current.isHidden, order: current.order };
      saveShortcutPrefs(newPrefs);
    }
  };

  const moveShortcut = (id: string, direction: -1 | 1) => {
    const index = shortcuts.findIndex(s => s.id === id);
    if ((direction === -1 && index === 0) || (direction === 1 && index === shortcuts.length - 1)) return;
    
    const newShortcuts = [...shortcuts];
    const temp = newShortcuts[index];
    newShortcuts[index] = newShortcuts[index + direction];
    newShortcuts[index + direction] = temp;
    
    const newPrefs = { ...shortcutPrefs };
    newShortcuts.forEach((s, idx) => {
      newPrefs[s.id] = { isHidden: s.isHidden, order: idx };
    });
    saveShortcutPrefs(newPrefs);
  };

  return (
    <>
      {/* Main FAB */}
      <div className={`fixed bottom-6 ${isAr ? 'right-6' : 'left-6'} z-[110]`}>
        {!isOpen && (
        <button 
          onClick={toggleMenu}
          className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300 active:scale-95 relative"
        >
          <Plus size={28} className="transition-transform duration-300" />
        </button>
      )}
      </div>

      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal */}
      <div 
        ref={menuRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-md w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl z-[105] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col h-full max-h-[75vh] overflow-y-auto">
          {/* Header & Drag Handle */}
          <div className="flex flex-col items-center pt-4 pb-2 px-6 border-b border-neutral-100 dark:border-neutral-800">
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mb-4" />
            
            <div className="flex justify-between items-center w-full mb-2">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {isAr ? 'إضافة جديدة' : 'Quick Add'}
              </h2>
              <button onClick={closeMenu} className="p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors bg-neutral-100 dark:bg-neutral-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-full mt-2 relative">
              <button 
                onClick={() => { setActiveTab('programs'); setIsEditMode(false); }}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10",
                  activeTab === 'programs' ? "text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                {isAr ? 'برنامج' : 'Program'}
              </button>
              <button 
                onClick={() => setActiveTab('shortcuts')}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all z-10",
                  activeTab === 'shortcuts' ? "text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                {isAr ? 'اختصارات' : 'Shortcuts'}
              </button>
              
              {/* Tab Slider Indicator */}
              <div 
                className={cn(
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-neutral-700 rounded-lg shadow transition-transform duration-300",
                  activeTab === 'shortcuts' ? (isAr ? "-translate-x-full" : "translate-x-full") : "translate-x-0"
                )}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {activeTab === 'programs' && (
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
                {programs.map(prog => (
                  <button 
                    key={prog.id}
                    onClick={prog.action}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-100 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900/50 group active:scale-95"
                  >
                    <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      {prog.icon}
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center">
                      {isAr ? prog.labelAr : prog.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-neutral-500 font-medium">
                    {isAr ? 'الاختصارات السريعة' : 'Quick Actions'}
                  </span>
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={cn(
                      "flex items-center gap-2 text-sm px-3 py-1.5 rounded-full font-medium transition-colors",
                      isEditMode ? "bg-accent text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                  >
                    {isEditMode ? <Check size={16} /> : <Settings size={16} />}
                    {isAr ? (isEditMode ? 'تم' : 'تعديل') : (isEditMode ? 'Done' : 'Edit')}
                  </button>
                </div>
                
                {isEditMode ? (
                  <div className="flex flex-col gap-3">
                    {shortcuts.map((sc, idx) => (
                      <div key={sc.id} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col gap-1">
                          <button disabled={idx === 0} onClick={() => moveShortcut(sc.id, -1)} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 p-1"><GripVertical size={14} className="rotate-90" /></button>
                          <button disabled={idx === shortcuts.length - 1} onClick={() => moveShortcut(sc.id, 1)} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30 p-1"><GripVertical size={14} className="rotate-90" /></button>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg shadow-sm opacity-50">
                          {sc.icon}
                        </div>
                        <span className={cn("flex-1 text-sm font-medium", sc.isHidden && "text-neutral-400 line-through")}>
                          {isAr ? sc.labelAr : sc.labelEn}
                        </span>
                        <button 
                          onClick={() => toggleShortcutVisibility(sc.id)}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            sc.isHidden ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-500" : "bg-accent-light dark:bg-accent-light text-accent dark:text-accent"
                          )}
                        >
                          {sc.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
                    {shortcuts.filter(sc => !sc.isHidden).map(sc => (
                      <button 
                        key={sc.id}
                        onClick={sc.action}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-100 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900/50 group active:scale-95"
                      >
                        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                          {sc.icon}
                        </div>
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center">
                          {isAr ? sc.labelAr : sc.labelEn}
                        </span>
                      </button>
                    ))}
                    {shortcuts.filter(sc => !sc.isHidden).length === 0 && (
                      <div className="col-span-3 text-center py-8 text-sm text-neutral-400">
                        {isAr ? 'لا توجد اختصارات مرئية.' : 'No visible shortcuts.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
