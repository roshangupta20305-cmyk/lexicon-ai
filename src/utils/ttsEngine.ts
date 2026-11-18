export type VoiceName =
  | 'Kore'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Zephyr'
  | 'Aoede'
  | 'Leda'
  | 'Orus'
  | 'Perseus'
  | 'Callirrhoe'
  | 'Autonoë'
  | 'Charis';

export type VoiceCategory = 'Soprano' | 'Alto' | 'Tenor' | 'Baritone' | 'Bass';
export type VoiceSortOption = 'name' | 'type' | 'recent';

export const SMART_CHUNK_MAX_CHARS = 3800;
export const LARGE_TEXT_WARNING_CHARS = 50000;
export const RESUME_STORAGE_KEY = 'lexicon_ai_resume_checkpoint_v3';
export const FAVORITE_VOICES_STORAGE_KEY = 'lexicon_ai_favorite_voices_v3';
export const RECENT_VOICES_STORAGE_KEY = 'lexicon_ai_recent_voices_v3';
export const VOICE_SAMPLE_SCRIPTS: Record<VoiceName, string> = {
  Kore: 'Welcome to Lexicon AI. I am Kore, a composed and articulate narrator. Listen to my broadcast clarity.',
  Puck: "Welcome to Lexicon AI. I am Puck, bright and energetic. Let's bring your words to life with warmth.",
  Charon:
    'Welcome to Lexicon AI. I am Charon, deep and resonant. A voice built for documentary authority.',
  Fenrir:
    'Welcome to Lexicon AI. I am Fenrir, bold and crisp. Dynamic storytelling starts here.',
  Zephyr:
    'Welcome to Lexicon AI. I am Zephyr, warm and soothing. A natural cadence for every story.',
  Aoede:
    'Welcome to Lexicon AI. I am Aoede, expressive and lyrical. Musical quality in every word.',
  Leda: 'Welcome to Lexicon AI. I am Leda, gentle and nurturing. A storytelling voice you can trust.',
  Orus: 'Welcome to Lexicon AI. I am Orus, confident and authoritative. News-style delivery, perfected.',
  Perseus:
    'Welcome to Lexicon AI. I am Perseus, dramatic and cinematic. Epic narration begins now.',
  Callirrhoe:
    'Welcome to Lexicon AI. I am Callirrhoe, emotional and poetic. Feel every word deeply.',
  Autonoë:
    'Welcome to Lexicon AI. I am Autonoë, calm and meditative. Peace in every syllable.',
  Charis:
    'Welcome to Lexicon AI. I am Charis, cheerful and friendly. Upbeat energy for your content.',
};

export const DEFAULT_VOICE_SAMPLE_TEXT = VOICE_SAMPLE_SCRIPTS.Kore;

export function getVoiceSampleText(voiceName: VoiceName | string): string {
  return (
    VOICE_SAMPLE_SCRIPTS[voiceName as VoiceName] ?? VOICE_SAMPLE_SCRIPTS.Kore
  );
}

