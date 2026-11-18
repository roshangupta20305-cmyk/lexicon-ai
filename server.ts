import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Support up to 50MB JSON payloads so 10MB+ text inputs and multi-chunk audio merges work seamlessly
app.use(express.json({ limit: '50mb' }));

const SERVER_MAX_CHUNK_CHARS = 3800;

export interface ServerVoiceInfo {
  name: string;
  label: string;
  register: string;
  voiceCategory: 'Soprano' | 'Alto' | 'Tenor' | 'Baritone' | 'Bass';
  timbre: string;
  defaultStyle: string;
  sampleFreq: number;
  iconSymbol: string;
  free: boolean;
  sampleText: string;
}

const DEFAULT_SAMPLE_TEXT =
  'Hello, this is a sample of my voice. I am ready to narrate your content.';

const ALL_GEMINI_VOICES: ServerVoiceInfo[] = [
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
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
    sampleText: DEFAULT_SAMPLE_TEXT,
  },
];

// Fallback prebuilt voice mapping if an upstream region rejects a newer voice alias
const UPSTREAM_VOICE_FALLBACK_MAP: Record<string, string> = {
  Kore: 'Kore',
  Puck: 'Puck',
  Charon: 'Charon',
  Fenrir: 'Fenrir',
  Zephyr: 'Zephyr',
  Aoede: 'Kore',
  Leda: 'Zephyr',
  Orus: 'Puck',
  Perseus: 'Charon',
  Callirrhoe: 'Kore',
  Autonoë: 'Zephyr',
  Autonoe: 'Zephyr',
  Charis: 'Kore',
};

function normalizeApiVoiceName(voiceName: string): string {
  if (voiceName === 'Autonoë') return 'Autonoe';
  return voiceName || 'Kore';
}

