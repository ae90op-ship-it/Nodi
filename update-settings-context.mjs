import fs from 'fs';

let content = fs.readFileSync('src/SettingsContext.tsx', 'utf-8');

// Add accentColor to Settings interface
content = content.replace(
  /snapToGrid: boolean;\n}/,
  'snapToGrid: boolean;\n  accentColor: string;\n}'
);

// Add accentColor to defaultSettings
content = content.replace(
  /snapToGrid: false,\n\};/,
  "snapToGrid: false,\n  accentColor: '#3b82f6',\n};"
);

// Add accentColor to document custom property
content = content.replace(
  /document\.body\.className = `\$\{settings\.theme/g,
  `document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    document.body.className = \`\${settings.theme`
);

fs.writeFileSync('src/SettingsContext.tsx', content);