export function clearLegacyDemoStorage(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const legacyKeys = [
      'voxcraft_resume_checkpoint_v1',
      'voxcraft_favorite_voices_v1',
      'voxcraft_recent_voices_v1',
      'lexicon_ai_resume_checkpoint_v1',
      'lexicon_ai_resume_checkpoint_v2',
    ];
    for (const k of legacyKeys) {
      localStorage.removeItem(k);
    }
    // Also inspect current checkpoint and remove if it contains any old demo text
    const currentRaw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (
      currentRaw &&
      (currentRaw.includes('Jagannath') ||
        currentRaw.includes('MAA kali') ||
        currentRaw.includes('पुरी के इस प्राचीन'))
    ) {
      localStorage.removeItem(RESUME_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export interface VoiceProfile {
  name: VoiceName;
  label: string;
  register: string;
  voiceCategory: VoiceCategory;
  timbre: string;
  defaultStyle: string;
  sampleFreq: number;
  iconSymbol: string;
  free: boolean;
  sampleText: string;
}

export interface BotPersona {
  id: string;
  name: string;
  role: string;
  voice: VoiceName;
  vocalStyle: string;
  systemPrompt: string;
  starterPrompts: string[];
}

export interface DialogueTurn {
  id: string;
  speaker: string;
  text: string;
  style: string;
}

export interface ChunkAudioOutput {
  index: number;
  text: string;
  audioBase64: string;
  audioDataUrl: string;
  durationSec: number;
}

export interface AudioClipItem {
  id: string;
  title: string;
  category: 'bot' | 'single' | 'multi' | 'chapter';
  voiceSummary: string;
  styleDirection: string;
  transcript: string;
  durationSec: number;
  createdAt: string;
  audioDataUrl: string;
  modelUsed: string;
  chunkCount?: number;
  chunkAudios?: ChunkAudioOutput[];
}

export interface ChapterItem {
  id: string;
  title: string;
  text: string;
  voiceName: VoiceName;
  styleDirection: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  audioDataUrl?: string;
  audioBase64?: string;
  durationSec?: number;
  chunkCount?: number;
  chunkAudios?: ChunkAudioOutput[];
  errorMessage?: string;
}

export interface BatchProgressState {
  isProcessing: boolean;
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  estimatedSecondsRemaining: number;
  currentChunkPreview: string;
  completedChunks: ChunkAudioOutput[];
  failedAttemptsOnCurrent: number;
  activeVoiceName?: VoiceName;
}

export interface SavedBatchCheckpoint {
  id: string;
  title: string;
  fullText: string;
  voiceName: VoiceName;
  styleDirection: string;
  chunks: string[];
  completedChunks: ChunkAudioOutput[];
  nextChunkIndex: number;
  updatedAt: string;
  chapterId?: string;
}

/**
 * Complete catalog of all 12 Gemini voices — 100% free and unlimited.
 */
export const VOICES: VoiceProfile[] = [
  {
    name: 'Kore',
    label: 'Kore',
    register: 'Mezzo-Soprano',
    voiceCategory: 'Soprano',
    timbre: 'Composed, articulate, broadcast clarity',
    defaultStyle: 'Clear, composed, and articulate studio narrator',
    sampleFreq: 261.63,
    iconSymbol: '🎵',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Kore,
  },
  {
    name: 'Puck',
    label: 'Puck',
    register: 'Tenor',
    voiceCategory: 'Tenor',
    timbre: 'Bright, energetic, conversational warmth',
    defaultStyle: 'Enthusiastic, bright, and engaging podcast host',
    sampleFreq: 293.66,
    iconSymbol: '🎤',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Puck,
  },
  {
    name: 'Charon',
    label: 'Charon',
    register: 'Baritone',
    voiceCategory: 'Baritone',
    timbre: 'Deep, resonant, documentary authority',
    defaultStyle: 'Measured, resonant documentary narrator with calm gravitas',
    sampleFreq: 220.0,
    iconSymbol: '🎙️',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Charon,
  },
  {
    name: 'Fenrir',
    label: 'Fenrir',
    register: 'Bass-Baritone',
    voiceCategory: 'Bass',
    timbre: 'Bold, crisp, dynamic story projection',
    defaultStyle: 'Dynamic, expressive storyteller with crisp diction',
    sampleFreq: 196.0,
    iconSymbol: '🔊',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Fenrir,
  },
  {
    name: 'Zephyr',
    label: 'Zephyr',
    register: 'Contralto',
    voiceCategory: 'Alto',
    timbre: 'Warm, soothing, natural cadence',
    defaultStyle: 'Warm, empathetic, and relaxed conversational guide',
    sampleFreq: 246.94,
    iconSymbol: '🎶',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Zephyr,
  },
  {
    name: 'Aoede',
    label: 'Aoede',
    register: 'Soprano',
    voiceCategory: 'Soprano',
    timbre: 'Expressive, lyrical, musical quality',
    defaultStyle: 'Expressive, lyrical, and musical soprano narrator',
    sampleFreq: 329.63,
    iconSymbol: '🎵',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Aoede,
  },
  {
    name: 'Leda',
    label: 'Leda',
    register: 'Alto',
    voiceCategory: 'Alto',
    timbre: 'Gentle, nurturing, storytelling tone',
    defaultStyle: 'Gentle, nurturing, and warm storytelling narrator',
    sampleFreq: 233.08,
    iconSymbol: '🎶',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Leda,
  },
  {
    name: 'Orus',
    label: 'Orus',
    register: 'Tenor',
    voiceCategory: 'Tenor',
    timbre: 'Confident, authoritative, news-style',
    defaultStyle: 'Confident, authoritative news anchor and analyst',
    sampleFreq: 277.18,
    iconSymbol: '🎤',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Orus,
  },
  {
    name: 'Perseus',
    label: 'Perseus',
    register: 'Baritone',
    voiceCategory: 'Baritone',
    timbre: 'Dramatic, cinematic, epic narration',
    defaultStyle: 'Dramatic, cinematic baritone for epic narration',
    sampleFreq: 207.65,
    iconSymbol: '🎙️',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Perseus,
  },
  {
    name: 'Callirrhoe',
    label: 'Callirrhoe',
    register: 'Mezzo',
    voiceCategory: 'Soprano',
    timbre: 'Emotional, poetic, expressive',
    defaultStyle: 'Emotional, poetic, and expressive literary voice',
    sampleFreq: 311.13,
    iconSymbol: '🎵',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Callirrhoe,
  },
  {
    name: 'Autonoë',
    label: 'Autonoë',
    register: 'Contralto',
    voiceCategory: 'Alto',
    timbre: 'Calm, meditative, peaceful',
    defaultStyle: 'Calm, meditative, and peaceful contralto guide',
    sampleFreq: 240.0,
    iconSymbol: '🎶',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS['Autonoë'],
  },
  {
    name: 'Charis',
    label: 'Charis',
    register: 'Soprano',
    voiceCategory: 'Soprano',
    timbre: 'Cheerful, friendly, upbeat',
    defaultStyle: 'Cheerful, friendly, and upbeat conversational soprano',
    sampleFreq: 349.23,
    iconSymbol: '🎵',
    free: true,
    sampleText: VOICE_SAMPLE_SCRIPTS.Charis,
  },
];

export function getVoiceProfile(voiceName: VoiceName | string): VoiceProfile {
  return VOICES.find((v) => v.name === voiceName) ?? VOICES[0];
}

/**
 * Favorite voices persistence in localStorage
 */
export function loadFavoriteVoices(): VoiceName[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(FAVORITE_VOICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((name): name is VoiceName =>
        VOICES.some((v) => v.name === name)
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function saveFavoriteVoices(favorites: VoiceName[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FAVORITE_VOICES_STORAGE_KEY, JSON.stringify(favorites));
    }
  } catch {
    // Ignore storage errors
  }
}

export function toggleFavoriteVoiceList(
  currentFavorites: VoiceName[],
  voiceName: VoiceName
): VoiceName[] {
  const exists = currentFavorites.includes(voiceName);
  const next = exists
    ? currentFavorites.filter((v) => v !== voiceName)
    : [...currentFavorites, voiceName];
  saveFavoriteVoices(next);
  return next;
}

/**
 * Recently used voices persistence in localStorage
 */
export function loadRecentVoices(): VoiceName[] {
  try {
    if (typeof localStorage === 'undefined') return ['Kore', 'Puck', 'Charon'];
    const raw = localStorage.getItem(RECENT_VOICES_STORAGE_KEY);
    if (!raw) return ['Kore', 'Puck', 'Charon'];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((name): name is VoiceName =>
        VOICES.some((v) => v.name === name)
      );
    }
    return ['Kore', 'Puck', 'Charon'];
  } catch {
    return ['Kore', 'Puck', 'Charon'];
  }
}

export function recordRecentVoice(
  currentRecent: VoiceName[],
  voiceName: VoiceName
): VoiceName[] {
  const next = [voiceName, ...currentRecent.filter((v) => v !== voiceName)].slice(0, 12);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECENT_VOICES_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage errors
  }
  return next;
}

/**
 * Filters and sorts voices for the VoiceSelector component.
 * Favorites are always pinned to the top of the resulting list.
 */
export function filterAndSortVoices(params: {
  voices?: VoiceProfile[];
  searchQuery: string;
  categoryFilter: 'all' | VoiceCategory;
  sortBy: VoiceSortOption;
  favorites: VoiceName[];
  recentVoices: VoiceName[];
  onlyFavorites: boolean;
}): VoiceProfile[] {
  const source = params.voices ?? VOICES;
  const query = params.searchQuery.trim().toLowerCase();

  const filtered = source.filter((voice) => {
    if (params.onlyFavorites && !params.favorites.includes(voice.name)) {
      return false;
    }
    if (params.categoryFilter !== 'all' && voice.voiceCategory !== params.categoryFilter) {
      return false;
    }
    if (!query) return true;
    return (
      voice.name.toLowerCase().includes(query) ||
      voice.label.toLowerCase().includes(query) ||
      voice.register.toLowerCase().includes(query) ||
      voice.voiceCategory.toLowerCase().includes(query) ||
      voice.timbre.toLowerCase().includes(query)
    );
  });

  return [...filtered].sort((a, b) => {
    const aFav = params.favorites.includes(a.name) ? 1 : 0;
    const bFav = params.favorites.includes(b.name) ? 1 : 0;
    if (aFav !== bFav) {
      return bFav - aFav; // Favorites always appear at the top
    }

    if (params.sortBy === 'name') {
      return a.label.localeCompare(b.label);
    }
    if (params.sortBy === 'type') {
      const regCmp = a.register.localeCompare(b.register);
      return regCmp !== 0 ? regCmp : a.label.localeCompare(b.label);
    }
    // sortBy === 'recent'
    const aIdx = params.recentVoices.indexOf(a.name);
    const bIdx = params.recentVoices.indexOf(b.name);
    const aRank = aIdx === -1 ? 999 : aIdx;
    const bRank = bIdx === -1 ? 999 : bIdx;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label);
  });
}

export const VOCAL_MARKERS = [
  { token: '<breath>', label: 'Breath Pause', kind: 'burst', description: 'Natural intake of breath before a phrase' },
  { token: '<laugh>', label: 'Light Laugh', kind: 'burst', description: 'Warm chuckle or vocal burst' },
  { token: '<gasp>', label: 'Surprise Gasp', kind: 'burst', description: 'Quick expressive intake of surprise' },
  { token: '|yeah|', label: 'Backchannel "yeah"', kind: 'backchannel', description: 'Natural affirming interjection' },
  { token: '|mhm|', label: 'Backchannel "mhm"', kind: 'backchannel', description: 'Active listening cue in dialogue' },
] as const;

export const BOT_PERSONAS: BotPersona[] = [
  {
    id: 'exec-brief',
    name: 'Aria — Executive Briefing Bot',
    role: 'Daily Intelligence & Strategy Anchor',
    voice: 'Kore',
    vocalStyle: 'Clear, authoritative, well-paced broadcast anchor',
    systemPrompt:
      'You are Aria, an executive briefing voice bot. Respond in 2 to 4 concise, natural spoken sentences suitable for text-to-speech synthesis. Occasionally include <breath> for natural pacing, and avoid markdown bullet lists or raw code blocks.',
    starterPrompts: [
      'Give me a 30-second morning briefing on renewable grid battery storage.',
      'Summarize the three biggest shifts in enterprise voice AI this quarter.',
      'Draft a crisp spoken intro for our Q4 product keynote.',
    ],
  },
  {
    id: 'podcast-cohost',
    name: 'Leo — Expressive Podcast Host',
    role: 'Conversational Tech & Culture Co-Host',
    voice: 'Puck',
    vocalStyle: 'Enthusiastic, warm, conversational podcast host with natural cadence',
    systemPrompt:
      'You are Leo, a lively podcast co-host. Respond in 2 to 4 engaging spoken sentences designed to be read aloud via Gemini 3.8 Flash TTS. Naturally weave in expressive cues like <breath> or <laugh> or |yeah| where fitting. Never use markdown lists.',
    starterPrompts: [
      'Why do small acoustic details like breath pauses make synthetic voices feel real?',
      'React to a caller claiming vinyl records sound better than lossless digital audio.',
      'Pitch a fun 20-second teaser for an episode about deep-sea robotics.',
    ],
  },
  {
    id: 'socratic-tutor',
    name: 'Dr. Vance — Socratic Science Guide',
    role: 'STEM & First-Principles Explainer',
    voice: 'Charon',
    vocalStyle: 'Measured, resonant, patient professor explaining complex ideas simply',
    systemPrompt:
      'You are Dr. Vance, a Socratic science communicator. Explain concepts clearly in 2 to 4 spoken sentences using vivid analogies and natural spoken rhythm. You may include <breath> before key insights. Avoid markdown symbols.',
    starterPrompts: [
      'Explain how phase-locked loops keep radio receivers tuned in plain spoken English.',
      'Why does cold water hold more dissolved oxygen than warm water?',
      'Walk me through how neural audio codecs compress speech in 3 sentences.',
    ],
  },
  {
    id: 'story-weaver',
    name: 'Lyra — Audio Drama Narrator',
    role: 'Cinematic Fiction & Character Voice Bot',
    voice: 'Aoede',
    vocalStyle: 'Expressive, lyrical audiobook narrator with subtle dramatic tension',
    systemPrompt:
      'You are Lyra, an atmospheric audiobook narrator. Respond in 2 to 4 evocative spoken sentences rich in sensory detail. Use <breath> or <gasp> sparingly when the moment calls for suspense. Do not use markdown formatting.',
    starterPrompts: [
      'Open a mystery scene set inside a rain-soaked clocktower in Zurich.',
      'Narrate the moment an astronomer detects a repeating radio signal from Europa.',
      'Perform a short dramatic monologue from a lighthouse keeper at dawn.',
    ],
  },
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  isLargeTextWarning?: boolean;
}

export function formatUpstreamError(rawError: unknown): string {
  const rawMessage =
    rawError instanceof Error
      ? rawError.message
      : typeof rawError === 'string'
      ? rawError
      : 'An unexpected speech synthesis error occurred.';

  const trimmed = rawMessage.trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart));
      const nestedMsg = parsed?.error?.message || parsed?.message;
      if (typeof nestedMsg === 'string' && nestedMsg.trim()) {
        return nestedMsg.trim();
      }
    } catch {
      // Fall through to raw message
    }
  }
  return trimmed;
}