function extractReadableError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : fallback;
  const jsonIdx = raw.indexOf('{');
  if (jsonIdx !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonIdx));
      const msg = parsed?.error?.message || parsed?.message;
      if (typeof msg === 'string' && msg.trim()) {
        return msg.trim();
      }
    } catch {
      // Keep raw string if not valid JSON
    }
  }
  return raw || fallback;
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio to attach your Gemini API key.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function smartChunkTextServer(rawText: string, maxChars = SERVER_MAX_CHUNK_CHARS): string[] {
  const trimmed = (rawText ?? '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const paragraphs = trimmed
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = '';

  const flush = () => {
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  };

  const splitLongSentence = (sentence: string): string[] => {
    const parts: string[] = [];
    let rem = sentence.trim();
    while (rem.length > maxChars) {
      const windowSlice = rem.slice(0, maxChars);
      const lastSpace = Math.max(
        windowSlice.lastIndexOf(' '),
        windowSlice.lastIndexOf('\t'),
        windowSlice.lastIndexOf('\n')
      );
      if (lastSpace > 0) {
        parts.push(rem.slice(0, lastSpace).trim());
        rem = rem.slice(lastSpace + 1).trim();
      } else {
        parts.push(rem.slice(0, maxChars));
        rem = rem.slice(maxChars).trim();
      }
    }
    if (rem.length > 0) parts.push(rem);
    return parts;
  };

  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      const candidate = currentChunk ? `${currentChunk}\n\n${para}` : para;
      if (candidate.length <= maxChars) {
        currentChunk = candidate;
      } else {
        flush();
        currentChunk = para;
      }
      continue;
    }

    flush();
    const sentenceMatches = para.match(/[^.!?।॥]+(?:[.!?।॥]+['"”’)\]]*|\s*$)/gu) ?? [para];
    for (const rawSentence of sentenceMatches) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      if (sentence.length <= maxChars) {
        const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        if (candidate.length <= maxChars) {
          currentChunk = candidate;
        } else {
          flush();
          currentChunk = sentence;
        }
      } else {
        flush();
        const subPieces = splitLongSentence(sentence);
        for (const piece of subPieces) {
          if (currentChunk && `${currentChunk} ${piece}`.length <= maxChars) {
            currentChunk = `${currentChunk} ${piece}`;
          } else {
            flush();
            currentChunk = piece;
          }
        }
        flush();
      }
    }
    flush();
  }

  flush();
  return chunks;
}

function mergeWavBuffersServer(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return wavBuffers[0];

  const pcmSlices: Buffer[] = [];
  let totalPcmLength = 0;

  for (const buf of wavBuffers) {
    if (buf.length <= 44) continue;
    let dataOffset = 44;
    const searchLimit = Math.min(buf.length - 8, 256);
    for (let i = 12; i <= searchLimit; i++) {
      if (
        buf[i] === 0x64 &&
        buf[i + 1] === 0x61 &&
        buf[i + 2] === 0x74 &&
        buf[i + 3] === 0x61
      ) {
        dataOffset = i + 8;
        break;
      }
    }
    if (dataOffset < buf.length) {
      const pcm = buf.subarray(dataOffset);
      pcmSlices.push(pcm);
      totalPcmLength += pcm.length;
    }
  }

  const header = Buffer.alloc(44);
  const sampleRate = 24000;
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + totalPcmLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(totalPcmLength, 40);

  return Buffer.concat([header, ...pcmSlices], 44 + totalPcmLength);
}

interface SingleTtsRequest {
  mode: 'single';
  text: string;
  voiceName?: string;
  style?: string;
}

interface MultiSpeakerTurn {
  speaker: string;
  text: string;
  style?: string;
}

interface MultiTtsRequest {
  mode: 'multi';
  turns: MultiSpeakerTurn[];
  speakers: [
    { speaker: string; voiceName: string },
    { speaker: string; voiceName: string }
  ];
}

type TtsRequestBody = SingleTtsRequest | MultiTtsRequest;

async function synthesizeSingleChunkWithRetry(
  ai: GoogleGenAI,
  text: string,
  voiceName: string,
  style?: string,
  maxRetries = 3
): Promise<{ audioBase64: string; mimeType: string }> {
  const model = 'gemini-3.8-flash-tts';
  const voiceInfo = ALL_GEMINI_VOICES.find((v) => v.name === voiceName);
  const effectiveStyle = style || voiceInfo?.defaultStyle || '';
  const apiVoiceName = normalizeApiVoiceName(voiceName);

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // On attempt 1 try the exact normalized voice name; if upstream rejects the voice name, fallback to acoustic match
    const targetPrebuiltVoice =
      attempt === 1
        ? apiVoiceName
        : UPSTREAM_VOICE_FALLBACK_MAP[voiceName] || 'Kore';

    const singleSpeechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: targetPrebuiltVoice },
      },
    };

    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  ...(effectiveStyle ? { speechMetadata: { style: effectiveStyle } } : {}),
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: singleSpeechConfig,
          },
        });
      } catch (err: unknown) {
        const errStr = err instanceof Error ? err.message : String(err);
        if (errStr.includes('speechMetadata')) {
          const styledPrompt = effectiveStyle
            ? `Say in a ${effectiveStyle} tone: ${text}`
            : text;
          response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ text: styledPrompt }],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: singleSpeechConfig,
            },
          });
        } else {
          throw err;
        }
      }

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) {
        throw new Error('Gemini 3.8 Flash TTS did not return audio data.');
      }

      return {
        audioBase64: inlineData.data,
        mimeType: inlineData.mimeType || 'audio/wav',
      };
    } catch (err: unknown) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
  }

  throw lastError ?? new Error('Failed to synthesize chunk after 3 retries.');
}

