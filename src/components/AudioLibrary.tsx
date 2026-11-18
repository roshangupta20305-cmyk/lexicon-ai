import React, { useMemo, useState } from 'react';
import { Clock, Download, Library, Mic, Play, Search, Trash2 } from 'lucide-react';
import {
  AudioClipItem,
  VOICES,
  filterAudioLibrary,
  formatDuration,
} from '../utils/ttsEngine';

interface AudioLibraryProps {
  clips: AudioClipItem[];
  activeClipId: string | null;
  onSelectClip: (clip: AudioClipItem) => void;
  onDeleteClip: (id: string) => void;
}

export const AudioLibrary: React.FC<AudioLibraryProps> = ({
  clips,
  activeClipId,
  onSelectClip,
  onDeleteClip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceFilter, setVoiceFilter] = useState('all');

  const filteredClips = useMemo(
    () => filterAudioLibrary(clips, searchQuery, 'all', voiceFilter),
    [clips, searchQuery, voiceFilter]
  );

  const handleDownloadClip = (clip: AudioClipItem) => {
    const link = document.createElement('a');
    link.href = clip.audioDataUrl;
    const safeTitle =
      clip.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'lexicon-audio';
    link.download = `${safeTitle}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      aria-label="Audio Library"
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-white shadow-lg shadow-[#4F46E5]/30">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Generated Audio Library
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {clips.length} master recordings • Ready for instant playback &amp; download
            </p>
          </div>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library by title or script..."
            aria-label="Search audio library"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/80 py-2 pl-9 pr-3 text-xs text-white placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none"
          />
        </div>
      </div>

      {/* Voice Filter Chips (No Dropdowns) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setVoiceFilter('all')}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
            voiceFilter === 'all'
              ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white'
              : 'border border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white'
          }`}
        >
          All Voices
        </button>
        {VOICES.slice(0, 6).map((v) => (
          <button
            key={v.name}
            type="button"
            onClick={() => setVoiceFilter(v.name)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
              voiceFilter === v.name
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white'
                : 'border border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Grid of Audio Recordings */}
      {filteredClips.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/50 p-10 text-center">
          <p className="text-sm font-semibold text-white">No matching audio recordings</p>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Generate a new voice recording in the Studio tab to add it to your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClips.map((clip) => {
            const isActive = activeClipId === clip.id;
            return (
              <div
                key={clip.id}
                className={`group flex flex-col justify-between rounded-2xl p-[1.5px] transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] shadow-lg shadow-[#4F46E5]/30'
                    : 'bg-white/10 hover:bg-gradient-to-r hover:from-[#4F46E5]/50 hover:to-[#06B6D4]/50'
                }`}
              >
                <div className="flex h-full flex-col justify-between rounded-[14.5px] bg-[#0E1424]/95 p-4 backdrop-blur-xl">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 font-display text-sm font-bold text-white">
                        {clip.title}
                      </h3>
                      <span className="shrink-0 rounded-md border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-2 py-0.5 font-mono text-[10px] text-[#06B6D4]">
                        {formatDuration(clip.durationSec)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#94A3B8]">
                      <span className="flex items-center gap-1 text-white">
                        <Mic className="h-3 w-3 text-[#06B6D4]" />
                        {clip.voiceSummary}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-[#3B82F6]" />
                        {clip.createdAt}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 rounded-xl border border-white/5 bg-[#0B0F19]/80 p-2.5 text-xs leading-relaxed text-[#94A3B8]">
                      {clip.transcript}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => onSelectClip(clip)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white'
                          : 'border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{isActive ? 'Playing' : 'Play'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadClip(clip)}
                        className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteClip(clip.id)}
                        aria-label={`Delete ${clip.title}`}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 transition-colors hover:bg-red-500/25"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
