import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { AudioClipItem, formatDuration, wavDataUrlToBlobUrl } from '../utils/ttsEngine';

interface PremiumAudioPlayerProps {
  clip: AudioClipItem | null;
}

const PLAYBACK_SPEEDS = [0.85, 1.0, 1.15, 1.25, 1.5];

export const PremiumAudioPlayer: React.FC<PremiumAudioPlayerProps> = ({ clip }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip?.durationSec ?? 0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(clip?.durationSec ?? 0);
    if (
      blobUrlRef.current &&
      blobUrlRef.current.startsWith('blob:') &&
      typeof URL !== 'undefined' &&
      typeof URL.revokeObjectURL === 'function'
    ) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (audioRef.current && clip) {
      audioRef.current.pause();
      const playableUrl = wavDataUrlToBlobUrl(clip.audioDataUrl);
      if (playableUrl.startsWith('blob:')) {
        blobUrlRef.current = playableUrl;
      }
      audioRef.current.src = playableUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.load();
    }
  }, [clip?.id, clip?.audioDataUrl]);

  const waveformBars = useMemo(() => {
    const seedSource = clip ? `${clip.id}-${clip.title}-${clip.transcript}` : 'lexicon-ai';
    const bars: number[] = [];
    let hash = 2166136261;
    for (let i = 0; i < seedSource.length; i++) {
      hash ^= seedSource.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let i = 0; i < 60; i++) {
      const n = Math.abs(Math.sin(hash + i * 0.65) * Math.cos(i * 0.29));
      bars.push(Math.max(18, Math.min(98, Math.round(n * 85 + 15))));
    }
    return bars;
  }, [clip]);

  if (!clip) {
    return null;
  }

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        el.playbackRate = playbackRate;
        await el.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const handleRestart = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    setCurrentTime(0);
  };

  const handleCycleSpeed = () => {
    const nextIdx = (PLAYBACK_SPEEDS.indexOf(playbackRate) + 1) % PLAYBACK_SPEEDS.length;
    const nextSpeed = PLAYBACK_SPEEDS[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeekBar = (index: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const targetTime = (index / waveformBars.length) * duration;
    el.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleDownloadFinalAudio = () => {
    const link = document.createElement('a');
    link.href = blobUrlRef.current || clip.audioDataUrl;
    const safeTitle =
      clip.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'lexicon-ai-audio';
    link.download = `${safeTitle}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl">
      <audio
        ref={audioRef}
        playsInline
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {/* Top Row: Track Details & Download Final Audio Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-[#4F46E5]/35 transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-base font-bold text-white">
                {clip.title}
              </h3>
              <span className="shrink-0 rounded-md border border-[#06B6D4]/40 bg-[#06B6D4]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#06B6D4]">
                24kHz WAV
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-[#94A3B8]">
              Voice: <span className="font-medium text-white">{clip.voiceSummary}</span> •{' '}
              <span>{clip.styleDirection}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="whitespace-nowrap rounded-xl border border-white/10 bg-[#0B0F19]/80 px-3 py-1.5 font-mono text-xs text-white">
            {formatDuration(currentTime)} <span className="text-[#94A3B8]">/</span>{' '}
            {formatDuration(duration || clip.durationSec)}
          </div>

          <button
            type="button"
            onClick={handleCycleSpeed}
            title="Playback speed"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs font-semibold text-[#06B6D4] transition-colors hover:border-[#4F46E5]/50 hover:text-white"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart audio"
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-[#94A3B8] transition-colors hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDownloadFinalAudio}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#4F46E5]/30 transition-all hover:brightness-110"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Final Audio (WAV/MP3)</span>
          </button>
        </div>
      </div>

      {/* Simulated Waveform Visualization */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/90 px-4 py-3">
        <Volume2 className="h-4 w-4 shrink-0 text-[#06B6D4]" />
        <div
          className="flex h-12 flex-1 items-center gap-[3px]"
          role="slider"
          aria-label="Audio Waveform Seek Bar"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration || clip.durationSec)}
          aria-valuenow={Math.round(currentTime)}
        >
          {waveformBars.map((heightPct, idx) => {
            const barProgress = idx / waveformBars.length;
            const isPlayed = barProgress <= progressRatio;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSeekBar(idx)}
                aria-label={`Seek to ${Math.round(barProgress * 100)}%`}
                className="group relative flex h-full flex-1 items-center justify-center focus:outline-none"
              >
                <span
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-full transition-all duration-150 ${
                    isPlayed
                      ? 'bg-gradient-to-t from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                      : 'bg-white/15 group-hover:bg-white/35'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-[#3B82F6]" />
      </div>
    </div>
  );
};