async function synthesizeWithGeminiFlashTts(
  ai: GoogleGenAI,
  payload: TtsRequestBody
): Promise<{ audioBase64: string; mimeType: string; model: string; chunkCount?: number }> {
  const model = 'gemini-3.8-flash-tts';

  if (payload.mode === 'multi') {
    const validTurns = (payload.turns ?? []).filter((t) => t.text && t.text.trim().length > 0);
    if (validTurns.length < 2) {
      throw new Error('Multi-speaker synthesis requires at least 2 non-empty dialogue turns.');
    }
    if (!payload.speakers || payload.speakers.length !== 2) {
      throw new Error('Multi-speaker synthesis requires exactly 2 speakerVoiceConfigs.');
    }

    const partsWithMetadata = validTurns.map((turn) => {
      const prefix = turn.text.trim().startsWith(`${turn.speaker}:`)
        ? turn.text.trim()
        : `${turn.speaker}: ${turn.text.trim()}`;
      return {
        text: prefix,
        speechMetadata: {
          speaker: turn.speaker,
          ...(turn.style ? { style: turn.style } : {}),
        },
      };
    });

    const buildMultiSpeakerConfig = (useFallbackVoices: boolean) => ({
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: [
          {
            speaker: payload.speakers[0].speaker,
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: useFallbackVoices
                  ? UPSTREAM_VOICE_FALLBACK_MAP[payload.speakers[0].voiceName] || 'Puck'
                  : normalizeApiVoiceName(payload.speakers[0].voiceName || 'Puck'),
              },
            },
          },
          {
            speaker: payload.speakers[1].speaker,
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: useFallbackVoices
                  ? UPSTREAM_VOICE_FALLBACK_MAP[payload.speakers[1].voiceName] || 'Kore'
                  : normalizeApiVoiceName(payload.speakers[1].voiceName || 'Kore'),
              },
            },
          },
        ],
      },
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: partsWithMetadata,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: buildMultiSpeakerConfig(false),
        },
      });
    } catch {
      const combinedScript = validTurns
        .map((turn) =>
          turn.text.trim().startsWith(`${turn.speaker}:`)
            ? turn.text.trim()
            : `${turn.speaker}: ${turn.text.trim()}`
        )
        .join('\n');
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: combinedScript }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: buildMultiSpeakerConfig(true),
        },
      });
    }

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      throw new Error('Gemini 3.8 Flash TTS did not return audio data for this dialogue.');
    }
    return {
      audioBase64: inlineData.data,
      mimeType: inlineData.mimeType || 'audio/wav',
      model,
      chunkCount: 1,
    };
  }

  // Single-speaker synthesis using gemini-3.8-flash-tts with automatic smart chunking & queue
  const text = (payload.text ?? '').trim();
  if (!text) {
    throw new Error('Text is required for speech synthesis.');
  }

  const voiceName = payload.voiceName || 'Kore';
  const style = payload.style?.trim();
  const chunks = smartChunkTextServer(text, SERVER_MAX_CHUNK_CHARS);

  if (chunks.length === 1) {
    const singleRes = await synthesizeSingleChunkWithRetry(ai, chunks[0], voiceName, style, 3);
    return {
      audioBase64: singleRes.audioBase64,
      mimeType: singleRes.mimeType,
      model,
      chunkCount: 1,
    };
  }

  const wavBuffers: Buffer[] = [];
  for (const chunkText of chunks) {
    const chunkRes = await synthesizeSingleChunkWithRetry(ai, chunkText, voiceName, style, 3);
    wavBuffers.push(Buffer.from(chunkRes.audioBase64, 'base64'));
  }

  const mergedBuffer = mergeWavBuffersServer(wavBuffers);
  return {
    audioBase64: mergedBuffer.toString('base64'),
    mimeType: 'audio/wav',
    model,
    chunkCount: chunks.length,
  };
}

// GET /api/voices - Returns all 12 Gemini TTS voices (100% free and unlimited)
app.get('/api/voices', (_req, res) => {
  res.json({
    voices: ALL_GEMINI_VOICES,
    total: ALL_GEMINI_VOICES.length,
    freeAccess: true,
    sampleText: DEFAULT_SAMPLE_TEXT,
  });
});

