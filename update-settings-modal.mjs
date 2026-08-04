import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

const colorSwatchesStr = `
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <Palette size={16} /> {t.accentColor || 'اللون الأساسي'}
                  </label>
                  <div className="flex gap-3">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map(color => (
                      <button
                        key={color}
                        onClick={() => updateSettings({ accentColor: color })}
                        className={\`w-8 h-8 rounded-full border-2 transition-transform \${settings.accentColor === color ? 'border-neutral-900 dark:border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'}\`}
                        style={{ backgroundColor: color }}
                        aria-label={\`Select color \${color}\`}
                      />
                    ))}
                  </div>
                </div>
`;

content = content.replace(
  /<div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">\s*<label className="flex items-center justify-between cursor-pointer p-3/g,
  `${colorSwatchesStr}\n                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">\n                  <label className="flex items-center justify-between cursor-pointer p-3`
);

fs.writeFileSync('src/components/SettingsModal.tsx', content);
console.log("SettingsModal updated");
