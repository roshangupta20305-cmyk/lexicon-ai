import React from 'react';
import { CheckCircle2, Download, Share, Smartphone, Sparkles, X } from 'lucide-react';

interface InstallPromptProps {
  showBanner: boolean;
  showInstallModal: boolean;
  isIOS: boolean;
  hasNativePrompt: boolean;
  onTriggerInstall: () => void;
  onConfirmStandaloneInstall: () => void;
  onDismissBanner: () => void;
  onCloseModal: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  showBanner,
  showInstallModal,
  isIOS,
  hasNativePrompt,
  onTriggerInstall,
  onConfirmStandaloneInstall,
  onDismissBanner,
  onCloseModal,
}) => {
  return (
    <>
      {/* Subtle Bottom PWA Install Banner */}
      {showBanner && (
        <div className="mx-auto mt-6 max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#4F46E5]/40 bg-[#0F1629]/95 p-4 shadow-xl shadow-[#4F46E5]/15 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-white shadow-md shadow-[#4F46E5]/30">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Install Lexicon AI — Professional Voice Studio
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Add to your desktop or home screen for instant launch and offline audio access.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onTriggerInstall}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#4F46E5]/30 transition-all hover:brightness-110"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </button>
              <button
                type="button"
                onClick={onDismissBanner}
                aria-label="Dismiss install banner"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#94A3B8] transition-colors hover:bg-white/[0.1] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Standalone Install Modal */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lexicon-pwa-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0F1629] p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-[#4F46E5]/30">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3
                    id="lexicon-pwa-modal-title"
                    className="font-display text-base font-bold text-white"
                  >
                    Install Lexicon AI
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Standalone Progressive Web App
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2 text-[#06B6D4]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-white">
                  Offline App Shell &amp; Voice Studio Ready
                </span>
              </div>
              <p className="leading-relaxed">
                {isIOS ? (
                  <>
                    On iOS Safari, tap <Share className="inline h-3.5 w-3.5 text-white" />{' '}
                    <strong className="text-white">Share</strong> and choose{' '}
                    <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>.
                  </>
                ) : hasNativePrompt ? (
                  <>Click below to install Lexicon AI directly to your device.</>
                ) : (
                  <>
                    Activate standalone app mode below, or click the install icon in your browser&apos;s address bar.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCloseModal}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmStandaloneInstall}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#4F46E5]/30 hover:brightness-110"
              >
                <Download className="h-4 w-4" />
                <span>Install Lexicon AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