/**
 * Validates synthesis input with NO maximum character or word limit.
 * Only enforces a minimum of 1 non-whitespace character.
 */
export function validateSynthesisInput(params: {
  mode: 'single' | 'multi';
  text?: string;
  dialogueTurns?: DialogueTurn[];
}): ValidationResult {
  if (params.mode === 'single') {
    const cleaned = (params.text ?? '').trim();
    if (!cleaned) {
      return { valid: false, error: 'Please enter script text to synthesize into speech.' };
    }
    return {
      valid: true,
      isLargeTextWarning: cleaned.length > LARGE_TEXT_WARNING_CHARS,
    };
  }

  const turns = params.dialogueTurns ?? [];
  if (turns.length < 2) {
    return {
      valid: false,
      error: 'Dual-speaker dialogue requires at least 2 dialogue turns across two speakers.',
    };
  }

  const nonEmptyTurns = turns.filter((t) => t.text.trim().length > 0);
  if (nonEmptyTurns.length < 2) {
    return {
      valid: false,
      error: 'Each dialogue turn must contain spoken text before synthesizing.',
    };
  }

  const uniqueSpeakers = new Set(nonEmptyTurns.map((t) => t.speaker.trim()).filter(Boolean));
  if (uniqueSpeakers.size !== 2) {
    return {
      valid: false,
      error: 'Gemini 3.8 Flash TTS multi-speaker mode requires exactly 2 distinct speaker names.',
    };
  }

  return { valid: true };
}

