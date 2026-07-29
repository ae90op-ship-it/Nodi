import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

interface Settings {
  language: Language;
  theme: Theme;
  backgroundImage: string | null;
  backgroundColor: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  language: 'ar',
  theme: 'dark',
  backgroundImage: null,
  backgroundColor: '#0a0a0a',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from local storage
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

  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.language, settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
