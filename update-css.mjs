import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf-8');

content = content.replace(
  /@theme \{/,
  `@theme {\n  --color-accent: var(--accent-color, #3b82f6);\n  --color-accent-hover: color-mix(in srgb, var(--accent-color, #3b82f6) 80%, black);\n  --color-accent-light: color-mix(in srgb, var(--accent-color, #3b82f6) 20%, transparent);`
);

// We should also replace blue-500/600 with accent in some places. Let's do it directly in the React components.

fs.writeFileSync('src/index.css', content);
