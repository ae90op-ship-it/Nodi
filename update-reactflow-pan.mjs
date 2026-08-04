import fs from 'fs';

let content = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');

content = content.replace(
  /className=\{settings\.theme === 'dark' \? 'dark' : ''\}/,
  `className={settings.theme === 'dark' ? 'dark' : ''}\n        panOnScroll={true}\n        selectionOnDrag={true}\n        panOnDrag={[1, 2]}` // Middle and Right click for panning when selectionOnDrag is true
);

fs.writeFileSync('src/components/GraphView.tsx', content);
