import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// We will apply multiple string replacements

// 1. Error Boundary Import is already there, but wrap SettingsModal and GravityGame in ErrorBoundary

content = content.replace(
  /<SettingsModal isOpen={isSettingsOpen} onClose=\{\(\) => setIsSettingsOpen\(false\)\} onSecretCode=\{handleSecretCode\} \/>/g,
  '<ErrorBoundary><SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSecretCode={handleSecretCode} /></ErrorBoundary>'
);

content = content.replace(
  /\{isGameOpen && <GravityGame onClose=\{\(\) => setIsGameOpen\(false\)\} \/>\}/g,
  '{isGameOpen && <ErrorBoundary><GravityGame onClose={() => setIsGameOpen(false)} /></ErrorBoundary>}'
);

// 2. Fix useDeferredValue for searchQuery
if (!content.includes('useDeferredValue')) {
  content = content.replace(
    /import React, \{ useState, useEffect, useCallback, useRef, useMemo \} from 'react';/,
    "import React, { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';"
  );
}
content = content.replace(
  /const nodes = useLiveQuery\(\(\) => db.nodes.toArray\(\), \[\]\) \|\| \[\];/,
  `const nodes = useLiveQuery(() => db.nodes.toArray(), []) || [];\n  const deferredSearchQuery = useDeferredValue(searchQuery);`
);

content = content.replace(
  /searchQuery=\{searchQuery\}/,
  'searchQuery={deferredSearchQuery}'
);

// 3. Update cleanup in useEffect for saveTimeoutRef
content = content.replace(
  /window\.removeEventListener\('dataSaved', handleSave\);\n      if \(saveTimeoutRef\.current\) \{\n        window\.clearTimeout\(saveTimeoutRef\.current\);\n      \}/g,
  "window.removeEventListener('dataSaved', handleSave);\n      if (saveTimeoutRef.current) {\n        window.clearTimeout(saveTimeoutRef.current);\n        saveTimeoutRef.current = null;\n      }"
);

// 4. Update handleDeleteNode for robust type switch and add db.files
content = content.replace(
  /await db\.transaction\('rw', \[db\.nodes, db\.calctapes, db\.notes, db\.whiteboards, db\.spreadsheets, db\.photos\], async \(\) => \{/,
  "await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos, db.files], async () => {"
);

content = content.replace(
  /await db\.nodes\.delete\(id\);\n        if \(type === 'calctape'\) await db\.calctapes\.delete\(id\);\n        else if \(type === 'note' \|\| type === 'quick_note'\) await db\.notes\.delete\(id\);\n        else if \(type === 'whiteboard' \|\| type === 'drawing'\) await db\.whiteboards\.delete\(id\);\n        else if \(type === 'spreadsheet'\) await db\.spreadsheets\.delete\(id\);\n        else if \(type === 'photo_editor'\) await db\.photos\.delete\(id\);/,
  `await db.nodes.delete(id);
        switch (type) {
          case 'calctape': await db.calctapes.delete(id); break;
          case 'note':
          case 'quick_note': await db.notes.delete(id); break;
          case 'whiteboard':
          case 'drawing': await db.whiteboards.delete(id); break;
          case 'spreadsheet': await db.spreadsheets.delete(id); break;
          case 'photo_editor': await db.photos.delete(id); break;
          case 'voice_note':
          case 'media': await db.files.delete(id); break;
          default: break;
        }`
);

// 5. Node Creation Factory and replace handlers
const oldHandlersRegex = /const handleMediaUpload = async.*?const handleInlineNoteSubmit = async.*?\} catch \(e\) \{\n      console\.error\('Failed to add inline note', e\);\n    \}\n  \};/s;