function splitOversizedSentenceAtSpaces(sentence: string, maxChars: number): string[] {
  const pieces: string[] = [];
  let remaining = sentence.trim();

  while (remaining.length > maxChars) {
    const sliceCandidate = remaining.slice(0, maxChars);
    const lastSpaceIdx = Math.max(
      sliceCandidate.lastIndexOf(' '),
      sliceCandidate.lastIndexOf('\t'),
      sliceCandidate.lastIndexOf('\n')
    );

    if (lastSpaceIdx > 0) {
      pieces.push(remaining.slice(0, lastSpaceIdx).trim());
      remaining = remaining.slice(lastSpaceIdx + 1).trim();
    } else {
      pieces.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars).trim();
    }
  }

  if (remaining.length > 0) {
    pieces.push(remaining);
  }
  return pieces;
}

export function splitIntoSentences(paragraph: string): string[] {
  const cleaned = paragraph.trim();
  if (!cleaned) return [];

  const sentenceRegex = /[^.!?।॥]+(?:[.!?।॥]+['"”’)\]]*|\s*$)/gu;
  const matches = cleaned.match(sentenceRegex);
  if (!matches) return [cleaned];

  return matches.map((s) => s.trim()).filter(Boolean);
}

export function smartChunkText(
  rawText: string,
  maxChars: number = SMART_CHUNK_MAX_CHARS
): string[] {
  const trimmed = (rawText ?? '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const paragraphs = trimmed
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = '';

  const flushCurrent = () => {
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      const candidate = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
      if (candidate.length <= maxChars) {
        currentChunk = candidate;
        continue;
      } else {
        flushCurrent();
        currentChunk = paragraph;
        continue;
      }
    }

    flushCurrent();
    const sentences = splitIntoSentences(paragraph);

    for (const sentence of sentences) {
      if (sentence.length <= maxChars) {
        const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        if (candidate.length <= maxChars) {
          currentChunk = candidate;
        } else {
          flushCurrent();
          currentChunk = sentence;
        }
      } else {
        flushCurrent();
        const subParts = splitOversizedSentenceAtSpaces(sentence, maxChars);
        for (const sub of subParts) {
          if (currentChunk && `${currentChunk} ${sub}`.length <= maxChars) {
            currentChunk = `${currentChunk} ${sub}`;
          } else {
            flushCurrent();
            currentChunk = sub;
          }
        }
        flushCurrent();
      }
    }
    flushCurrent();
  }

  flushCurrent();
  return chunks;
}

export function isRiffWaveBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length > 44 &&
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 && // 'F'
    bytes[8] === 0x57 && // 'W'
    bytes[9] === 0x41 && // 'A'
    bytes[10] === 0x56 && // 'V'
    bytes[11] === 0x45 // 'E'
  );
}

