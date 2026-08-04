import React, { useRef, useState } from 'react';
import { Settings, X, Image as ImageIcon, Palette, Type, Moon, Sun, Box, AlertTriangle, Globe, Shield, Layout, Key } from 'lucide-react';
import { useSettings } from '../SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSecretCode?: (code: string) => void;
}

export function SettingsModal({ isOpen, onClose, onSecretCode }: SettingsModalProps) {
  const { settings, updateSettings, resetData } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'region' | 'typography' | 'data' | 'secrets'>('appearance');
  const [secretInput, setSecretInput] = useState('');
  const [showSecretList, setShowSecretList] = useState(false);

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

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = secretInput.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).trim();
    if (normalizedCode === '0000') {
      setShowSecretList(true);
    } else {
      onSecretCode?.(normalizedCode);
      setSecretInput('');
      onClose();
    }
  };

  const t = settings.language === 'ar' ? {
    title: 'الإعدادات المتقدمة',
    tabs: { appearance: 'المظهر والثيم', region: 'اللغات والموقع', typography: 'الخطوط والعرض', data: 'إدارة البيانات', secrets: 'الرموز السرية' },
    language: 'لغة التطبيق',
    theme: 'وضع الإضاءة',
    background: 'لوحة الرسم (Canvas)',
    color: 'لون الخلفية',
    image: 'صورة الخلفية',
    removeImage: 'إزالة',
    dark: 'داكن',
    light: 'فاتح',
    opacity: 'الشفافية',
    fontSize: 'حجم الخط الأساسي',
    small: 'صغير',
    medium: 'متوسط',
    large: 'كبير',
    nodeShape: 'تصميم العقد',
    rounded: 'بطاقات منحنية',
    circular: 'دوائر',
    snapToGrid: 'محاذاة الشبكة (Snap to Grid)',
    accentColor: 'اللون الأساسي',
    reset: 'إعادة ضبط وحذف كافة البيانات',
    dangerZone: 'منطقة الخطر',
  } : {
    title: 'Advanced Settings',
    tabs: { appearance: 'Appearance', region: 'Region', typography: 'Display', data: 'Data & Storage', secrets: 'Secret Codes' },
    language: 'App Language',
    theme: 'Color Mode',
    background: 'Canvas Background',
    color: 'Background Color',
    image: 'Background Image',
    removeImage: 'Remove',
    dark: 'Dark Mode',
    light: 'Light Mode',
    opacity: 'Canvas Opacity',
    fontSize: 'Base Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    nodeShape: 'Node Design',
    rounded: 'Rounded Cards',
    circular: 'Circular',
    snapToGrid: 'Snap to Grid',
    reset: 'Factory Reset & Delete All Data',
    dangerZone: 'Danger Zone',
  };

  // Expanded Language List (Mock 90+)
  const languagesList = [
    { code: 'ar', label: 'العربية (Arabic)', dir: 'rtl' },
    { code: 'en', label: 'English (US)', dir: 'ltr' },
    { code: 'fr', label: 'Français (French)', dir: 'ltr' },
    { code: 'es', label: 'Español (Spanish)', dir: 'ltr' },
    { code: 'de', label: 'Deutsch (German)', dir: 'ltr' },
    { code: 'tr', label: 'Türkçe (Turkish)', dir: 'ltr' },
    { code: 'ru', label: 'Русский (Russian)', dir: 'ltr' },
    { code: 'zh', label: '中文 (Chinese)', dir: 'ltr' },
    { code: 'ja', label: '日本語 (Japanese)', dir: 'ltr' },
    { code: 'hi', label: 'हिन्दी (Hindi)', dir: 'ltr' },
  ];

  const secretCodesList = [
    { code: '1001', desc: 'تفعيل المظهر الداكن الفائق (Dark Mode OLED)' },
    { code: '1002', desc: 'تغيير خلفية الشبكة إلى نمط النقاط المتقاطعة (Dot Grid)' },
    { code: '2001', desc: 'إنشاء ملاحظة سريعة جديدة تلقائياً' },
    { code: '2002', desc: 'فتح محرر الصور مباشرة' },
    { code: '2003', desc: 'فتح جدول البيانات مباشرة' },
    { code: '3001', desc: 'تصدير جميع البيانات تلقائياً كملف JSON' },
    { code: '3002', desc: 'حذف جميع العقد المفتوحة تنظيف سريع للواجهة (Quick Clean)' },
    { code: '4001', desc: 'تفعيل وضع التركيز (Focus Mode) وإخفاء شريط الأزرار العلوي' },
    { code: '4002', desc: 'إعادة ضبط أبعاد ومواقع العقد إلى المركز (Reset Graph Layout)' },
    { code: '5001', desc: 'تغيير لغة التطبيق فوراً بين العربية والإنجليزي' },
    { code: '5002', desc: 'تفعيل تأثير الألوان المتدرجة المتحركة للواجهة (Animated Gradient)' },
    { code: '7001', desc: 'عرض إحصائيات التطبيق (عدد الملاحظات، الصور، الجداول)' },
    { code: '8001', desc: 'كود التجربة الاختبارية: إضافة 5 عقد تجريبية عشوائية' },
    { code: '9001', desc: 'تفعيل وضع الحماية/القفل الوهمي للواجهة' },
    { code: '3600', desc: 'فتح اللعبة المخفية 2D' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh]" dir={settings.language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-neutral-50 dark:bg-neutral-950 border-b md:border-b-0 md:border-l md:border-neutral-200 dark:border-neutral-800 flex flex-row md:flex-col p-4 gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-4 px-2 flex-wrap gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
              <Settings size={22} className="text-accent" />
              {t.title}
            </h2>
            <button onClick={onClose} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-white bg-neutral-200 dark:bg-neutral-800 hover:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors shadow-sm">
              <X size={16} />
              {settings.language === 'ar' ? 'خروج' : 'Exit'}
            </button>
          </div>
          
          <TabButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Palette size={18}/>} label={t.tabs.appearance} />
          <TabButton active={activeTab === 'region'} onClick={() => setActiveTab('region')} icon={<Globe size={18}/>} label={t.tabs.region} />
          <TabButton active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} icon={<Layout size={18}/>} label={t.tabs.typography} />
          <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Shield size={18}/>} label={t.tabs.data} />
          <TabButton active={activeTab === 'secrets'} onClick={() => setActiveTab('secrets')} icon={<Key size={18}/>} label={t.tabs.secrets} />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto relative">
          

          <div className="space-y-8 pb-10 max-w-md mx-auto">
            
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 fade-in">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} {t.theme}
                  </label>
                  <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <button
                      onClick={() => updateSettings({ theme: 'light' })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${settings.theme === 'light' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      {t.light}
                    </button>
                    <button
                      onClick={() => updateSettings({ theme: 'dark' })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {t.dark}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Palette size={16} /> {settings.language === 'ar' ? 'اللون الأساسي (Accent)' : 'Accent Color'}
                  </label>
                  <div className="flex gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-x-auto">
                    {[
                      { name: 'Blue', value: '#3b82f6' },
                      { name: 'Purple', value: '#a855f7' },
                      { name: 'Rose', value: '#f43f5e' },
                      { name: 'Orange', value: '#f97316' },
                      { name: 'Emerald', value: '#10b981' },
                      { name: 'Cyan', value: '#06b6d4' },
                    ].map(color => (
                      <button
                        key={color.value}
                        onClick={() => updateSettings({ accentColor: color.value })}
                        className={`w-8 h-8 rounded-full shrink-0 transition-transform ${settings.accentColor === color.value ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ring-neutral-400' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <ImageIcon size={16} /> {t.background}
                  </label>

                  <div className="flex flex-col gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{t.opacity}</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-mono">{settings.canvasOpacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={settings.canvasOpacity}
                      onChange={(e) => updateSettings({ canvasOpacity: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.image}</span>
                      {settings.backgroundImage && (
                        <button onClick={() => updateSettings({ backgroundImage: null })} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          {t.removeImage}
                        </button>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-neutral-300 dark:border-neutral-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-900/10 rounded-xl text-sm transition-all text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2 font-medium"
                    >
                      <ImageIcon size={18} />
                      {settings.backgroundImage ? 'تغيير الصورة (Change)' : 'رفع صورة (Upload)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Region Tab */}
            {activeTab === 'region' && (
              <div className="space-y-6 fade-in">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Globe size={16} /> {t.language}
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2">
                    {languagesList.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => updateSettings({ language: lang.code })}
                        className={`text-left flex items-center justify-between p-3 rounded-xl border transition-all ${settings.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 font-semibold' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750'}`}
                        dir={lang.dir}
                      >
                        {lang.label}
                        {settings.language === lang.code && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Typography & Display Tab */}
            {activeTab === 'typography' && (
              <div className="space-y-6 fade-in">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Type size={16} /> {t.fontSize}
                  </label>
                  <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                    {(['text-sm', 'text-base', 'text-lg'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => updateSettings({ fontSize: size })}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors font-medium ${settings.fontSize === size ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                      >
                        {size === 'text-sm' ? t.small : size === 'text-base' ? t.medium : t.large}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Box size={16} /> {t.nodeShape}
                  </label>
                  <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                    <button
                      onClick={() => updateSettings({ nodeShape: 'rounded' })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors font-medium ${settings.nodeShape === 'rounded' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}
                    >
                      {t.rounded}
                    </button>
                    <button
                      onClick={() => updateSettings({ nodeShape: 'circular' })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors font-medium ${settings.nodeShape === 'circular' ? 'bg-white dark:bg-neutral-700 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}
                    >
                      {t.circular}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="flex items-center justify-between cursor-pointer p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.snapToGrid}</span>
                    <input 
                      type="checkbox" 
                      checked={settings.snapToGrid}
                      onChange={(e) => updateSettings({ snapToGrid: e.target.checked })}
                      className="w-5 h-5 accent-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6 fade-in">
                <div className="p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                  <h3 className="text-red-600 dark:text-red-400 font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} /> {t.dangerZone}
                  </h3>
                  <button 
                    onClick={resetData}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors font-semibold text-sm shadow-sm"
                  >
                    {t.reset}
                  </button>
                  <p className="text-xs text-red-500/80 mt-3 text-center">سيتم حذف كافة الملاحظات، السبورات، والحسابات من قاعدة البيانات المحلية بشكل لا رجعة فيه.</p>
                </div>
              </div>
            )}

            {/* Secrets Tab */}
            {activeTab === 'secrets' && (
              <div className="space-y-6 fade-in" dir="ltr">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Key size={16} /> Access Terminal
                  </label>
                  <form onSubmit={handleSecretSubmit} className="flex gap-2">
                    <input 
                      type="text" 
                      value={secretInput}
                      onChange={e => setSecretInput(e.target.value)}
                      placeholder="Enter access code..."
                      className="flex-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest text-neutral-900 dark:text-white"
                      maxLength={4}
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors">Execute</button>
                  </form>
                </div>

                {showSecretList && (
                  <div className="mt-4 bg-neutral-950 rounded-xl p-4 border border-neutral-800 overflow-y-auto max-h-[40vh] font-mono text-xs text-green-400 shadow-inner">
                    <h4 className="text-white mb-2 pb-2 border-b border-neutral-800 font-bold">DIRECTORY OF CLASSIFIED DIRECTIVES</h4>
                    <ul className="space-y-2">
                      {secretCodesList.map(s => (
                        <li key={s.code} className="flex gap-4 hover:bg-neutral-900 p-1 rounded transition-colors cursor-pointer" onClick={() => { onSecretCode?.(s.code); onClose(); }}>
                          <span className="text-blue-400">[{s.code}]</span>
                          <span className="text-neutral-400">{s.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-medium
        ${active 
          ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-neutral-700' 
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 border border-transparent'
        }
      `}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