const newHandlers = `
  const createNodeFactory = useCallback(async (type: AppModule, options?: { title?: string; x?: number; y?: number; blob?: Blob; mimeType?: string; name?: string; content?: string }) => {
    try {
      const id = uuidv4();
      const t = settings.language === 'ar';
      
      let title = options?.title;
      if (!title) {
        title = t ? 'عقدة جديدة' : 'New Node';
        switch (type) {
          case 'whiteboard': title = t ? 'سبورة تحليل' : 'Analysis Board'; break;
          case 'calctape': title = t ? 'آلة حاسبة' : 'Tape Calc'; break;
          case 'note': title = t ? 'ملاحظة' : 'Note'; break;
          case 'quick_note': title = t ? 'ملاحظة سريعة' : 'Quick Note'; break;
          case 'drawing': title = t ? 'رسم سريع' : 'Quick Draw'; break;
          case 'photo_editor': title = t ? 'محرر صور' : 'Photo Editor'; break;
          case 'spreadsheet': title = t ? 'جدول بيانات' : 'Spreadsheet'; break;
          case 'voice_note': title = t ? 'ملاحظة صوتية' : 'Voice Note'; break;
          case 'media': title = options?.name || (t ? 'ملف' : 'File'); break;
        }
      }

      const x = options?.x ?? (Math.random() * 200 - 100);
      const y = options?.y ?? (Math.random() * 200 - 100);

      await db.transaction('rw', [db.nodes, db.calctapes, db.notes, db.whiteboards, db.spreadsheets, db.photos, db.files], async () => {
        await db.nodes.add({
          id,
          title,
          type,
          x,
          y,
          linkedNodeIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: type === 'media' || type === 'voice_note',
          isPinned: false,
        });

        switch (type) {
          case 'calctape':
            await db.calctapes.add({ id, lines: [], updatedAt: Date.now() });
            break;
          case 'note':
          case 'quick_note':
            await db.notes.add({ id, content: options?.content || '', updatedAt: Date.now() });
            break;
          case 'whiteboard':
          case 'drawing':
            await db.whiteboards.add({ id, elements: [], updatedAt: Date.now() });
            break;
          case 'spreadsheet':
            await db.spreadsheets.add({ id, cells: {}, updatedAt: Date.now() });
            break;
          case 'photo_editor':
            await db.photos.add({ id, updatedAt: Date.now() });
            break;
          case 'voice_note':
          case 'media':
            if (options?.blob) {
              await db.files.add({
                id,
                blob: options.blob,
                mimeType: options.mimeType || 'application/octet-stream',
                name: options.name || title,
                updatedAt: Date.now(),
              });
            }
            break;
        }
      });
      
      setRecentNodes(prev => [id, ...prev].slice(0, 10));
      return id;
    } catch (error) {
      console.error("Failed to create node:", error);
      alert(settings.language === 'ar' ? 'حدث خطأ أثناء إنشاء العقدة.' : 'Error creating node.');
      return null;
    }
  }, [settings.language]);

  const handleMediaUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type) || file.type === type);
    
    if (!isAllowed) {
       alert(settings.language === 'ar' ? 'صيغة الملف غير مدعومة' : 'Unsupported file format');
       return;
    }

    await createNodeFactory('media', {
      title: file.name,
      blob: file,
      mimeType: file.type,
      name: file.name
    });

    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = '';
    }
  }, [createNodeFactory, settings.language]);

  const handleVoiceNoteSave = useCallback(async (blob: Blob) => {
    setShowVoiceRecorder(false);
    await createNodeFactory('voice_note', {
      blob,
      mimeType: 'audio/webm'
    });
  }, [createNodeFactory]);

  const handleInlineNoteSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineNote.trim()) return;
    
    await createNodeFactory('quick_note', {
      content: inlineNote.trim(),
      y: -150
    });
    setInlineNote('');
  }, [inlineNote, createNodeFactory]);
`;

content = content.replace(oldHandlersRegex, newHandlers);

// Remove the old handleAddNode
const oldHandleAddNodeRegex = /const handleAddNode = useCallback\(async \(type: AppModule = 'note'\) => \{.*?setActiveNodeId\(id\);\n    \} catch \(error\) \{.*?\n    \}\n  \}, \[settings\.language\]\);/s;
content = content.replace(oldHandleAddNodeRegex, `const handleAddNode = useCallback(async (type: AppModule = 'note') => {
    const id = await createNodeFactory(type);
    if (id) setActiveNodeId(id);
  }, [createNodeFactory]);`);


fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('App.tsx updated successfully');
