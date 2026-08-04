import React from 'react';
import { ArrowLeft, Table, Plus, Download, Save } from 'lucide-react';

interface SpreadsheetProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function Spreadsheet({ nodeId, onClose, onDelete }: SpreadsheetProps) {
  // Generate some mock grid data
  const rows = 20;
  const cols = 10;
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-sm flex items-center gap-2 px-2"><Table size={16}/> Untitled Spreadsheet</span>
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors text-accent dark:text-accent" title="Add Row">
            <Plus size={18}/>
          </button>
          <button className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors text-neutral-600 dark:text-neutral-400">
            <Download size={18}/>
          </button>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 border-b border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs">
        <select className="bg-transparent border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 outline-none">
          <option>Arial</option>
          <option>Times New Roman</option>
        </select>
        <select className="bg-transparent border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 outline-none">
          <option>10</option>
          <option>12</option>
          <option>14</option>
        </select>
        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1"/>
        <button className="px-2 py-1 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded">B</button>
        <button className="px-2 py-1 italic hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded">I</button>
        <button className="px-2 py-1 underline hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded">U</button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800">
        <table className="border-collapse bg-white dark:bg-neutral-900 text-sm">
          <thead>
            <tr>
              <th className="w-10 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 sticky top-0 left-0 z-20"></th>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="min-w-[100px] font-normal text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 py-1 sticky top-0 z-10">
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="text-center text-neutral-500 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 sticky left-0 z-10 font-mono text-xs">
                  {rowIndex + 1}
                </td>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 p-0">
                    <input 
                      type="text" 
                      className="w-full h-full px-2 py-1 outline-none bg-transparent focus:ring-2 focus:ring-accent focus:bg-accent-light dark:focus:bg-accent-light"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
