import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register VoxCraft PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration optional in restricted iframe environments
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
