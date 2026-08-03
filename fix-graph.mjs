import fs from 'fs';

let content = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');

// Add onToggleReadOnly to CustomNodeData
content = content.replace(
  /onToggleLock\?: \(\) => void;/,
  "onToggleLock?: () => void;\n  onToggleReadOnly?: () => void;"
);

// Add context menu button for Read-Only
content = content.replace(
  /<button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick=\{\(\) => \{ data\.onToggleLock\?\.\(\); setShowContextMenu\(false\); \}\}>\s*\{data\.isLocked \? <Unlock size=\{14\} \/> : <Lock size=\{14\} \/>\}\s*\{data\.isLocked \? 'فك القفل' : 'قفل العقدة'\}\s*<\/button>/,
  `<button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onToggleLock?.(); setShowContextMenu(false); }}>
          {data.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
          {data.isLocked ? 'فك قفل التحريك' : 'قفل التحريك'}
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick={() => { data.onToggleReadOnly?.(); setShowContextMenu(false); }}>
          {data.isReadOnly ? <Eye size={14} /> : <EyeOff size={14} />}
          {data.isReadOnly ? 'إلغاء القراءة فقط' : 'قراءة فقط'}
        </button>`
);

// Import Eye/EyeOff if not imported
if (!content.includes('EyeOff')) {
  content = content.replace(
    /from 'lucide-react';/,
    ", Eye, EyeOff } from 'lucide-react';"
  );
}

// Map the function
content = content.replace(
  /onToggleLock: async \(\) => await db\.nodes\.update\(n\.id, \{ isLocked: !n\.isLocked \}\),/,
  `onToggleLock: async () => await db.nodes.update(n.id, { isLocked: !n.isLocked }),
          onToggleReadOnly: async () => await db.nodes.update(n.id, { isReadOnly: !n.isReadOnly }),`
);

// Add read-only icon (Lock or Eye) to the node view
// Search for data.isLocked icon and append isReadOnly
content = content.replace(
  /\{data\.isLocked && <Lock size=\{14\} className="absolute top-1 left-2 text-red-500 z-10 drop-shadow-md" \/>\}/g,
  `{data.isLocked && <Lock size={14} className="absolute top-1 left-2 text-red-500 z-10 drop-shadow-md" />}
        {data.isReadOnly && <Eye size={14} className="absolute top-1 left-6 text-amber-500 z-10 drop-shadow-md" />}`
);
content = content.replace(
  /\{data\.isLocked && <Lock size=\{12\} className="absolute bottom-\[-6px\] left-\[-6px\] text-red-500 drop-shadow-md" \/>\}/g,
  `{data.isLocked && <Lock size={12} className="absolute bottom-[-6px] left-[-6px] text-red-500 drop-shadow-md" />}
      {data.isReadOnly && <Eye size={12} className="absolute bottom-[-6px] left-[10px] text-amber-500 drop-shadow-md" />}`
);

fs.writeFileSync('src/components/GraphView.tsx', content);
console.log("GraphView updated");
