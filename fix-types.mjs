import fs from 'fs';

let content = fs.readFileSync('src/types.ts', 'utf-8');

// AppNode
content = content.replace(
  /tags\?: string\[\];/,
  `tags?: string[];\n  isReadOnly?: boolean;\n  excerpt?: string;`
);

// NoteData
content = content.replace(
  /export interface NoteData \{/,
  `export interface NoteVersion {\n  timestamp: number;\n  content: string;\n}\n\nexport interface NoteData {`
);

content = content.replace(
  /content: string;\n  updatedAt: number;/,
  `content: string;\n  updatedAt: number;\n  versions?: NoteVersion[];\n  pinCode?: string;\n  attachments?: { id: string, name: string, type: 'voice' | 'file', blob?: Blob }[];`
);

fs.writeFileSync('src/types.ts', content);
console.log("types updated");
