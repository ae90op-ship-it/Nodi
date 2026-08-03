import fs from 'fs';
let content = fs.readFileSync('src/components/VoiceRecorderOverlay.tsx', 'utf-8');

content = content.replace(
  /alert\("Could not access microphone\."\);/,
  "alert(settings.language === 'ar' ? 'حدث خطأ في الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.' : 'Could not access microphone. Please check permissions.');"
);

fs.writeFileSync('src/components/VoiceRecorderOverlay.tsx', content, 'utf-8');
console.log('VoiceRecorderOverlay updated');
