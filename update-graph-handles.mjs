import fs from 'fs';

let content = fs.readFileSync('src/components/GraphView.tsx', 'utf-8');

// The handles string template
const handlesString = `
        {/* 8 Handles */}
        <Handle type="source" id="t" position={Position.Top} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="b" position={Position.Bottom} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="l" position={Position.Left} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="r" position={Position.Right} className="w-4 h-4 !bg-blue-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ top: '50%' }} isConnectable={!data.isLocked} />
        
        <Handle type="source" id="tl" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="tr" position={Position.Top} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="bl" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '15%' }} isConnectable={!data.isLocked} />
        <Handle type="source" id="br" position={Position.Bottom} className="w-4 h-4 !bg-purple-500 border-2 border-white dark:border-[#0a0a0a] transition-all opacity-0 group-hover:opacity-100 hover:scale-125 z-20" style={{ left: '85%' }} isConnectable={!data.isLocked} />
`;

// Replace handles in Media node
content = content.replace(
  /<Handle type="target" position=\{Position\.Top\}.*?\/>\s*<Handle type="source" position=\{Position\.Bottom\}.*?\/>\s*<Handle type="source" position=\{Position\.Left\}.*?\/>\s*<Handle type="source" position=\{Position\.Right\}.*?\/>/g,
  handlesString
);

// Replace handles in group node
content = content.replace(
  /\{data\.isLocked && <Lock size=\{14\} className="absolute top-1 left-2 text-red-500 z-10 drop-shadow-md" \/>\}\s*\{data\.isReadOnly && <Eye size=\{14\} className="absolute top-1 left-6 text-amber-500 z-10 drop-shadow-md" \/>\}\s*<Handle type="target" position=\{Position\.Top\}.*?\/>/g,
  `{data.isLocked && <Lock size={14} className="absolute top-1 left-2 text-red-500 z-10 drop-shadow-md" />}
        {data.isReadOnly && <Eye size={14} className="absolute top-1 left-6 text-amber-500 z-10 drop-shadow-md" />}
        ${handlesString}`
);

// Note we also need to remove the Bottom handle from the group node
content = content.replace(
  /<Handle type="source" position=\{Position\.Bottom\}.*?\/>\s*\{showContextMenu && renderContextMenu\(\)\}\s*<\/div>/g,
  `{showContextMenu && renderContextMenu()}
      </div>`
);

// Replace handles in standard nodes
content = content.replace(
  /<Handle type="target" position=\{Position\.Top\}.*?\/>\s*<Icon size=\{isCircular \? 24 : 20\} \/>/g,
  `${handlesString}
      <Icon size={isCircular ? 24 : 20} />`
);

content = content.replace(
  /<\/div>\s*\)\}\s*<Handle type="source" position=\{Position\.Bottom\}.*?\/>\s*\{showContextMenu && renderContextMenu\(\)\}/g,
  `</div>
      )}
      {showContextMenu && renderContextMenu()}`
);


// Add isValidConnection to ReactFlow component
if (!content.includes('isValidConnection={isValidConnection}')) {
  // First define the function outside or inside component
  content = content.replace(
    /const onConnect = useCallback\(\(params: Connection\) => \{/,
    `const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

  const onConnect = useCallback((params: Connection) => {`
  );
  
  // Now add to ReactFlow
  content = content.replace(
    /<ReactFlow\s*nodes=\{flowNodes\}\s*edges=\{edges\}/,
    `<ReactFlow
          nodes={flowNodes}
          edges={edges}
          isValidConnection={isValidConnection}`
  );
}

// Remove tag button from context menu
content = content.replace(
  /<button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick=\{\(\) => \{[^{}]*prompt\('أضف تصنيف:'.*?\}\}>\s*<Tag size=\{14\} \/>\s*تصنيف\s*<\/button>/g,
  ""
);
content = content.replace(
  /<button className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left" onClick=\{\(\) => \{ const t = prompt\('أضف تصنيف:'\); if \(t\) \{ data\.onUpdateTags\?\(\[...\(data\.tags \|\| \[\]\), t\]\); \} setShowContextMenu\(false\); \}\}>\s*<Tag size=\{14\} \/>\s*تصنيف\s*<\/button>/g,
  ""
);

fs.writeFileSync('src/components/GraphView.tsx', content);
console.log("GraphView updated");
