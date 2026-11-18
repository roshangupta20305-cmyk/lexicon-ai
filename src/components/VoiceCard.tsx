import React from 'react';
import { Star, Scale } from 'lucide-react';
import { VoiceName, VoiceProfile } from '../utils/ttsEngine';
import { SamplePlayer } from './SamplePlayer';

interface VoiceCardProps {
  voice: VoiceProfile;
  isSelected: boolean;
  isFavorite: boolean;
  isCompared: boolean;
  sampleText?: string;
  onSelect: (voiceName: VoiceName) => void;
  onToggleFavorite: (voiceName: VoiceName) => void;
  onToggleCompare: (voiceName: VoiceName) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  isFavorite,
  isCompared,
  sampleText,
  onSelect,
  onToggleFavorite,
  onToggleCompare,
}) => {
  return (
    <div
      data-testid={`voice-card-${voice.name}`}
      className={`group relative rounded-xl p-4 transition-transform duration-150 hover:-translate-y-0.5 flex flex-col justify-between gap-3.5 ${
        isSelected
          ? 'bg-slate-900/95 border-2 border-blue-500 ring-2 ring-purple-500/35 shadow-[0_0_24px_rgba(99,102,241,0.28)]'
          : 'bg-slate-900/75 border border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Row: Voice Icon, Name, Type, Active Indicator & Favorite Star */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base leading-none" aria-hidden="true">
              {voice.iconSymbol}
            </span>
            <h4 className="text-sm font-bold text-slate-100 tracking-wide">
              {voice.label}
            </h4>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-xs font-medium text-slate-400">
              {voice.register}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {voice.timbre}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && (
            <span className="text-xs font-semibold text-blue-400 whitespace-nowrap shrink-0">
              ✓ Selected
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleFavorite(voice.name)}
            aria-label={
              isFavorite
                ? `Remove ${voice.label} from favorites`
                : `Mark ${voice.label} as favorite`
            }
            title={isFavorite ? 'Favorite voice' : 'Add to favorites'}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Unboxed Metadata Line: Free Access & Category */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className="text-emerald-400 font-medium">Free & Unlimited</span>
        <span aria-hidden="true">·</span>
        <span>Category: {voice.voiceCategory}</span>
      </div>

      {/* Bottom Action Bar: Play Sample, Compare, Select */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <SamplePlayer
            voiceName={voice.name}
            sampleText={sampleText || voice.sampleText}
          />

          <button
            type="button"
            onClick={() => onToggleCompare(voice.name)}
            aria-label={
              isCompared
                ? `Remove ${voice.label} from comparison`
                : `Compare ${voice.label} voice`
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              isCompared
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelect(voice.name)}
          aria-label={`Select ${voice.label}`}
          className={`inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            isSelected
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-slate-100 text-slate-900 hover:bg-white'
          }`}
        >
          {isSelected ? (
            <span>✓ Selected</span>
          ) : (
            <span>Select {voice.label}</span>
          )}
        </button>
      </div>
    </div>
  );
};
