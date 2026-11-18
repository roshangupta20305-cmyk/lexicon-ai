import { GoogleGenAI } from '@google/genai';

const SERVER_MAX_CHUNK_CHARS = 3800;

const VOICE_DEFAULT_STYLES: Record<string, string> = {
  Kore: 'Clear, composed, and articulate studio narrator',
  Puck: 'Enthusiastic, bright, and engaging podcast host',
  Charon: 'Measured, resonant documentary narrator with calm gravitas',
  Fenrir: 'Dynamic, expressive storyteller with crisp diction',
  Zephyr: 'Warm, empathetic, and relaxed conversational guide',
  Aoede: 'Expressive, lyrical, and musical soprano narrator',
  Leda: 'Gentle, nurturing, and warm storytelling narrator',
  Orus: 'Confident, authoritative news anchor and analyst',
  Perseus: 'Dramatic, cinematic baritone for epic narration',
  Callirrhoe: 'Emotional, poetic, and expressive literary voice',
  Autonoë: 'Calm, meditative, and peaceful contralto guide',
  Charis: 'Cheerful, friendly, and upbeat conversational soprano',
};

const UPSTREAM_VOICE_FALLBACK_MAP: Record<string, string> = {
  Kore: 'Kore',
  Puck: 'Puck',
  Charon: 'Charon',
  Fenrir: 'Fenrir',
  Zephyr: 'Zephyr',
  Aoede: 'Aoede',
  Leda: 'Leda',
  Orus: 'Orus',
  Perseus: 'Charon',
  Callirrhoe: 'Callirrhoe',
  Autonoë: 'Autonoe',
  Autonoe: 'Autonoe',
  Charis: 'Aoede',
};

const TTS_MODEL_CANDIDATES = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-2.5-flash-preview-tts',
];

function normalizeApiVoiceName(voiceName: string): string {
  if (voiceName === 'Autonoë') return 'Autonoe';
  return voiceName || 'Kore';
}

function parseSampleRateFromMime(mimeType?: string): number {
  if (!mimeType) return 24000;
  const match = mimeType.match(/rate=(\d+)/i);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed >= 8000 && parsed <= 96000) {
      return parsed;
    }
  }
  return 24000;
}

function isRiffWaveBuffer(buf: Buffer): boolean {
  return (
    buf.length > 44 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x41 &&
    buf[10] === 0x56 &&
    buf[11] === 0x45
  );
}

function ensureWavBuffer(rawBuffer: Buffer, mimeType?: string): Buffer {
  if (isRiffWaveBuffer(rawBuffer)) {
    return rawBuffer;
  }

  const pcmBuffer =
    rawBuffer.length % 2 === 0
      ? rawBuffer
      : rawBuffer.subarray(0, rawBuffer.length - 1);
  const sampleRate = parseSampleRateFromMime(mimeType);
  const totalPcmLength = pcmBuffer.length;

  const header = Buffer.alloc(44);
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

  return Buffer.concat([header, pcmBuffer], 44 + totalPcmLength);
}

function mergeWavBuffersServer(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return ensureWavBuffer(wavBuffers[0]);

  const pcmSlices: Buffer[] = [];
  let totalPcmLength = 0;

  for (const rawBuf of wavBuffers) {
    const buf = ensureWavBuffer(rawBuf);
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
        let rem = sentence;
        while (rem.length > maxChars) {
          const slice = rem.slice(0, maxChars);
          const lastSpace = slice.lastIndexOf(' ');
          if (lastSpace > 0) {
            chunks.push(rem.slice(0, lastSpace).trim());
            rem = rem.slice(lastSpace + 1).trim();
          } else {
            chunks.push(rem.slice(0, maxChars));
            rem = rem.slice(maxChars).trim();
          }
        }
        if (rem) currentChunk = rem;
        flush();
      }
    }
    flush();
  }

  flush();
  return chunks;
}

async function synthesizeSingleChunkWithRetry(
  ai: GoogleGenAI,
  text: string,
  voiceName: string,
  style?: string,
  maxRetries = 3
): Promise<{ audioBase64: string; mimeType: string }> {
  const effectiveStyle = style?.trim() || VOICE_DEFAULT_STYLES[voiceName] || '';
  const apiVoiceName = normalizeApiVoiceName(voiceName);

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const targetPrebuiltVoice =
      attempt === 1
        ? apiVoiceName
        : UPSTREAM_VOICE_FALLBACK_MAP[voiceName] || 'Kore';

    const singleSpeechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: targetPrebuiltVoice },
      },
    };

    for (const candidateModel of TTS_MODEL_CANDIDATES) {
      try {
        let response;
        try {
          response = await ai.models.generateContent({
            model: candidateModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text,
                    ...(effectiveStyle && candidateModel.startsWith('gemini-3.8')
                      ? { speechMetadata: { style: effectiveStyle } }
                      : {}),
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
          if (errStr.includes('speechMetadata') || errStr.includes('Cannot find field')) {
            response = await ai.models.generateContent({
              model: candidateModel,
              contents: [
                {
                  role: 'user',
                  parts: [{ text }],
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
          throw new Error('Gemini TTS did not return audio data.');
        }

        const rawBuf = Buffer.from(inlineData.data, 'base64');
        if (rawBuf.length < 100) {
          throw new Error('Gemini TTS returned an empty or corrupted audio buffer.');
        }

        const wavBuf = ensureWavBuffer(rawBuf, inlineData.mimeType);
        return {
          audioBase64: wavBuf.toString('base64'),
          mimeType: 'audio/wav',
        };
      } catch (modelErr: unknown) {
        lastError = modelErr;
        const msg = modelErr instanceof Error ? modelErr.message : String(modelErr);
        if (
          msg.includes('404') ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('not supported')
        ) {
          continue;
        }
        break;
      }
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }

  throw lastError ?? new Error('Failed to synthesize chunk after 3 retries.');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY in your environment variables.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const text = String(body.text ?? '').trim();
    if (!text) {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }

    const voiceName = String(body.voiceName || 'Kore');
    const style = body.style ? String(body.style).trim() : undefined;
    const chunks = smartChunkTextServer(text, SERVER_MAX_CHUNK_CHARS);

    if (chunks.length === 1) {
      const singleRes = await synthesizeSingleChunkWithRetry(
        ai,
        chunks[0],
        voiceName,
        style,
        3
      );
      res.status(200).json({
        audioBase64: singleRes.audioBase64,
        mimeType: 'audio/wav',
        model: 'gemini-3.8-flash-tts',
        chunkCount: 1,
      });
      return;
    }

    const wavBuffers: Buffer[] = [];
    for (const chunkText of chunks) {
      const chunkRes = await synthesizeSingleChunkWithRetry(
        ai,
        chunkText,
        voiceName,
        style,
        3
      );
      wavBuffers.push(Buffer.from(chunkRes.audioBase64, 'base64'));
    }

    const mergedBuffer = mergeWavBuffersServer(wavBuffers);
    res.status(200).json({
      audioBase64: mergedBuffer.toString('base64'),
      mimeType: 'audio/wav',
      model: 'gemini-3.8-flash-tts',
      chunkCount: chunks.length,
    });
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Failed to synthesize speech.';
    res.status(500).json({ error: raw });
  }
}
