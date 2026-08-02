import { useEffect } from 'react';

export function useKeyboardShortcuts(onNewNode: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || (activeEl as HTMLElement).isContentEditable) {
        return;
      }
      
      // Ctrl+N or Cmd+N to create a new note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onNewNode();
      }

      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewNode]);
}
