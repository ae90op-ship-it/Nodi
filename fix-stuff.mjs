import fs from 'fs';

// 1. Fix metadata.json
const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf-8'));
if (!metadata.requestFramePermissions) {
  metadata.requestFramePermissions = [];
}
if (!metadata.requestFramePermissions.includes('microphone')) {
  metadata.requestFramePermissions.push('microphone');
}
fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 2));

// 2. Fix SettingsModal.tsx translations
let settings = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

settings = settings.replace(
  /snapToGrid: 'محاذاة الشبكة \(Snap to Grid\)',\s*reset: 'إعادة ضبط وحذف كافة البيانات',/g,
  "snapToGrid: 'محاذاة الشبكة (Snap to Grid)',\n    accentColor: 'اللون الأساسي',\n    reset: 'إعادة ضبط وحذف كافة البيانات',"
);

settings = settings.replace(
  /snapToGrid: 'Snap to Grid',\s*reset: 'Reset All Data',/g,
  "snapToGrid: 'Snap to Grid',\n    accentColor: 'Accent Color',\n    reset: 'Reset All Data',"
);

fs.writeFileSync('src/components/SettingsModal.tsx', settings);

console.log("Fixes applied");
