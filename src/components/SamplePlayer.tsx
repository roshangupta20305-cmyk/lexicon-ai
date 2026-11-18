import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import {
  VoiceName,
  DEFAULT_VOICE_SAMPLE_TEXT,
  createSynthesizedToneWavDataUrl,
  getVoiceProfile,
  getVoiceSampleAudioDataUrl,
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
  useLiveApiWhenRequested?: boolean;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

export const SamplePlayer: React.FC<SamplePlayerProps> = ({
  voiceName,
  sampleText = DEFAULT_VOICE_SAMPLE_TEXT,
  compact = false,
  label,
  useLiveApiWhenRequested = true,
  onPlaybackChange,
}) => {
  const instanceIdRef = useRef<string>(
    `sample-${voiceName}-${Math.random().toString(36).slice(2, 8)}`
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

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
      if (activeSampleId === instanceIdRef.current) {
        activeSampleStopCallback = null;
        activeSampleId = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
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
    setIsLoading(true);
    setProgressPct(0);

    try {
      const profile = getVoiceProfile(voiceName);
      let audioDataUrl: string;

      if (useLiveApiWhenRequested) {
        audioDataUrl = await getVoiceSampleAudioDataUrl(voiceName, sampleText);
      } else {
        audioDataUrl = createSynthesizedToneWavDataUrl(3.2, profile.sampleFreq);
      }

      if (activeSampleId !== instanceIdRef.current) {
        return;
      }

      const el = audioRef.current;
      if (!el) {
        setIsLoading(false);
        return;
      }

      el.src = audioDataUrl;
      el.currentTime = 0;
      el.load();

      setIsLoading(false);
      setIsPlaying(true);
      onPlaybackChange?.(true);

      await el.play();
    } catch {
      // Fallback to instant acoustic WAV if initial source failed to play
      try {
        const profile = getVoiceProfile(voiceName);
        const fallbackUrl = createSynthesizedToneWavDataUrl(3.2, profile.sampleFreq);
        if (audioRef.current && activeSampleId === instanceIdRef.current) {
          audioRef.current.src = fallbackUrl;
          audioRef.current.currentTime = 0;
          setIsLoading(false);
          setIsPlaying(true);
          onPlaybackChange?.(true);
          await audioRef.current.play().catch(() => {
            // Keep visual playback timer if browser autoplay policy is strict
          });
        }
      } catch {
        setIsLoading(false);
        setIsPlaying(false);
        onPlaybackChange?.(false);
      }
    }
  };

  const buttonText = isPlaying ? 'Stop Sample' : label || 'Play Sample';

  return (
    <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setProgressPct(Math.min(100, Math.round((e.currentTarget.currentTime / d) * 100)));
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
          setIsPlaying(false);
          setIsLoading(false);
          setProgressPct(0);
          onPlaybackChange?.(false);
        }}
      />

      <button
        type="button"
        onClick={handleToggleSample}
        aria-label={
          isPlaying
            ? `Stop ${voiceName} voice sample`
            : `Play ${voiceName} voice sample`
        }
        className={`relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl font-semibold transition-all duration-150 active:scale-95 whitespace-nowrap shrink-0 ${
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
            <>
              <Volume2 className="h-3.5 w-3.5 animate-pulse text-[#06B6D4]" />
              <span>■ {buttonText}</span>
            </>
          ) : (
            <span>▶ {buttonText}</span>
          )}
        </span>
      </button>
    </div>
  );
};
