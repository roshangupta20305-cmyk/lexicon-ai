import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_INSTALLED_KEY = 'voxcraft_pwa_installed_v1';
const PWA_BANNER_DISMISSED_KEY = 'voxcraft_pwa_banner_dismissed_v1';
const PWA_VISIT_COUNT_KEY = 'voxcraft_pwa_visit_count_v1';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) return true;
      return localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(PWA_BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    try {
      const prevVisits = Number(localStorage.getItem(PWA_VISIT_COUNT_KEY) || '0');
      const nextVisits = prevVisits + 1;
      localStorage.setItem(PWA_VISIT_COUNT_KEY, String(nextVisits));
      setVisitCount(nextVisits);
    } catch {
      // Ignore storage error
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      } catch {
        // Ignore
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        try {
          localStorage.setItem(PWA_INSTALLED_KEY, 'true');
        } catch {
          // Ignore
        }
        return true;
      }
      return false;
    }

    // Open guided install modal so user can install in standalone mode or simulate install in preview
    setShowInstallModal(true);
    return false;
  };

  const confirmStandaloneInstall = () => {
    setIsInstalled(true);
    setShowInstallModal(false);
    try {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem(PWA_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  return {
    isInstallable: !isInstalled,
    hasNativePrompt: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    visitCount,
    showBanner: !isInstalled && !isBannerDismissed,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
    confirmStandaloneInstall,
    dismissBanner,
  };
}
