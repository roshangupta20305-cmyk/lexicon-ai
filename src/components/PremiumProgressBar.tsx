import React from 'react';
import { Clock, Loader2, Play, Square, X } from 'lucide-react';
import {
  BatchProgressState,
  SavedBatchCheckpoint,
  formatDuration,
} from '../utils/ttsEngine';

interface PremiumProgressBarProps {
  progress: BatchProgressState | null;
  savedCheckpoint: SavedBatchCheckpoint | null;
  onCancel: () => void;
  onResumeCheckpoint: (checkpoint: SavedBatchCheckpoint) => void;
  onDiscardCheckpoint: () => void;
}

export const PremiumProgressBar: React.FC<PremiumProgressBarProps> = ({
  progress,
  savedCheckpoint,
  onCancel,
  onResumeCheckpoint,
  onDiscardCheckpoint,
}) => {
  if (!progress && !savedCheckpoint) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Live Batch Queue Progress Bar */}
      {progress && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-[#4F46E5]/40 bg-[#0E1528]/95 p-5 shadow-xl shadow-[#4F46E5]/20 backdrop-blur-xl"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {!progress.isProcessing && progress.percentage === 100
                    ? `Merging ${progress.totalChunks} audio segments into final master...`
                    : `Processing Chapter 1: ${progress.currentChunk}/${progress.totalChunks} chunks (${progress.percentage}%)...`}
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Voice: <span className="font-semibold text-white">{progress.activeVoiceName || 'Kore'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-[#06B6D4]">
                <Clock className="h-3.5 w-3.5" />
                ~{formatDuration(progress.estimatedSecondsRemaining)}
              </span>

              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/25"
              >
                <Square className="h-3 w-3 fill-current" />
                Cancel
              </button>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.07] p-0.5">
            <div
              className="animate-gradient-flow h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, progress.percentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Clean Save & Resume Banner */}
      {!progress && savedCheckpoint && (
        <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                Unfinished Voice Generation
              </p>
              <p className="mt-0.5 text-xs text-white">
                <span className="font-semibold">{savedCheckpoint.title}</span> —{' '}
                {savedCheckpoint.completedChunks.length} of {savedCheckpoint.chunks.length} segments completed
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onResumeCheckpoint(savedCheckpoint)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#4F46E5]/25 hover:brightness-110"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Resume Generation</span>
              </button>
              <button
                type="button"
                onClick={onDiscardCheckpoint}
                aria-label="Dismiss saved generation"
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] p-2 text-[#94A3B8] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
