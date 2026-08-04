import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/bg-blue-[567]00/g, 'bg-accent');
  content = content.replace(/text-blue-[4567]00/g, 'text-accent');
  content = content.replace(/border-blue-[4567]00/g, 'border-accent');
  content = content.replace(/ring-blue-[4567]00/g, 'ring-accent');
  // for light backgrounds
  content = content.replace(/bg-blue-50/g, 'bg-accent-light');
  content = content.replace(/bg-blue-100/g, 'bg-accent-light');
  content = content.replace(/bg-blue-900\/[2345]0/g, 'bg-accent-light');
  content = content.replace(/accent-blue-500/g, 'accent-accent');
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/App.tsx',
  'src/components/GraphView.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/NoteEditor.tsx',
  'src/components/TapeCalculator.tsx',
  'src/components/Whiteboard.tsx',
  'src/components/Spreadsheet.tsx',
  'src/components/QuickAddMenu.tsx',
  'src/index.css'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    replaceInFile(f);
  }
});
console.log("Colors replaced");