export function extractPcmFromWavBytes(wavBytes: Uint8Array): Uint8Array {
  if (wavBytes.length === 0) {
    return new Uint8Array(0);
  }
  if (!isRiffWaveBytes(wavBytes)) {
    return wavBytes.length % 2 === 0
      ? wavBytes
      : wavBytes.subarray(0, wavBytes.length - 1);
  }
  const limit = Math.min(wavBytes.length - 8, 256);
  for (let i = 12; i <= limit; i++) {
    if (
      wavBytes[i] === 0x64 &&
      wavBytes[i + 1] === 0x61 &&
      wavBytes[i + 2] === 0x74 &&
      wavBytes[i + 3] === 0x61
    ) {
      const dataOffset = i + 8;
      if (dataOffset < wavBytes.length) {
        return wavBytes.subarray(dataOffset);
      }
    }
  }
  return wavBytes.subarray(44);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(clean, 'base64'));
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function ensureWavBase64(base64Audio: string, sampleRate = 24000): string {
  const rawBytes = base64ToUint8Array(base64Audio);
  if (isRiffWaveBytes(rawBytes)) {
    return base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
  }

  const pcmBytes =
    rawBytes.length % 2 === 0
      ? rawBytes
      : rawBytes.subarray(0, rawBytes.length - 1);
  const totalPcmBytes = pcmBytes.byteLength;
  const outputBuffer = new ArrayBuffer(44 + totalPcmBytes);
  const view = new DataView(outputBuffer);
  const outBytes = new Uint8Array(outputBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + totalPcmBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, totalPcmBytes, true);

  outBytes.set(pcmBytes, 44);
  return uint8ArrayToBase64(outBytes);
}

export function validateWavAudioDurationSec(
  base64OrDataUrl: string,
  minDurationSec = 3.0
): { valid: boolean; durationSec: number; normalizedBase64: string } {
  if (!base64OrDataUrl || !base64OrDataUrl.trim()) {
    return { valid: false, durationSec: 0, normalizedBase64: '' };
  }
  try {
    const normalizedBase64 = ensureWavBase64(base64OrDataUrl);
    const wavBytes = base64ToUint8Array(normalizedBase64);
    if (!isRiffWaveBytes(wavBytes) || wavBytes.length <= 44) {
      return { valid: false, durationSec: 0, normalizedBase64: '' };
    }
    const view = new DataView(
      wavBytes.buffer,
      wavBytes.byteOffset,
      wavBytes.byteLength
    );
    const byteRate = view.getUint32(28, true) || 48000;
    const pcmBytes = extractPcmFromWavBytes(wavBytes);
    const durationSec = pcmBytes.byteLength / byteRate;
    return {
      valid: durationSec >= minDurationSec,
      durationSec,
      normalizedBase64,
    };
  } catch {
    return { valid: false, durationSec: 0, normalizedBase64: '' };
  }
}

