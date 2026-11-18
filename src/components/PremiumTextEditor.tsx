import React, { useEffect, useRef } from 'react';
import { CheckCircle2, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react';
import {
  VoiceName,
  countWords,
  estimateSpeechDurationSeconds,
  formatDuration,
  getVoiceProfile,
} from '../utils/ttsEngine';

export interface VocalStylePreset {
  id: string;
  label: string;
  direction: string;
}

export const VOCAL_STYLE_PRESETS: VocalStylePreset[] = [
  {
    id: 'broadcast',
    label: 'Broadcast Clarity',
    direction: 'Clear, composed, and articulate studio narrator',
  },
  {
    id: 'cinematic',
    label: 'Cinematic Narration',
    direction: 'Dramatic, cinematic narration with deep emotional resonance',
  },
  {
    id: 'conversational',
    label: 'Conversational',
    direction: 'Warm, friendly, natural conversational cadence',
  },
  {
    id: 'documentary',
    label: 'Documentary Authority',
    direction: 'Deep, authoritative documentary narrator with measured pacing',
  },
];

interface PremiumTextEditorProps {
  clipTitle: string;
  onChangeClipTitle: (title: string) => void;
  scriptText: string;
  onChangeScriptText: (text: string) => void;
  selectedVoice: VoiceName;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  isSynthesizing: boolean;
  validationError: string | null;
  apiError: string | null;
  statusNotice: string | null;
  onSynthesize: () => void;
  onOpenVoiceTab: () => void;
}

export const PremiumTextEditor: React.FC<PremiumTextEditorProps> = ({
  clipTitle,
  onChangeClipTitle,
  scriptText,
  onChangeScriptText,
  selectedVoice,
  selectedStyle,
  onSelectStyle,
  isSynthesizing,
  validationError,
  apiError,
  statusNotice,
  onSynthesize,
  onOpenVoiceTab,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceProfile = getVoiceProfile(selectedVoice);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(540, Math.max(220, el.scrollHeight));
    el.style.height = `${nextHeight}px`;
  }, [scriptText]);

  const charCount = scriptText.length;
  const wordCount = countWords(scriptText);
  const estimatedDurationSec = scriptText.trim()
    ? estimateSpeechDurationSeconds(scriptText)
    : 0;
  const isScriptEmpty = !scriptText.trim();

  return (
    <section
      aria-label="Lexicon AI Script Studio"
      className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-6"
    >
      {/* Top Bar: Project Title & Active Voice Display */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label
            htmlFor="lexicon-project-title"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]"
          >
            Project Title
          </label>
          <input
            id="lexicon-project-title"
            type="text"
            value={clipTitle}
            onChange={(e) => onChangeClipTitle(e.target.value)}
            placeholder="Untitled Project"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/70 px-3.5 py-2 text-sm font-semibold text-white placeholder-[#94A3B8]/60 focus:border-[#4F46E5] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onOpenVoiceTab}
          className="flex items-center gap-3 rounded-xl border border-[#4F46E5]/40 bg-gradient-to-r from-[#4F46E5]/20 to-[#3B82F6]/20 px-4 py-2.5 text-left transition-all duration-150 hover:border-[#06B6D4] active:scale-95"
        >
          <span className="text-base">{voiceProfile.iconSymbol}</span>
          <div>
            <p className="text-xs font-bold text-white">
              Active Voice: {voiceProfile.name}
            </p>
            <p className="text-[11px] text-[#06B6D4]">
              Professional {voiceProfile.register}
            </p>
          </div>
        </button>
      </div>

      {/* Delivery Style Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          Delivery Style:
        </span>
        {VOCAL_STYLE_PRESETS.map((preset) => {
          const isSelected = selectedStyle === preset.direction;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectStyle(preset.direction)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white shadow-sm shadow-[#4F46E5]/30'
                  : 'border border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Empty-by-Default Unlimited Script Textarea with Live Counter */}
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="lexicon-script-editor"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white"
          >
            <FileText className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>Script Input</span>
          </label>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#94A3B8]">
            <span className="rounded-lg border border-white/10 bg-[#0B0F19]/80 px-2.5 py-1 text-white">
              {charCount.toLocaleString()} chars
            </span>
            <span className="rounded-lg border border-white/10 bg-[#0B0F19]/80 px-2.5 py-1">
              {wordCount.toLocaleString()} words
            </span>
            <span className="rounded-lg border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-2.5 py-1 text-[#06B6D4]">
              ~{formatDuration(estimatedDurationSec)}
            </span>
          </div>
        </div>

        <textarea
          id="lexicon-script-editor"
          ref={textareaRef}
          value={scriptText}
          onChange={(e) => onChangeScriptText(e.target.value)}
          placeholder="Paste your script here... (Unlimited length supported)"
          rows={8}
          className="w-full resize-y rounded-2xl border border-white/10 bg-[#0B0F19]/85 p-4 font-sans text-sm leading-relaxed text-white placeholder-[#94A3B8]/60 shadow-inner transition-colors focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
        />
      </div>

      {/* Notices */}
      {(validationError || apiError) && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-xs text-red-200"
        >
          <p className="font-semibold text-white">Generation Notice</p>
          <p className="mt-0.5">{validationError || apiError}</p>
        </div>
      )}

      {statusNotice && !validationError && !apiError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#06B6D4]/40 bg-[#06B6D4]/15 px-4 py-2.5 text-xs font-medium text-white">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#06B6D4]" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Action Footer with Prominent Gradient Generate Voice Button */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
        <p className="text-xs text-[#94A3B8]">
          Unlimited script length • Seamless sentence synthesis
        </p>

        <button
          type="button"
          disabled={isSynthesizing || isScriptEmpty}
          onClick={onSynthesize}
          className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-[#4F46E5]/40 transition-all duration-150 hover:scale-[1.01] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
        >
          {isSynthesizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Audio...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              <Sparkles className="h-4 w-4" />
              <span>Generate Voice</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
