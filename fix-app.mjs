import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove uniqueTags entirely
content = content.replace(
  /const uniqueTags = useMemo\(\(\) => \{[\s\S]*?\}, \[nodes\]\);/,
  ""
);

content = content.replace(
  /\{uniqueTags\.length > 0 && \([\s\S]*?\}\n\s*\)\}/,
  ""
);

// 2. Fix importData validation
const oldImportRegex = /const data = JSON\.parse\(e\.target\?\.result as string\);\n\s*await db\.transaction/s;
const newImport = `const data = JSON.parse(e.target?.result as string);
        if (!data || !data.nodes) {
          alert(settings.language === 'ar' ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file');
          return;
        }
        await db.transaction`;
content = content.replace(oldImportRegex, newImport);

// 3. Node Positioning Collision
// In createNodeFactory
content = content.replace(
  /const x = options\?\.x \?\? \(Math\.random\(\) \* 200 - 100\);\n\s*const y = options\?\.y \?\? \(Math\.random\(\) \* 200 - 100\);/s,
  `const existingNodes = await db.nodes.toArray();
      const nodeCount = existingNodes.length;
      const offset = (nodeCount % 10) * 20; // prevent exact collision
      const x = options?.x ?? ((Math.random() * 200 - 100) + offset);
      const y = options?.y ?? ((Math.random() * 200 - 100) + offset);`
);

// 4. Mobile Screen Overflow
// The prompt asked for "overflow-y-auto max-h-[75vh]" for modal containers. I will check SettingsModal and QuickAddMenu.

// Write back
fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
