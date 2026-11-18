import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const ACTIVE_SW_CACHE_VERSION = 'lexicon-v2-fix-samples';

// Proactively clear any stale PWA caches and force Service Worker update
if (typeof window !== 'undefined') {
  if ('caches' in window) {
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== ACTIVE_SW_CACHE_VERSION)
            .map((name) => caches.delete(name))
        )
      )
      .catch(() => {
        // Ignore cache storage errors
      });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`/sw.js?v=${ACTIVE_SW_CACHE_VERSION}`, {
          updateViaCache: 'none',
        })
        .then((registration) => {
          registration.update().catch(() => {});
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch(() => {
          // Service worker registration optional in restricted iframe environments
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
