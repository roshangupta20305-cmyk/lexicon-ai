import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  VoiceName,
  getVoiceSampleAudioDataUrl,
  getVoiceSampleText,
  wavDataUrlToBlobUrl,
} from '../utils/ttsEngine';

// Singleton registry ensuring only ONE voice sample plays at a time across the entire app
type StopCallback = () => void;
let activeSampleStopCallback: StopCallback | null = null;
let activeSampleId: string | null = null;

export function stopAllActiveVoiceSamples(): void {
  if (activeSampleStopCallback) {
    activeSampleStopCallback();
    activeSampleStopCallback = null;
    activeSampleId = null;
  }
}

interface SamplePlayerProps {
  voiceName: VoiceName;
  sampleText?: string;
  compact?: boolean;
  label?: string;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

export const SamplePlayer: React.FC<SamplePlayerProps> = ({
  voiceName,
  sampleText,
  compact = false,
  label = 'Play Sample',
  onPlaybackChange,
}) => {
  const instanceIdRef = useRef<string>(
    `sample-${voiceName}-${Math.random().toString(36).slice(2, 8)}`
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [toastError, setToastError] = useState<string | null>(null);

  const effectiveScript =
    sampleText && sampleText.trim().startsWith('Welcome to Lexicon AI.')
      ? sampleText.trim()
      : getVoiceSampleText(voiceName);

  const showFailureToast = (msg = 'Sample failed. Try again.') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastError(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastError(null);
    }, 4000);
  };

  const revokeActiveBlobUrl = () => {
    if (
      activeBlobUrlRef.current &&
      activeBlobUrlRef.current.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
  };

  const stopThisPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setProgressPct(0);
    onPlaybackChange?.(false);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (activeSampleId === instanceIdRef.current) {
        activeSampleStopCallback = null;
        activeSampleId = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      revokeActiveBlobUrl();
    };
  }, []);

  const handleToggleSample = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying || isLoading) {
      stopThisPlayer();
      if (activeSampleId === instanceIdRef.current) {
        activeSampleStopCallback = null;
        activeSampleId = null;
      }
      return;
    }

    // Auto-stop any other currently playing sample
    if (activeSampleStopCallback && activeSampleId !== instanceIdRef.current) {
      activeSampleStopCallback();
    }

    activeSampleId = instanceIdRef.current;
    activeSampleStopCallback = stopThisPlayer;
    setToastError(null);
    setIsLoading(true);
    setProgressPct(0);

    const el = audioRef.current;
    // Synchronously prime the <audio> element inside the tap gesture for mobile standalone PWAs
    if (el) {
      try {
        el.pause();
        el.load();
      } catch {
        // Ignore
      }
    }

    try {
      const audioDataUrl = await getVoiceSampleAudioDataUrl(
        voiceName,
        effectiveScript
      );

      if (activeSampleId !== instanceIdRef.current) {
        return;
      }

      if (!el) {
        setIsLoading(false);
        return;
      }

      // Convert base64 WAV to a native binary Blob URL for mobile standalone PWA compatibility
      revokeActiveBlobUrl();
      const playableUrl = wavDataUrlToBlobUrl(audioDataUrl);
      if (playableUrl.startsWith('blob:')) {
        activeBlobUrlRef.current = playableUrl;
      }

      el.src = playableUrl;
      el.playbackRate = 1.0;
      el.currentTime = 0;
      el.load();

      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => {
          cleanup();
          if (Number.isFinite(el.duration) && el.duration < 3.0) {
            reject(new Error('Sample audio under 3 seconds.'));
            return;
          }
          resolve();
        };
        const onErr = () => {
          cleanup();
          reject(new Error('Audio element failed to decode WAV sample.'));
        };
        const cleanup = () => {
          el.removeEventListener('loadedmetadata', onLoaded);
          el.removeEventListener('error', onErr);
        };
        el.addEventListener('loadedmetadata', onLoaded, { once: true });
        el.addEventListener('error', onErr, { once: true });
      });

      if (activeSampleId !== instanceIdRef.current) {
        return;
      }

      setIsLoading(false);
      setIsPlaying(true);
      onPlaybackChange?.(true);

      await el.play();
    } catch {
      stopThisPlayer();
      if (activeSampleId === instanceIdRef.current) {
        activeSampleId = null;
        activeSampleStopCallback = null;
      }
      showFailureToast('Sample failed. Try again.');
    }
  };

  return (
    <div
      className="relative inline-flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onTimeUpdate={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setProgressPct(
              Math.min(100, Math.round((e.currentTarget.currentTime / d) * 100))
            );
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgressPct(0);
          onPlaybackChange?.(false);
          if (activeSampleId === instanceIdRef.current) {
            activeSampleId = null;
            activeSampleStopCallback = null;
          }
        }}
        onError={() => {
          if (isPlaying || isLoading) {
            stopThisPlayer();
            if (activeSampleId === instanceIdRef.current) {
              activeSampleId = null;
              activeSampleStopCallback = null;
            }
            showFailureToast('Sample failed. Try again.');
          }
        }}
      />

      <button
        type="button"
        onClick={handleToggleSample}
        data-voice-sample-btn={voiceName}
        data-sample-script={effectiveScript}
        title={effectiveScript}
        aria-label={
          isPlaying
            ? `Stop ${voiceName} voice sample`
            : `Play ${voiceName} voice sample`
        }
        className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl font-semibold transition-all duration-150 active:scale-95 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-1.5 text-xs'
        } ${
          isPlaying
            ? 'border border-[#06B6D4]/60 bg-[#06B6D4]/20 text-[#06B6D4] shadow-sm shadow-[#06B6D4]/20'
            : isLoading
            ? 'border border-[#4F46E5]/50 bg-[#4F46E5]/20 text-white'
            : 'border border-white/15 bg-white/[0.06] text-white hover:border-[#06B6D4]/50 hover:bg-white/[0.12]'
        }`}
      >
        {isPlaying && progressPct > 0 && (
          <span
            aria-hidden="true"
            style={{ width: `${progressPct}%` }}
            className="pointer-events-none absolute bottom-0 left-0 top-0 bg-[#06B6D4]/20 transition-all duration-150"
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#06B6D4]" />
              <span>Loading...</span>
            </>
          ) : isPlaying ? (
            <span>⏸ Stop Sample</span>
          ) : (
            <span>▶ {label}</span>
          )}
        </span>
      </button>

      {toastError && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full left-0 z-30 mb-2 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#EF4444]/40 bg-[#0B0F19]/95 px-2.5 py-1.5 text-[11px] font-medium text-[#EF4444] shadow-lg backdrop-blur-md"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#EF4444]" />
          <span>{toastError}</span>
        </div>
      )}
    </div>
  );
};
