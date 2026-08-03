import fs from 'fs';

let content = fs.readFileSync('src/components/QuickAddMenu.tsx', 'utf-8');

// Hide (+) when open
content = content.replace(
  /<button \n\s*onClick=\{toggleMenu\}\n\s*className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300 active:scale-95 relative"\n\s*>\n\s*<Plus size=\{28\} className=\{cn\("transition-transform duration-300", isOpen && "rotate-45"\)\} \/>\n\s*<\/button>/s,
  `{!isOpen && (
        <button 
          onClick={toggleMenu}
          className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300 active:scale-95 relative"
        >
          <Plus size={28} className="transition-transform duration-300" />
        </button>
      )}`
);

// Mobile Screen Overflow
content = content.replace(
  /<div className="flex flex-col h-full max-h-\[85vh\]">/,
  '<div className="flex flex-col h-full max-h-[75vh] overflow-hidden">'
);

fs.writeFileSync('src/components/QuickAddMenu.tsx', content);
console.log("QuickAddMenu updated");
