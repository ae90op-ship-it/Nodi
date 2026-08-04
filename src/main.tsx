
const isResizeObserverError = (msg) => typeof msg === 'string' && msg.includes('ResizeObserver');

const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (isResizeObserverError(message)) {
    return true;
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

const originalConsoleError = console.error;
console.error = function(...args) {
  if (isResizeObserverError(args[0])) {
    return;
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', (e) => {
  if (e.message && isResizeObserverError(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);



import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </SettingsProvider>
  </StrictMode>,
);