export function mergeWavBase64Chunks(base64Chunks: string[]): string {
  const valid = base64Chunks.filter((c) => c && c.trim().length > 0);
  if (valid.length === 0) return '';
  if (valid.length === 1) {
    return ensureWavBase64(valid[0]);
  }

  const pcmParts: Uint8Array[] = [];
  let totalPcmBytes = 0;

  for (const b64 of valid) {
    const wavBytes = base64ToUint8Array(b64);
    const pcm = extractPcmFromWavBytes(wavBytes);
    pcmParts.push(pcm);
    totalPcmBytes += pcm.byteLength;
  }

  const sampleRate = 24000;
  const outputBuffer = new ArrayBuffer(44 + totalPcmBytes);
  const view = new DataView(outputBuffer);
  const outBytes = new Uint8Array(outputBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + totalPcmBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, totalPcmBytes, true);

  let offset = 44;
  for (const pcm of pcmParts) {
    outBytes.set(pcm, offset);
    offset += pcm.byteLength;
  }

  return uint8ArrayToBase64(outBytes);
}

export function saveBatchCheckpoint(checkpoint: SavedBatchCheckpoint): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(checkpoint));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function loadBatchCheckpoint(): SavedBatchCheckpoint | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBatchCheckpoint;
    if (
      parsed &&
      Array.isArray(parsed.chunks) &&
      typeof parsed.nextChunkIndex === 'number' &&
      parsed.nextChunkIndex < parsed.chunks.length
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearBatchCheckpoint(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(RESUME_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

export interface BatchSynthesizeOptions {
  title: string;
  text: string;
  voiceName: VoiceName;
  styleDirection: string;
  /**
   * Allows switching voices dynamically mid-process without crashing or restarting.
   */
  getDynamicVoiceConfig?: () => { voiceName: VoiceName; styleDirection: string };
  chapterId?: string;
  resumeCheckpoint?: SavedBatchCheckpoint | null;
  signal?: AbortSignal;
  maxRetries?: number;
  onProgress?: (state: BatchProgressState) => void;
  synthesizeChunkFn?: (params: {
    text: string;
    voiceName: VoiceName;
    style: string;
    signal?: AbortSignal;
  }) => Promise<{ audioBase64: string; mimeType: string }>;
}

async function defaultSynthesizeChunkCaller(params: {
  text: string;
  voiceName: VoiceName;
  style: string;
  signal?: AbortSignal;
}): Promise<{ audioBase64: string; mimeType: string }> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'single',
      text: params.text,
      voiceName: params.voiceName,
      style: params.style,
    }),
    signal: params.signal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Gemini 3.8 Flash TTS chunk synthesis failed.');
  }
  return {
    audioBase64: data.audioBase64,
    mimeType: data.mimeType || 'audio/wav',
  };
}

