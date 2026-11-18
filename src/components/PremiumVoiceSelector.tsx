import React, { useMemo, useState } from 'react';
import { Check, Mic, Search, Star } from 'lucide-react';
import {
  VOICES,
  VoiceCategory,
  VoiceName,
  VoiceProfile,
} from '../utils/ttsEngine';
import { SamplePlayer } from './SamplePlayer';

interface PremiumVoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  favorites: VoiceName[];
  onToggleFavorite: (voice: VoiceName) => void;
  recentVoices: VoiceName[];
  compactMode?: boolean;
}

const VOICE_CATEGORIES: Array<'all' | VoiceCategory> = [
  'all',
  'Soprano',
  'Alto',
  'Tenor',
  'Baritone',
  'Bass',
];

export const PremiumVoiceSelector: React.FC<PremiumVoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  favorites,
  onToggleFavorite,
  recentVoices,
  compactMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VoiceCategory>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const displayedVoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = VOICES.filter((voice) => {
      if (onlyFavorites && !favorites.includes(voice.name)) {
        return false;
      }
      if (categoryFilter !== 'all' && voice.voiceCategory !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      return (
        voice.name.toLowerCase().includes(query) ||
        voice.register.toLowerCase().includes(query) ||
        voice.voiceCategory.toLowerCase().includes(query) ||
        voice.timbre.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      const aFav = favorites.includes(a.name) ? 1 : 0;
      const bFav = favorites.includes(b.name) ? 1 : 0;
      return bFav - aFav;
    });
  }, [searchQuery, categoryFilter, favorites, onlyFavorites]);

  return (
    <section
      aria-label="Visual Voice Selector"
      className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#3B82F6] text-white shadow-md shadow-[#4F46E5]/30">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-white">
                Visual Voice Selector
              </h2>
              <span className="rounded-md border border-[#06B6D4]/40 bg-[#06B6D4]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#06B6D4]">
                12 FREE VOICES
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Select any studio voice profile • Active:{' '}
              <strong className="text-white">{selectedVoice}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
            onlyFavorites
              ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B]'
              : 'border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-white'
          }`}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              onlyFavorites ? 'fill-[#F59E0B] text-[#F59E0B]' : ''
            }`}
          />
          <span>Favorites ({favorites.length})</span>
        </button>
      </div>

      {/* Search & Register Filter Pills */}
      <div
        className={`mt-4 flex flex-col gap-3 ${
          compactMode ? '' : 'lg:flex-row lg:items-center lg:justify-between'
        }`}
      >
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voices by name or vocal character..."
            aria-label="Search voices"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/75 py-2 pl-9 pr-3 text-xs text-white placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {VOICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-150 active:scale-95 ${
                categoryFilter === cat
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white shadow-sm'
                  : 'border border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Voices' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Grid of Voice Cards */}
      <div
        className={`mt-4 grid grid-cols-1 gap-3.5 ${
          compactMode ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {displayedVoices.map((voice: VoiceProfile) => {
          const isSelected = selectedVoice === voice.name;
          const isFavorite = favorites.includes(voice.name);

          return (
            <div
              key={voice.name}
              data-voice-card={voice.name}
              data-selected={isSelected ? 'true' : 'false'}
              className={`group relative flex flex-col justify-between rounded-2xl p-[1.5px] transition-all duration-150 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] shadow-lg shadow-[#4F46E5]/35'
                  : 'bg-white/10 hover:bg-gradient-to-r hover:from-[#4F46E5]/60 hover:to-[#06B6D4]/60'
              }`}
            >
              <div className="flex h-full flex-col justify-between rounded-[14.5px] bg-[#0E1424]/95 p-4 backdrop-blur-xl">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-base"
                      >
                        {voice.iconSymbol}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm font-bold text-white">
                            {voice.name}
                          </h3>
                          {isSelected && (
                            <span className="shrink-0 whitespace-nowrap rounded-md bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-[#06B6D4]">
                          Professional {voice.register}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleFavorite(voice.name)}
                      aria-label={
                        isFavorite
                          ? `Remove ${voice.name} from favorites`
                          : `Add ${voice.name} to favorites`
                      }
                      className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-[#F59E0B] active:scale-95"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isFavorite ? 'fill-[#F59E0B] text-[#F59E0B]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#94A3B8]">
                    {voice.timbre}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <SamplePlayer
                    voiceName={voice.name}
                    sampleText={voice.sampleText}
                    label="Play Sample"
                  />

                  <button
                    type="button"
                    onClick={() => onSelectVoice(voice.name)}
                    aria-label={
                      isSelected ? `${voice.name} Selected` : `Select ${voice.name}`
                    }
                    className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-100 active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white shadow-md shadow-[#4F46E5]/30'
                        : 'border border-white/15 bg-white/[0.06] text-white hover:border-[#4F46E5] hover:bg-[#4F46E5]/25'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select Voice</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
