import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /\{\/\* Tag Filters \*\/\}\s*\{uniqueTags\.length > 0 && \(\s*<div className="flex flex-wrap gap-2 items-center pointer-events-auto">\s*<Tag size=\{16\} className="text-neutral-500 mr-1" \/>\s*\{uniqueTags\.map\(tag => \(\s*<button[\s\S]*?<\/div>\s*\)\}/,
  ""
);

fs.writeFileSync('src/App.tsx', app);

let graph = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');

graph = graph.replace(
  /import \{ PenTool/,
  "import { Eye, EyeOff, PenTool"
);

fs.writeFileSync('src/components/GraphView.tsx', graph);
console.log("Fixed errors");
