import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { evaluate } from 'mathjs';
import { ArrowLeft, Save, Plus, Trash2, Keyboard } from 'lucide-react';
import { db } from '../db';
import type { TapeLine, CalcTapeData } from '../types';
import debounce from 'lodash.debounce';

interface TapeCalculatorProps {
  nodeId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export function TapeCalculator({ nodeId, onClose, onDelete }: TapeCalculatorProps) {
  const [lines, setLines] = useState<TapeLine[]>([]);
  const [title, setTitle] = useState("شريط الحسابات");

  const [currentExpr, setCurrentExpr] = useState('');
  const [currentComment, setCurrentComment] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const node = await db.nodes.get(nodeId);
      if (node) setTitle(node.title);
      const data = await db.calctapes.get(nodeId);
      if (data && data.lines.length > 0) {
        setLines(data.lines);
      } else {
        setLines([{ id: uuidv4(), expression: '', result: null, comment: '' }]);
      }
    };
    loadData();
  }, [nodeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const debouncedSave = useRef(
    debounce(async (newLines: TapeLine[]) => {
      await db.calctapes.put({
        id: nodeId,
        lines: newLines,
        updatedAt: Date.now()
      });
    }, 500)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const triggerSave = useCallback((newLines: TapeLine[]) => {
    debouncedSave(newLines);
  }, [debouncedSave]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    await db.nodes.update(nodeId, { title: newTitle });
  };

  const handleAddLine = () => {
    if (!currentExpr.trim()) return;

    let result = null;
    try {
      result = evaluate(currentExpr);
    } catch (e) {
      result = null;
    }

    const newLine = {
      id: uuidv4(),
      expression: currentExpr,
      result,
      comment: currentComment
    };

    const newLines = [...lines, newLine];
    setLines(newLines);
    triggerSave(newLines);
    setCurrentExpr('');
    setCurrentComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLine();
    }
  };

  const total = lines.reduce((acc, curr) => acc + (curr.result || 0), 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="rotate-180" size={20} />
          </button>
          <input 
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-lg font-semibold outline-none focus:border-b focus:border-blue-500 w-48 md:w-64"
            placeholder="عنوان الآلة الحاسبة"
          />
        </div>
        <div className="flex gap-2">
          {onDelete && (
            <button onClick={onDelete} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors" title="حذف">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tape Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 font-mono" ref={scrollRef}>
        {lines.map((line) => (
          <div key={line.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-transparent">
            {/* Expression */}
            <div className="w-full md:w-1/3 md:border-l md:border-neutral-200 dark:md:border-neutral-700 md:pl-4 text-left order-2 md:order-1" dir="ltr">
              <span className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base">{line.expression}</span>
              {line.result !== null && (
                <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">= {line.result}</div>
              )}
            </div>
            {/* Comment */}
            <div className="w-full md:w-2/3 text-neutral-700 dark:text-neutral-300 text-sm order-1 md:order-2">
              {line.comment || <span className="text-neutral-400 dark:text-neutral-500 italic">بدون تعليق</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex-1 flex flex-col md:flex-row gap-4 w-full">
          <div className="flex gap-2 flex-1 relative">
            <input 
              type="text"
              ref={inputRef}
              value={currentExpr}
              onChange={e => setCurrentExpr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثال: 1200 * 0.15"
              className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 font-mono outline-none focus:border-blue-500 text-left text-neutral-900 dark:text-white shadow-sm pr-12"
              dir="ltr"
            />
            <button 
              onClick={() => inputRef.current?.focus()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 md:hidden text-neutral-500 hover:text-blue-500 bg-neutral-100 dark:bg-neutral-800 rounded-lg active:scale-95"
              title="إظهار لوحة المفاتيح"
            >
              <Keyboard size={20} />
            </button>
          </div>
          <input 
            type="text"
            value={currentComment}
            onChange={e => setCurrentComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ملاحظة حول العملية (اختياري)..."
            className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-neutral-900 dark:text-white shadow-sm"
          />
          <button 
            onClick={handleAddLine}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 flex items-center justify-center gap-2 transition-colors font-semibold shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> إضافة
          </button>
        </div>
        
        <div className="w-full md:w-auto min-w-[200px] bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <span className="text-neutral-500 dark:text-neutral-400 font-semibold text-sm">المجموع</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
            {total}
          </span>
        </div>
      </div>
    </div>
  );
}
