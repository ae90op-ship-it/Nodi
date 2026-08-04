import fs from 'fs';

let content = fs.readFileSync('src/components/NoteEditor.tsx', 'utf-8');

// Replace standard hover button classes with higher contrast background
content = content.replace(
  /className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors shrink-0"/g,
  'className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-100 rounded-full transition-colors shrink-0"'
);

// Match generic icon buttons in header
content = content.replace(
  /className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500"/g,
  'className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-100 rounded-full"'
);
content = content.replace(
  /className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 hidden md:block"/g,
  'className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-100 rounded-full hidden md:block"'
);


// Delete button
content = content.replace(
  /className="p-2 hover:bg-red-50 dark:hover:bg-red-900\/20 text-red-500 rounded-full transition-colors"/g,
  'className="p-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-full transition-colors"'
);

// Pin button
content = content.replace(
  /className=\{`p-2 rounded-full \$\{node\?.isPinned \? 'bg-blue-100 text-blue-500 dark:bg-blue-900\/50' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'\}`\}/g,
  'className={`p-2 rounded-full transition-colors ${node?.isPinned ? "bg-blue-500 text-white dark:bg-blue-600" : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-100"}`}'
);

// Read-only button
content = content.replace(
  /className=\{`p-2 rounded-full \$\{node\?.isReadOnly \? 'bg-amber-100 text-amber-600 dark:bg-amber-900\/50' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'\}`\}/g,
  'className={`p-2 rounded-full transition-colors ${node?.isReadOnly ? "bg-amber-500 text-white dark:bg-amber-600" : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-100"}`}'
);

// Formatting buttons
content = content.replace(
  /className="p-1\.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md shrink-0"/g,
  'className="p-1.5 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-md shrink-0 transition-colors"'
);

fs.writeFileSync('src/components/NoteEditor.tsx', content);
console.log("NoteEditor updated");
