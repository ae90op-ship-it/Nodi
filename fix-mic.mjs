import fs from 'fs';

let content = fs.readFileSync('src/components/NoteEditor.tsx', 'utf-8');

content = content.replace(
  /className=\{`p-1\.5 rounded-md flex items-center gap-1 shrink-0 \$\{isRecording \? 'bg-red-500 text-white animate-pulse' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'\}`\}/g,
  'className={`p-1.5 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-md flex items-center gap-1 shrink-0 transition-colors ${isRecording ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"}`}'
);

fs.writeFileSync('src/components/NoteEditor.tsx', content);
