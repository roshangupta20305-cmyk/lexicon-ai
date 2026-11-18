import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Download,
  GripVertical,
  Layers,
  Loader2,
  Mic,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  AudioClipItem,
  BatchProgressState,
  ChapterItem,
  VOICES,
  VoiceName,
  batchSynthesize,
  estimateSpeechDurationSeconds,
  formatDuration,
  getVoiceProfile,
  mergeWavBase64Chunks,
} from '../utils/ttsEngine';

interface PremiumChapterManagerProps {
  chapters: ChapterItem[];
  onChangeChapters: React.Dispatch<React.SetStateAction<ChapterItem[]>>;
  defaultVoice: VoiceName;
  onClipCreated: (clip: AudioClipItem) => void;
  onSelectActiveClip: (clip: AudioClipItem) => void;
}

export const PremiumChapterManager: React.FC<PremiumChapterManagerProps> = ({
  chapters,
  onChangeChapters,
  defaultVoice,
  onClipCreated,
  onSelectActiveClip,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeChapterNumber, setActiveChapterNumber] = useState<number>(1);
  const [chapterProgress, setChapterProgress] = useState<BatchProgressState | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [openVoicePickerChapterId, setOpenVoicePickerChapterId] = useState<string | null>(
    null
  );
  const [chapterNotice, setChapterNotice] = useState<string | null>(null);

  const handleAddChapter = () => {
    const nextNumber = chapters.length + 1;
    const profile = getVoiceProfile(defaultVoice);
    const newChapter: ChapterItem = {
      id: `chapter-${Date.now()}-${nextNumber}`,
      title: `Chapter ${nextNumber}`,
      text: '',
      voiceName: profile.name,
      styleDirection: profile.defaultStyle,
      status: 'idle',
    };
    onChangeChapters((prev) => [...prev, newChapter]);
  };

  const handleDeleteChapter = (id: string) => {
    if (chapters.length <= 1) return;
    onChangeChapters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleMoveChapter = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;
    onChangeChapters((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onChangeChapters((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(draggedIndex, 1);
      copy.splice(index, 0, moved);
      return copy;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const synthesizeSingleChapter = async (
    chapter: ChapterItem,
    chapterNumber: number
  ): Promise<ChapterItem | null> => {
    if (!chapter.text.trim()) return null;

    setActiveChapterId(chapter.id);
    setActiveChapterNumber(chapterNumber);
    setChapterNotice(null);
    onChangeChapters((prev) =>
      prev.map((c) =>
        c.id === chapter.id ? { ...c, status: 'processing', errorMessage: undefined } : c
      )
    );

    try {
      const result = await batchSynthesize({
        title: chapter.title.trim() || `Chapter ${chapterNumber}`,
        text: chapter.text,
        voiceName: chapter.voiceName,
        styleDirection: chapter.styleDirection,
        chapterId: chapter.id,
        onProgress: (state) => setChapterProgress(state),
      });

      const updatedChapter: ChapterItem = {
        ...chapter,
        status: 'completed',
        audioBase64: result.mergedAudioBase64,
        audioDataUrl: result.mergedAudioDataUrl,
        durationSec: result.totalDurationSec,
        chunkCount: result.chunkCount,
        chunkAudios: result.chunkAudios,
      };

      onChangeChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? updatedChapter : c))
      );

      const newClip: AudioClipItem = {
        id: `chapter-clip-${Date.now()}-${chapter.id}`,
        title: chapter.title.trim() || `Chapter ${chapterNumber}`,
        category: 'chapter',
        voiceSummary: `${chapter.voiceName}`,
        styleDirection: chapter.styleDirection,
        transcript: chapter.text,
        durationSec: result.totalDurationSec,
        createdAt: new Date().toTimeString().slice(0, 8),
        audioDataUrl: result.mergedAudioDataUrl,
        modelUsed: 'gemini-3.8-flash-tts',
        chunkCount: result.chunkCount,
        chunkAudios: result.chunkAudios,
      };

      onClipCreated(newClip);
      onSelectActiveClip(newClip);
      return updatedChapter;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chapter synthesis failed.';
      onChangeChapters((prev) =>
        prev.map((c) =>
          c.id === chapter.id ? { ...c, status: 'error', errorMessage: msg } : c
        )
      );
      return null;
    } finally {
      setActiveChapterId(null);
      setChapterProgress(null);
    }
  };

  const hasAnyNonEmptyChapter = chapters.some((c) => c.text.trim().length > 0);

  const handleGenerateAllAndMerge = async () => {
    if (!hasAnyNonEmptyChapter) return;
    setIsGeneratingAll(true);
    setChapterNotice(null);
    const completedBase64List: string[] = [];
    let totalDuration = 0;

    try {
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        if (!ch.text.trim()) continue;
        if (ch.status === 'completed' && ch.audioBase64) {
          completedBase64List.push(ch.audioBase64);
          totalDuration += ch.durationSec || estimateSpeechDurationSeconds(ch.text);
        } else {
          const updated = await synthesizeSingleChapter(ch, i + 1);
          if (updated?.audioBase64) {
            completedBase64List.push(updated.audioBase64);
            totalDuration += updated.durationSec || estimateSpeechDurationSeconds(ch.text);
          }
        }
      }

      if (completedBase64List.length > 0) {
        const mergedBase64 = mergeWavBase64Chunks(completedBase64List);
        const mergedDataUrl = `data:audio/wav;base64,${mergedBase64}`;
        const masterBookClip: AudioClipItem = {
          id: `audiobook-master-${Date.now()}`,
          title: `Complete Multi-Chapter Production (${completedBase64List.length} Chapters)`,
          category: 'chapter',
          voiceSummary: `${completedBase64List.length} Chapters Combined`,
          styleDirection: 'Multi-Chapter Master',
          transcript: chapters
            .filter((c) => c.text.trim())
            .map((c) => `### ${c.title}\n${c.text}`)
            .join('\n\n'),
          durationSec: totalDuration,
          createdAt: new Date().toTimeString().slice(0, 8),
          audioDataUrl: mergedDataUrl,
          modelUsed: 'gemini-3.8-flash-tts',
          chunkCount: completedBase64List.length,
        };
        onClipCreated(masterBookClip);
        onSelectActiveClip(masterBookClip);
        setChapterNotice(
          `Merged ${completedBase64List.length} chapter${
            completedBase64List.length === 1 ? '' : 's'
          } into a single seamless final audio file (${formatDuration(totalDuration)}).`
        );
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleDownloadChapterWav = (ch: ChapterItem) => {
    if (!ch.audioDataUrl) return;
    const link = document.createElement('a');
    link.href = ch.audioDataUrl;
    const safeName =
      ch.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'lexicon-chapter';
    link.download = `${safeName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      aria-label="Chapter Manager"
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-white shadow-md shadow-[#4F46E5]/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Chapter Manager
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Drag and drop to reorder • Assign any voice per chapter
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddChapter}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-95 hover:bg-white/[0.1]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Chapter</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingAll || activeChapterId !== null || !hasAnyNonEmptyChapter}
            onClick={handleGenerateAllAndMerge}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#4F46E5]/30 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating Chapters...</span>
              </>
            ) : (
              <>
                <Layers className="h-3.5 w-3.5" />
                <span>Generate &amp; Merge All ({chapters.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {chapterNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-[#06B6D4]/40 bg-[#06B6D4]/15 px-4 py-2.5 text-xs font-medium text-white">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#06B6D4]" />
          <span>{chapterNotice}</span>
        </div>
      )}

      {chapterProgress && (
        <div className="rounded-xl border border-[#4F46E5]/40 bg-[#0E1424] p-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white">
            <span className="font-semibold">
              Processing Chapter {activeChapterNumber}: {chapterProgress.currentChunk}/
              {chapterProgress.totalChunks} chunks ({chapterProgress.percentage}%)...
            </span>
            <span className="font-mono text-[#06B6D4]">{chapterProgress.percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="animate-gradient-flow h-full rounded-full"
              style={{ width: `${Math.max(5, chapterProgress.percentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Minimalist Drag-and-Drop Chapter List */}
      <div className="space-y-3.5">
        {chapters.map((chapter, idx) => {
          const estSec = chapter.text.trim()
            ? chapter.durationSec || estimateSpeechDurationSeconds(chapter.text)
            : 0;
          const isCurrentProcessing = activeChapterId === chapter.id;
          const isPickerOpen = openVoicePickerChapterId === chapter.id;
          const assignedProfile = getVoiceProfile(chapter.voiceName);

          return (
            <div
              key={chapter.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1424]/90 p-4 shadow-lg transition-all hover:border-white/20"
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#4F46E5] via-[#3B82F6] to-[#06B6D4]" />

              <div className="pl-2.5">
                {/* Chapter Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2.5 min-w-[200px]">
                    <span
                      title="Drag to reorder chapter"
                      className="cursor-grab text-[#94A3B8] hover:text-white"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#3B82F6] font-mono text-xs font-bold text-white">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) =>
                        onChangeChapters((prev) =>
                          prev.map((c) =>
                            c.id === chapter.id ? { ...c, title: e.target.value } : c
                          )
                        )
                      }
                      placeholder={`Chapter ${idx + 1} Title`}
                      aria-label={`Chapter ${idx + 1} name`}
                      className="flex-1 rounded-xl border border-white/10 bg-[#0B0F19]/80 px-3 py-1.5 text-sm font-bold text-white placeholder-[#94A3B8]/60 focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>

                  {/* Visual Voice Assignment Button + Status Badge + Reorder Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenVoicePickerChapterId(isPickerOpen ? null : chapter.id)
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-[#4F46E5]/40 bg-[#4F46E5]/15 px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 hover:border-[#06B6D4]"
                    >
                      <Mic className="h-3.5 w-3.5 text-[#06B6D4]" />
                      <span>
                        {assignedProfile.name} ({assignedProfile.register})
                      </span>
                    </button>

                    {/* Status Badge */}
                    <span
                      className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold ${
                        chapter.status === 'completed'
                          ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          : chapter.status === 'processing'
                          ? 'border border-[#06B6D4]/40 bg-[#06B6D4]/15 text-[#06B6D4]'
                          : chapter.status === 'error'
                          ? 'border border-red-500/40 bg-red-500/15 text-red-300'
                          : 'border border-white/10 bg-[#0B0F19]/80 text-[#94A3B8]'
                      }`}
                    >
                      {chapter.status === 'completed'
                        ? `Ready • ${formatDuration(estSec)}`
                        : chapter.status === 'processing'
                        ? 'Processing...'
                        : chapter.status === 'error'
                        ? 'Error'
                        : `Idle • ~${formatDuration(estSec)}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleMoveChapter(idx, -1)}
                      disabled={idx === 0}
                      aria-label={`Move chapter ${idx + 1} up`}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[#94A3B8] hover:text-white disabled:opacity-35"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveChapter(idx, 1)}
                      disabled={idx === chapters.length - 1}
                      aria-label={`Move chapter ${idx + 1} down`}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[#94A3B8] hover:text-white disabled:opacity-35"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chapter.id)}
                      disabled={chapters.length <= 1}
                      aria-label={`Delete chapter ${idx + 1}`}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20 disabled:opacity-35"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Visual Voice Chip Grid (No Dropdowns) */}
                {isPickerOpen && (
                  <div className="mt-3 rounded-xl border border-[#4F46E5]/30 bg-[#0B0F19]/95 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Select Voice for {chapter.title || `Chapter ${idx + 1}`}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {VOICES.map((v) => {
                        const isAssigned = chapter.voiceName === v.name;
                        return (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => {
                              onChangeChapters((prev) =>
                                prev.map((c) =>
                                  c.id === chapter.id
                                    ? {
                                        ...c,
                                        voiceName: v.name,
                                        styleDirection: v.defaultStyle,
                                      }
                                    : c
                                )
                              );
                              setOpenVoicePickerChapterId(null);
                            }}
                            className={`flex flex-col items-start rounded-xl border p-2 text-left transition-all active:scale-95 ${
                              isAssigned
                                ? 'border-[#06B6D4] bg-gradient-to-r from-[#4F46E5]/30 to-[#06B6D4]/20 text-white'
                                : 'border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white'
                            }`}
                          >
                            <span className="text-xs font-bold text-white">
                              {v.iconSymbol} {v.name}
                            </span>
                            <span className="text-[10px] text-[#06B6D4]">
                              {v.register}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Chapter Script Textarea */}
                <textarea
                  value={chapter.text}
                  onChange={(e) =>
                    onChangeChapters((prev) =>
                      prev.map((c) =>
                        c.id === chapter.id ? { ...c, text: e.target.value } : c
                      )
                    )
                  }
                  placeholder="Paste chapter script here..."
                  rows={2}
                  aria-label={`Chapter ${idx + 1} script`}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-[#0B0F19]/75 p-3 text-xs leading-relaxed text-white placeholder-[#94A3B8]/60 focus:border-[#4F46E5] focus:outline-none"
                />

                {/* Bottom Actions */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#94A3B8]">
                    {chapter.text.length.toLocaleString()} chars
                  </span>

                  <div className="flex items-center gap-2">
                    {chapter.audioDataUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onSelectActiveClip({
                              id: `chapter-preview-${chapter.id}`,
                              title: chapter.title || `Chapter ${idx + 1}`,
                              category: 'chapter',
                              voiceSummary: chapter.voiceName,
                              styleDirection: chapter.styleDirection,
                              transcript: chapter.text,
                              durationSec: chapter.durationSec || estSec,
                              createdAt: 'Chapter',
                              audioDataUrl: chapter.audioDataUrl || '',
                              modelUsed: 'gemini-3.8-flash-tts',
                            })
                          }
                          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.12]"
                        >
                          <Play className="h-3 w-3" />
                          <span>Play</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadChapterWav(chapter)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#06B6D4]/40 bg-[#06B6D4]/15 px-3 py-1.5 text-xs font-semibold text-[#06B6D4] hover:bg-[#06B6D4]/25"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={
                        isCurrentProcessing ||
                        isGeneratingAll ||
                        !chapter.text.trim()
                      }
                      onClick={() => synthesizeSingleChapter(chapter, idx + 1)}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#4F46E5]/25 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isCurrentProcessing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5" />
                          <Sparkles className="h-3 w-3" />
                          <span>Generate Chapter</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
