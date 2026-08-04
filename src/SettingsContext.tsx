import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type FontSize = 'text-sm' | 'text-base' | 'text-lg';
export type NodeShape = 'rounded' | 'circular';

export interface Settings {
  language: string; // Supports 90+ languages
  theme: Theme;
  backgroundImage: string | null;
  backgroundColor: string;
  canvasOpacity: number;
  fontSize: FontSize;
  nodeShape: NodeShape;
  snapToGrid: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetData: () => Promise<void>;
}

const defaultSettings: Settings = {
  language: 'ar',
  theme: 'dark',
  backgroundImage: null,
  backgroundColor: '#0a0a0a',
  canvasOpacity: 100,
  fontSize: 'text-base',
  nodeShape: 'rounded',
  snapToGrid: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('nibras-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('nibras-settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetData = async () => {
    if (window.confirm(settings.language === 'ar' ? 'هل أنت متأكد من مسح كافة البيانات؟ سيعاد تحميل التطبيق.' : 'Are you sure you want to delete all data? The app will reload.')) {
      try {
        const { db } = await import('./db');
        await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos, db.files], async () => {
          await db.nodes.clear();
          await db.calctapes.clear();
          await db.notes.clear();
          await db.whiteboards.clear();
          await db.spreadsheets.clear();
          await db.photos.clear();
          await db.files.clear();
        });
        window.location.reload();
      } catch (e) {
        console.error("Failed to reset data", e);
      }
    }
  };

  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.body.className = `${settings.theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-neutral-100 text-neutral-900'} ${settings.fontSize}`;
  }, [settings.language, settings.theme, settings.fontSize]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetData }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