export async function batchSynthesize(options: BatchSynthesizeOptions): Promise<{
  mergedAudioBase64: string;
  mergedAudioDataUrl: string;
  chunkAudios: ChunkAudioOutput[];
  totalDurationSec: number;
  chunkCount: number;
}> {
  const maxRetries = options.maxRetries ?? 3;
  const caller = options.synthesizeChunkFn ?? defaultSynthesizeChunkCaller;

  const chunks =
    options.resumeCheckpoint && options.resumeCheckpoint.chunks.length > 0
      ? options.resumeCheckpoint.chunks
      : smartChunkText(options.text, SMART_CHUNK_MAX_CHARS);

  if (chunks.length === 0) {
    throw new Error('Please enter script text to synthesize into speech.');
  }

  const completedChunks: ChunkAudioOutput[] = options.resumeCheckpoint
    ? [...options.resumeCheckpoint.completedChunks]
    : [];
  const startIndex = options.resumeCheckpoint ? options.resumeCheckpoint.nextChunkIndex : 0;

  const startTimeMs = Date.now();

  for (let i = startIndex; i < chunks.length; i++) {
    if (options.signal?.aborted) {
      throw new Error('Synthesis cancelled by user. Progress saved for resume.');
    }

    // Read dynamic voice config if user changed voice during processing
    const liveVoice = options.getDynamicVoiceConfig
      ? options.getDynamicVoiceConfig()
      : { voiceName: options.voiceName, styleDirection: options.styleDirection };

    const chunkText = chunks[i];
    const completedSoFar = i - startIndex;
    const elapsedSec = Math.max(0.5, (Date.now() - startTimeMs) / 1000);
    const avgSecPerChunk =
      completedSoFar > 0
        ? elapsedSec / completedSoFar
        : Math.max(2, estimateSpeechDurationSeconds(chunkText) * 0.22);
    const remainingChunks = chunks.length - i;
    const estimatedSecondsRemaining = Math.max(1, Math.round(avgSecPerChunk * remainingChunks));

    options.onProgress?.({
      isProcessing: true,
      currentChunk: i + 1,
      totalChunks: chunks.length,
      percentage: Math.round((i / chunks.length) * 100),
      estimatedSecondsRemaining,
      currentChunkPreview:
        chunkText.length > 180 ? `${chunkText.slice(0, 180)}...` : chunkText,
      completedChunks: [...completedChunks],
      failedAttemptsOnCurrent: 0,
      activeVoiceName: liveVoice.voiceName,
    });

    let lastError: unknown = null;
    let chunkResult: { audioBase64: string; mimeType: string } | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) {
        throw new Error('Synthesis cancelled by user. Progress saved for resume.');
      }
      const attemptVoice = options.getDynamicVoiceConfig
        ? options.getDynamicVoiceConfig()
        : liveVoice;
      try {
        chunkResult = await caller({
          text: chunkText,
          voiceName: attemptVoice.voiceName,
          style: attemptVoice.styleDirection,
          signal: options.signal,
        });
        break;
      } catch (err: unknown) {
        lastError = err;
        if (options.signal?.aborted) {
          throw new Error('Synthesis cancelled by user. Progress saved for resume.');
        }
        options.onProgress?.({
          isProcessing: true,
          currentChunk: i + 1,
          totalChunks: chunks.length,
          percentage: Math.round((i / chunks.length) * 100),
          estimatedSecondsRemaining,
          currentChunkPreview:
            chunkText.length > 180 ? `${chunkText.slice(0, 180)}...` : chunkText,
          completedChunks: [...completedChunks],
          failedAttemptsOnCurrent: attempt,
          activeVoiceName: attemptVoice.voiceName,
        });
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
    }

    if (!chunkResult) {
      throw new Error(
        `Chunk ${i + 1}/${chunks.length} failed after ${maxRetries} attempts: ${formatUpstreamError(
          lastError
        )}`
      );
    }

    const chunkDuration = estimateSpeechDurationSeconds(chunkText);
    const chunkOutput: ChunkAudioOutput = {
      index: i + 1,
      text: chunkText,
      audioBase64: chunkResult.audioBase64,
      audioDataUrl: `data:${chunkResult.mimeType || 'audio/wav'};base64,${chunkResult.audioBase64}`,
      durationSec: chunkDuration,
    };

    completedChunks.push(chunkOutput);

    if (i + 1 < chunks.length) {
      saveBatchCheckpoint({
        id: options.resumeCheckpoint?.id || `batch-${Date.now()}`,
        title: options.title,
        fullText: options.text,
        voiceName: liveVoice.voiceName,
        styleDirection: liveVoice.styleDirection,
        chunks,
        completedChunks,
        nextChunkIndex: i + 1,
        updatedAt: new Date().toTimeString().slice(0, 8),
        chapterId: options.chapterId,
      });
    } else {
      clearBatchCheckpoint();
    }
  }

  const finalVoice = options.getDynamicVoiceConfig
    ? options.getDynamicVoiceConfig().voiceName
    : options.voiceName;

  options.onProgress?.({
    isProcessing: false,
    currentChunk: chunks.length,
    totalChunks: chunks.length,
    percentage: 100,
    estimatedSecondsRemaining: 0,
    currentChunkPreview: chunks[chunks.length - 1] ?? '',
    completedChunks: [...completedChunks],
    failedAttemptsOnCurrent: 0,
    activeVoiceName: finalVoice,
  });

  const mergedAudioBase64 = mergeWavBase64Chunks(
    completedChunks.map((c) => c.audioBase64)
  );
  const mergedAudioDataUrl = `data:audio/wav;base64,${mergedAudioBase64}`;
  const totalDurationSec = completedChunks.reduce((acc, c) => acc + c.durationSec, 0);

  return {
    mergedAudioBase64,
    mergedAudioDataUrl,
    chunkAudios: completedChunks,
    totalDurationSec,
    chunkCount: chunks.length,
  };
}

export function insertVocalMarker(
  text: string,
  marker: string,
  cursorPosition: number
): { text: string; nextCursor: number } {
  const safePos = Math.max(0, Math.min(cursorPosition, text.length));
  const before = text.slice(0, safePos);
  const after = text.slice(safePos);
  const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
  const needsTrailingSpace = after.length > 0 && !/^\s/.test(after);
  const insertion = `${needsLeadingSpace ? ' ' : ''}${marker}${needsTrailingSpace ? ' ' : ''}`;
  const updated = `${before}${insertion}${after}`;
  return {
    text: updated,
    nextCursor: before.length + insertion.length,
  };
}

