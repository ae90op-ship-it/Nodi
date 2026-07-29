import React, { useRef } from 'react';
import { Settings, X, Image as ImageIcon, Palette, Type, Moon, Sun, Box, AlertTriangle } from 'lucide-react';
import { useSettings } from '../SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetData } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ backgroundImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const t = settings.language === 'ar' ? {
    title: 'الإعدادات',
    language: 'اللغة',
    theme: 'المظهر',
    background: 'لوحة الرسم (Canvas)',
    color: 'لون الخلفية',
    image: 'صورة الخلفية',
    removeImage: 'إزالة',
    dark: 'داكن',
    light: 'فاتح',
    opacity: 'الشفافية',
    fontSize: 'حجم الخط',
    small: 'صغير',
    medium: 'متوسط',
    large: 'كبير',
    nodeShape: 'شكل العقد',
    rounded: 'منحني',
    circular: 'دائري',
    reset: 'إعادة ضبط وحذف البيانات',
  } : {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    background: 'Canvas Background',
    color: 'Background Color',
    image: 'Background Image',
    removeImage: 'Remove',
    dark: 'Dark',
    light: 'Light',
    opacity: 'Opacity',
    fontSize: 'Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    nodeShape: 'Node Shape',
    rounded: 'Rounded',
    circular: 'Circular',
    reset: 'Reset & Delete All Data',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <Settings size={24} className="text-blue-500 dark:text-blue-400" />
            {t.title}
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Language & Theme in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Type size={16} /> {t.language}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ language: 'ar' })}
                  className={`flex-1 py-1.5 rounded-lg border transition-all text-sm ${settings.language === 'ar' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400' : 'bg-neutral-50 dark:bg-neutral-800 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                >
                  العربية
                </button>
                <button
                  onClick={() => updateSettings({ language: 'en' })}
                  className={`flex-1 py-1.5 rounded-lg border transition-all text-sm ${settings.language === 'en' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400' : 'bg-neutral-50 dark:bg-neutral-800 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} {t.theme}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 text-sm ${settings.theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-neutral-50 dark:bg-neutral-800 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                >
                  <Moon size={14} /> {t.dark}
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 text-sm ${settings.theme === 'light' ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-neutral-50 dark:bg-neutral-800 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                >
                  <Sun size={14} /> {t.light}
                </button>
              </div>
            </div>
          </div>

          {/* Font Size & Node Shape */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Type size={16} /> {t.fontSize}
              </label>
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                {(['text-sm', 'text-base', 'text-lg'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ fontSize: size })}
                    className={`flex-1 py-1 text-xs rounded transition-colors ${settings.fontSize === size ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}
                  >
                    {size === 'text-sm' ? t.small : size === 'text-base' ? t.medium : t.large}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Box size={16} /> {t.nodeShape}
              </label>
              <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                <button
                  onClick={() => updateSettings({ nodeShape: 'rounded' })}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${settings.nodeShape === 'rounded' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  {t.rounded}
                </button>
                <button
                  onClick={() => updateSettings({ nodeShape: 'circular' })}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${settings.nodeShape === 'circular' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  {t.circular}
                </button>
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Palette size={16} /> {t.background}
            </label>
            
            <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t.color}</span>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>

            <div className="flex flex-col gap-2 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t.opacity}</span>
                <span className="text-xs text-neutral-500">{settings.canvasOpacity}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={settings.canvasOpacity}
                onChange={(e) => updateSettings({ canvasOpacity: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2 text-neutral-700 dark:text-neutral-300"><ImageIcon size={16}/> {t.image}</span>
                {settings.backgroundImage && (
                  <button onClick={() => updateSettings({ backgroundImage: null })} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                    {t.removeImage}
                  </button>
                )}
              </div>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 border border-dashed border-neutral-400 dark:border-neutral-600 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 rounded-lg text-sm transition-colors text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                {settings.backgroundImage ? (settings.language === 'ar' ? 'تغيير الصورة' : 'Change Image') : (settings.language === 'ar' ? 'رفع صورة' : 'Upload Image')}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={resetData}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl transition-colors font-semibold text-sm"
            >
              <AlertTriangle size={18} />
              {t.reset}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
