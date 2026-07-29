import React, { useRef } from 'react';
import { Settings, X, Image as ImageIcon, Palette, Type, Moon, Sun } from 'lucide-react';
import { useSettings } from '../SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
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
    background: 'الخلفية',
    color: 'لون الخلفية',
    image: 'صورة الخلفية',
    removeImage: 'إزالة الصورة',
    dark: 'داكن',
    light: 'فاتح',
  } : {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    background: 'Background',
    color: 'Background Color',
    image: 'Background Image',
    removeImage: 'Remove Image',
    dark: 'Dark',
    light: 'Light',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings size={24} className="text-blue-400" />
            {t.title}
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Language */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
              <Type size={16} /> {t.language}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ language: 'ar' })}
                className={`flex-1 py-2 rounded-xl border transition-all ${settings.language === 'ar' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-transparent hover:bg-neutral-700'}`}
              >
                العربية
              </button>
              <button
                onClick={() => updateSettings({ language: 'en' })}
                className={`flex-1 py-2 rounded-xl border transition-all ${settings.language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-transparent hover:bg-neutral-700'}`}
              >
                English
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
              {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} {t.theme}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex-1 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 ${settings.theme === 'dark' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800 border-transparent hover:bg-neutral-700'}`}
              >
                <Moon size={18} /> {t.dark}
              </button>
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex-1 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 ${settings.theme === 'light' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-neutral-800 border-transparent hover:bg-neutral-700'}`}
              >
                <Sun size={18} /> {t.light}
              </button>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
              <Palette size={16} /> {t.background}
            </label>
            
            <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-xl">
              <span className="text-sm">{t.color}</span>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
            </div>

            <div className="bg-neutral-800 p-3 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2"><ImageIcon size={16}/> {t.image}</span>
                {settings.backgroundImage && (
                  <button onClick={() => updateSettings({ backgroundImage: null })} className="text-xs text-red-400 hover:text-red-300">
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
                className="w-full py-2 border border-dashed border-neutral-600 hover:border-blue-400 hover:text-blue-400 rounded-lg text-sm transition-colors text-neutral-400 flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} />
                {settings.backgroundImage ? 'تغيير الصورة' : 'رفع صورة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