export function estimateSpeechDurationSeconds(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  const burstMatches = cleaned.match(/<(breath|laugh|gasp)>/gi) ?? [];
  const words = cleaned
    .replace(/<(breath|laugh|gasp)>/gi, ' ')
    .replace(/\|[a-z]+\|/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const wordSeconds = words.length / 2.6;
  const burstSeconds = burstMatches.length * 0.45;
  return Math.max(1, Math.round(wordSeconds + burstSeconds));
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function estimateWavSizeMB(durationSec: number): number {
  const bytes = Math.max(0, durationSec) * 48000 + 44;
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

export function parseDialogueScript(
  rawScript: string,
  speakerA = 'Alex',
  speakerB = 'Sam',
  styleA = 'Enthusiastic, bright podcast host',
  styleB = 'Curious, articulate co-host'
): DialogueTurn[] {
  const lines = rawScript
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const turns: DialogueTurn[] = [];
  lines.forEach((line, idx) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 32) {
      const speakerRaw = line.slice(0, colonIdx).trim();
      const body = line.slice(colonIdx + 1).trim();
      const matchedSpeaker =
        speakerRaw.toLowerCase() === speakerB.toLowerCase() ? speakerB : speakerA;
      turns.push({
        id: `turn-${idx + 1}`,
        speaker: matchedSpeaker,
        text: body,
        style: matchedSpeaker === speakerB ? styleB : styleA,
      });
    } else {
      const fallbackSpeaker = idx % 2 === 0 ? speakerA : speakerB;
      turns.push({
        id: `turn-${idx + 1}`,
        speaker: fallbackSpeaker,
        text: line,
        style: fallbackSpeaker === speakerB ? styleB : styleA,
      });
    }
  });

  return turns;
}

export function filterAudioLibrary(
  items: AudioClipItem[],
  query: string,
  category: 'all' | 'bot' | 'single' | 'multi' | 'chapter',
  voiceFilter: string
): AudioClipItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedVoice = voiceFilter.trim().toLowerCase();

  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    if (normalizedVoice && normalizedVoice !== 'all') {
      if (!item.voiceSummary.toLowerCase().includes(normalizedVoice)) {
        return false;
      }
    }
    if (!normalizedQuery) {
      return true;
    }
    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.transcript.toLowerCase().includes(normalizedQuery) ||
      item.voiceSummary.toLowerCase().includes(normalizedQuery) ||
      item.styleDirection.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Generates a valid 24kHz 16-bit mono RIFF WAVE data URL containing silent PCM frames
 * (used exclusively by unit tests for testing WAV header parsing and chunk merging).
 */
export function createSynthesizedToneWavDataUrl(
  durationSec = 2,
  _baseFreqHz = 240
): string {
  const sampleRate = 24000;
  const clampedDuration = Math.max(0.5, Math.min(durationSec, 10));
  const numSamples = Math.floor(sampleRate * clampedDuration);
  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataBytes, true);

  const bytes = new Uint8Array(buffer);
  return `data:audio/wav;base64,${uint8ArrayToBase64(bytes)}`;
}

/**
 * Converts a base64 WAV string or data URL into a native binary Blob URL (blob:...)
 * for reliable playback in mobile standalone PWAs (Android WebAPK & iOS Standalone).
 */
export function wavDataUrlToBlobUrl(dataUrlOrBase64: string): string {
  if (!dataUrlOrBase64) return '';
  if (dataUrlOrBase64.startsWith('blob:')) return dataUrlOrBase64;
  try {
    const normalizedB64 = ensureWavBase64(dataUrlOrBase64);
    if (
      typeof window !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      const wavBytes = base64ToUint8Array(normalizedB64);
      const blob = new Blob([wavBytes.buffer as ArrayBuffer], {
        type: 'audio/wav',
      });
      return URL.createObjectURL(blob);
    }
    return `data:audio/wav;base64,${normalizedB64}`;
  } catch {
    return dataUrlOrBase64;
  }
}

// In-memory cache of synthesized voice sample audio data URLs
const voiceSampleCache = new Map<string, string>();

export function clearVoiceSampleCache(): void {
  voiceSampleCache.clear();
}

/**
 * Generates or fetches a clear, full-sentence audio sample (>= 3 seconds) for any of the 12 Gemini voices.
 * Automatically retries once if the TTS call fails or returns < 3 seconds of audio.
 * Never falls back to synthetic tone noise.
 */
export async function getVoiceSampleAudioDataUrl(
  voiceName: VoiceName,
  sampleText?: string,
  customFetchFn?: (params: {
    text: string;
    voiceName: VoiceName;
    style: string;
  }) => Promise<{ audioBase64: string; mimeType?: string }>
): Promise<string> {
  const profile = getVoiceProfile(voiceName);
  const effectiveScript =
    sampleText && sampleText.trim().startsWith('Welcome to Lexicon AI.')
      ? sampleText.trim()
      : getVoiceSampleText(profile.name);

  const cacheKey = `${profile.name}::${effectiveScript}`;
  const cached = voiceSampleCache.get(cacheKey);
  if (cached) return cached;

  const maxAttempts = 2; // Initial attempt + 1 automatic retry if under 3 seconds or failed
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let rawAudioBase64 = '';

      if (customFetchFn) {
        const res = await customFetchFn({
          text: effectiveScript,
          voiceName: profile.name,
          style: profile.defaultStyle,
        });
        rawAudioBase64 = res.audioBase64;
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
            body: JSON.stringify({
              mode: 'single',
              text: effectiveScript,
              voiceName: profile.name,
              style: profile.defaultStyle,
            }),
            signal: controller.signal,
          });

          const data = await response.json();
          if (!response.ok || !data?.audioBase64) {
            throw new Error(data?.error || 'Sample failed. Try again.');
          }
          rawAudioBase64 = data.audioBase64;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      const validation = validateWavAudioDurationSec(rawAudioBase64, 3.0);
      if (!validation.valid) {
        throw new Error(
          `Sample audio duration (${validation.durationSec.toFixed(
            2
          )}s) is under the 3.0s minimum.`
        );
      }

      const dataUrl = `data:audio/wav;base64,${validation.normalizedBase64}`;
      voiceSampleCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (err: unknown) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('Sample failed. Try again.');
}
