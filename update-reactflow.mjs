import fs from 'fs';

let content = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');

content = content.replace(
  /<Background variant=\{BackgroundVariant\.Dots\}[\s\S]*?\/>/g,
  match => match + `\n        <Controls className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden" />\n        <MiniMap zoomable pannable className="rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden" maskColor="rgba(0,0,0,0.1)" />`
);

fs.writeFileSync('src/components/GraphView.tsx', content);
