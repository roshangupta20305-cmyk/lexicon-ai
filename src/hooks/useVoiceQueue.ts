import { useRef, useState } from 'react';
import {
  AudioClipItem,
  BatchProgressState,
  ChunkAudioOutput,
  SavedBatchCheckpoint,
  VoiceName,
  batchSynthesize,
  clearBatchCheckpoint,
  clearLegacyDemoStorage,
  formatDuration,
  loadBatchCheckpoint,
  validateSynthesisInput,
} from '../utils/ttsEngine';

interface UseVoiceQueueOptions {
  onClipCreated: (clip: AudioClipItem) => void;
  onSelectActiveClip: (clip: AudioClipItem) => void;
  getDynamicVoiceConfig: () => { voiceName: VoiceName; styleDirection: string };
}

export function useVoiceQueue({
  onClipCreated,
  onSelectActiveClip,
  getDynamicVoiceConfig,
}: UseVoiceQueueOptions) {
  const [batchProgress, setBatchProgress] = useState<BatchProgressState | null>(null);
  const [savedCheckpoint, setSavedCheckpoint] = useState<SavedBatchCheckpoint | null>(() => {
    clearLegacyDemoStorage();
    return loadBatchCheckpoint();
  });
  const [lastChunkAudios, setLastChunkAudios] = useState<ChunkAudioOutput[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const runSynthesisQueue = async (params: {
    title: string;
    text: string;
    voiceName: VoiceName;
    styleDirection: string;
    checkpointToResume?: SavedBatchCheckpoint | null;
  }) => {
    setValidationError(null);
    setApiError(null);
    setStatusNotice(null);

    const ckpt = params.checkpointToResume;
    const targetText = ckpt ? ckpt.fullText : params.text;
    const targetTitle = ckpt ? ckpt.title : params.title;
    const targetVoice = ckpt ? ckpt.voiceName : params.voiceName;
    const targetStyle = ckpt ? ckpt.styleDirection : params.styleDirection;

    const check = validateSynthesisInput({ mode: 'single', text: targetText });
    if (!check.valid) {
      setValidationError(check.error || 'Please enter script text to synthesize.');
      return null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSynthesizing(true);

    try {
      const result = await batchSynthesize({
        title: targetTitle.trim() || 'Lexicon AI Master Audio',
        text: targetText,
        voiceName: targetVoice,
        styleDirection: targetStyle.trim(),
        getDynamicVoiceConfig,
        resumeCheckpoint: ckpt,
        signal: controller.signal,
        onProgress: (state) => setBatchProgress(state),
      });

      setLastChunkAudios(result.chunkAudios);
      setSavedCheckpoint(loadBatchCheckpoint());

      const finalVoice = getDynamicVoiceConfig().voiceName || targetVoice;
      const createdAt = new Date().toTimeString().slice(0, 8);
      const newClip: AudioClipItem = {
        id: `clip-${Date.now()}`,
        title: targetTitle.trim() || 'Lexicon AI Master Audio',
        category: 'single',
        voiceSummary: `${finalVoice} (${result.chunkCount} chunk${
          result.chunkCount === 1 ? '' : 's'
        })`,
        styleDirection: getDynamicVoiceConfig().styleDirection || targetStyle,
        transcript: targetText,
        durationSec: result.totalDurationSec,
        createdAt,
        audioDataUrl: result.mergedAudioDataUrl,
        modelUsed: 'gemini-3.8-flash-tts',
        chunkCount: result.chunkCount,
        chunkAudios: result.chunkAudios,
      };

      onClipCreated(newClip);
      onSelectActiveClip(newClip);
      setStatusNotice(
        `Synthesized & merged ${result.chunkCount} chunk${
          result.chunkCount === 1 ? '' : 's'
        } into "${newClip.title}" (${formatDuration(
          result.totalDurationSec
        )}) with voice ${finalVoice}.`
      );
      return newClip;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to synthesize speech with Gemini 3.8 Flash TTS.';
      setApiError(msg);
      setSavedCheckpoint(loadBatchCheckpoint());
      return null;
    } finally {
      setIsSynthesizing(false);
      setBatchProgress(null);
      abortControllerRef.current = null;
    }
  };

  const cancelQueue = () => {
    abortControllerRef.current?.abort();
  };

  const discardCheckpoint = () => {
    clearBatchCheckpoint();
    setSavedCheckpoint(null);
  };

  return {
    batchProgress,
    savedCheckpoint,
    lastChunkAudios,
    isSynthesizing,
    validationError,
    setValidationError,
    apiError,
    setApiError,
    statusNotice,
    setStatusNotice,
    runSynthesisQueue,
    cancelQueue,
    discardCheckpoint,
  };
}