// POST /api/tts/chunk - Returns automatic sentence-preserving smart chunks (<= 3,800 chars)
app.post('/api/tts/chunk', (req, res) => {
  try {
    const { text = '', maxChars = SERVER_MAX_CHUNK_CHARS } = req.body ?? {};
    const chunks = smartChunkTextServer(String(text), Number(maxChars) || SERVER_MAX_CHUNK_CHARS);
    res.json({
      chunks,
      totalChunks: chunks.length,
    });
  } catch (err: unknown) {
    const message = extractReadableError(err, 'Failed to split text into smart chunks.');
    res.status(500).json({ error: message });
  }
});

// POST /api/tts/merge - Merges an array of base64 WAV chunks into a single 24kHz 16-bit mono WAV
app.post('/api/tts/merge', (req, res) => {
  try {
    const { audioBase64Chunks = [] } = req.body ?? {};
    if (!Array.isArray(audioBase64Chunks) || audioBase64Chunks.length === 0) {
      res.status(400).json({ error: 'audioBase64Chunks array is required.' });
      return;
    }
    const buffers = audioBase64Chunks.map((b64: string) =>
      Buffer.from(b64.includes(',') ? b64.split(',')[1] : b64, 'base64')
    );
    const merged = mergeWavBuffersServer(buffers);
    res.json({
      audioBase64: merged.toString('base64'),
      mimeType: 'audio/wav',
      mergedChunks: buffers.length,
    });
  } catch (err: unknown) {
    const message = extractReadableError(err, 'Failed to merge WAV audio chunks.');
    res.status(500).json({ error: message });
  }
});

// POST /api/tts/batch - Processes an entire text or array of chunks sequentially in a batch queue
app.post('/api/tts/batch', async (req, res) => {
  try {
    const ai = getGenAIClient();
    const {
      text = '',
      chunks: providedChunks,
      voiceName = 'Kore',
      style = '',
    } = req.body ?? {};

    const chunks: string[] =
      Array.isArray(providedChunks) && providedChunks.length > 0
        ? providedChunks
        : smartChunkTextServer(String(text), SERVER_MAX_CHUNK_CHARS);

    if (chunks.length === 0) {
      res.status(400).json({ error: 'Please provide text to synthesize.' });
      return;
    }

    const chunkOutputs: { index: number; audioBase64: string }[] = [];
    const wavBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const result = await synthesizeSingleChunkWithRetry(
        ai,
        chunks[i],
        voiceName,
        style?.trim(),
        3
      );
      chunkOutputs.push({ index: i + 1, audioBase64: result.audioBase64 });
      wavBuffers.push(Buffer.from(result.audioBase64, 'base64'));
    }

    const merged = mergeWavBuffersServer(wavBuffers);
    res.json({
      audioBase64: merged.toString('base64'),
      mimeType: 'audio/wav',
      model: 'gemini-3.8-flash-tts',
      chunkCount: chunks.length,
      chunks: chunkOutputs,
    });
  } catch (err: unknown) {
    const message = extractReadableError(err, 'Failed to process batch TTS queue.');
    console.error('[/api/tts/batch Error]:', message);
    res.status(500).json({ error: message });
  }
});

// POST /api/tts - Direct single-speaker or multi-speaker TTS synthesis via gemini-3.8-flash-tts
app.post('/api/tts', async (req, res) => {
  try {
    const ai = getGenAIClient();
    const result = await synthesizeWithGeminiFlashTts(ai, req.body as TtsRequestBody);
    res.json(result);
  } catch (err: unknown) {
    const message = extractReadableError(err, 'Failed to synthesize speech.');
    console.error('[/api/tts Error]:', message);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lexicon AI Studio server listening on http://localhost:${PORT}`);
  });
}

startServer();
