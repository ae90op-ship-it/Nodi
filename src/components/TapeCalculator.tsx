import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { evaluate } from 'mathjs';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { db } from '../db';
import type { TapeLine, CalcTapeData } from '../types';

interface TapeCalculatorProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function TapeCalculator({ nodeId, onClose, onDelete }: TapeCalculatorProps) {
  const [lines, setLines] = useState<TapeLine[]>([]);
  const [title, setTitle] = useState("شريط الحسابات");

  useEffect(() => {
    async function loadData() {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);

      const data = await db.calctapes.get(nodeId);
      if (data && data.lines.length > 0) {
        setLines(data.lines);
      } else {
        setLines([{ id: uuidv4(), expression: '', result: null, comment: '' }]);
      }
    }
    loadData();
  }, [nodeId]);

  // Recalculate logic based on historical dependencies
  const recalculate = (currentLines: TapeLine[]) => {
    let runningTotal = 0;
    
    return currentLines.map((line) => {
      try {
        if (!line.expression.trim()) {
          return { ...line, result: null };
        }
        
        // Advanced logic: if expression starts with operator (+, -, *, /), it acts on the runningTotal
        let expr = line.expression;
        if (/^[\+\-\*\/]/.test(expr.trim())) {
          expr = `${runningTotal} ${expr}`;
        }

        const result = evaluate(expr);
        runningTotal = result;
        return { ...line, result };
      } catch (e) {
        return { ...line, result: null }; // Invalid expression, don't crash
      }
    });
  };

  const handleExpressionChange = (id: string, newExpression: string) => {
    const updatedLines = lines.map(line => 
      line.id === id ? { ...line, expression: newExpression } : line
    );
    const newCalculatedLines = recalculate(updatedLines);
    setLines(newCalculatedLines);
    triggerSave(newCalculatedLines);
  };

  const handleCommentChange = (id: string, newComment: string) => {
    const updatedLines = lines.map(line => 
      line.id === id ? { ...line, comment: newComment } : line
    );
    setLines(updatedLines);
    triggerSave(updatedLines);
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle, updatedAt: Date.now() });
  };

  const addLine = () => {
    const newLine = { id: uuidv4(), expression: '', result: null, comment: '' };
    const newLines = recalculate([...lines, newLine]);
    setLines(newLines);
    triggerSave(newLines);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const index = lines.findIndex(l => l.id === id);
      const newLine = { id: uuidv4(), expression: '', result: null, comment: '' };
      const updatedLines = [...lines.slice(0, index + 1), newLine, ...lines.slice(index + 1)];
      const newCalculatedLines = recalculate(updatedLines);
      setLines(newCalculatedLines);
      triggerSave(newCalculatedLines);
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback((currentLines: TapeLine[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await db.calctapes.put({
        id: nodeId,
        lines: currentLines,
        updatedAt: Date.now()
      });
    }, 500);
  }, [nodeId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const totalSum = lines[lines.length - 1]?.result || 0;

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <input 
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-lg font-semibold outline-none focus:border-b focus:border-blue-500 w-64"
            placeholder="عنوان الآلة الحاسبة"
          />
        </div>
        <div className="flex gap-2">
          {onDelete && (
            <button onClick={onDelete} className="p-2 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 rounded-full transition-colors" title="حذف">
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={() => triggerSave(lines)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400">
            <Save size={20} />
          </button>
        </div>
      </div>

      {/* Tape Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 font-mono">
        {lines.map((line) => (
          <div key={line.id} className="flex items-start gap-4 p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors group">
            {/* Expression Input */}
            <div className="flex-1">
              <input
                value={line.expression}
                onChange={(e) => handleExpressionChange(line.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, line.id)}
                placeholder="ex: 150 + 45"
                className="w-full bg-transparent outline-none text-xl tracking-wider placeholder:text-neutral-600"
                dir="ltr"
              />
            </div>
            {/* Result */}
            <div className="w-32 text-right">
              <span className="text-xl text-blue-400 font-bold">
                {line.result !== null ? `= ${line.result.toLocaleString()}` : ''}
              </span>
            </div>
            {/* Comment Input */}
            <div className="w-1/3 border-r border-neutral-700 pr-4">
              <input
                value={line.comment}
                onChange={(e) => handleCommentChange(line.id, e.target.value)}
                placeholder="ملاحظة..."
                className="w-full bg-transparent outline-none text-sm text-neutral-400"
              />
            </div>
          </div>
        ))}
        
        <button 
          onClick={addLine}
          className="flex items-center gap-2 text-neutral-400 hover:text-white p-4"
        >
          <Plus size={20} />
          <span>إضافة سطر جديد</span>
        </button>
      </div>

      {/* Footer Total */}
      <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <span className="text-xl text-neutral-400">الإجمالي:</span>
        <span className="text-4xl font-bold text-white tracking-wider" dir="ltr">
          {totalSum.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
