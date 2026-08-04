import fs from 'fs';

// Fix App.tsx
let contentApp = fs.readFileSync('src/App.tsx', 'utf-8');
contentApp = contentApp.replace(
  /a\.click\(\);/g,
  "a.click();\n    URL.revokeObjectURL(url);"
);
fs.writeFileSync('src/App.tsx', contentApp);

// Fix GraphView.tsx
let contentGraph = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');
contentGraph = contentGraph.replace(
  /a\.click\(\);/g,
  "a.click();\n      URL.revokeObjectURL(url);"
);
fs.writeFileSync('src/components/GraphView.tsx', contentGraph);

console.log("revokeObjectURL added");
