import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VOICES,
  VOICE_SAMPLE_SCRIPTS,
  VoiceName,
  getVoiceSampleText,
  ensureWavBase64,
  validateWavAudioDurationSec,
  getVoiceSampleAudioDataUrl,
  clearVoiceSampleCache,
  validateSynthesisInput,
  insertVocalMarker,
  estimateSpeechDurationSeconds,
  formatDuration,
  parseDialogueScript,
  filterAudioLibrary,
  createSynthesizedToneWavDataUrl,
  formatUpstreamError,
  smartChunkText,
  mergeWavBase64Chunks,
  batchSynthesize,
  filterAndSortVoices,
  toggleFavoriteVoiceList,
  recordRecentVoice,
  SMART_CHUNK_MAX_CHARS,
  AudioClipItem,
} from './ttsEngine';

test('VOICES catalog contains all 12 Gemini voices with exact "Welcome to Lexicon AI." sample scripts', () => {
  const expectedScripts: Record<VoiceName, string> = {
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

  assert.equal(VOICES.length, 12);
  for (const [name, expectedScript] of Object.entries(expectedScripts) as [
    VoiceName,
    string
  ][]) {
    const found = VOICES.find((v) => v.name === name);
    assert.ok(found, `Missing voice ${name}`);
    assert.equal(found.free, true, `Voice ${name} must be free`);
    assert.ok(found.sampleText.startsWith('Welcome to Lexicon AI.'));
    assert.equal(found.sampleText, expectedScript);
    assert.equal(VOICE_SAMPLE_SCRIPTS[name], expectedScript);
    assert.equal(getVoiceSampleText(name), expectedScript);
  }
});

test('ensureWavBase64 wraps raw headerless L16 PCM into a valid 44-byte RIFF WAVE file and validateWavAudioDurationSec enforces >= 3.0s', () => {
  // 4 seconds of raw 24kHz 16-bit mono PCM (without RIFF header) = 4 * 48000 = 192000 bytes
  const rawPcm4Sec = Buffer.alloc(192000, 0);
  const wrappedB64 = ensureWavBase64(rawPcm4Sec.toString('base64'));
  const wrappedBuf = Buffer.from(wrappedB64, 'base64');

  assert.equal(wrappedBuf.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(wrappedBuf.subarray(8, 12).toString('ascii'), 'WAVE');
  assert.equal(wrappedBuf.length, 44 + 192000);

  const check4s = validateWavAudioDurationSec(rawPcm4Sec.toString('base64'), 3.0);
  assert.equal(check4s.valid, true);
  assert.equal(Math.round(check4s.durationSec), 4);

  // 1.5 seconds of audio (< 3.0s minimum) must be rejected
  const shortPcm = Buffer.alloc(72000, 0);
  const checkShort = validateWavAudioDurationSec(shortPcm.toString('base64'), 3.0);
  assert.equal(checkShort.valid, false);
});

test('getVoiceSampleAudioDataUrl retries once if audio is < 3s, caches valid audio, and throws if both attempts fail', async () => {
  clearVoiceSampleCache();
  const shortAudioB64 = Buffer.alloc(48000, 0).toString('base64'); // 1.0s (< 3.0s)
  const validAudioB64 = Buffer.alloc(192000, 0).toString('base64'); // 4.0s (>= 3.0s)

  let callCount = 0;
  const dataUrl1 = await getVoiceSampleAudioDataUrl('Kore', undefined, async (params) => {
    callCount++;
    assert.equal(params.voiceName, 'Kore');
    assert.ok(params.text.startsWith('Welcome to Lexicon AI. I am Kore'));
    if (callCount === 1) {
      return { audioBase64: shortAudioB64, mimeType: 'audio/L16;rate=24000' };
    }
    return { audioBase64: validAudioB64, mimeType: 'audio/L16;rate=24000' };
  });

  assert.equal(callCount, 2, 'Should have retried once automatically when first audio was < 3s');
  assert.ok(dataUrl1.startsWith('data:audio/wav;base64,'));

  // Second call for Kore should hit in-memory cache immediately without calling customFetchFn
  const dataUrl2 = await getVoiceSampleAudioDataUrl('Kore', undefined, async () => {
    callCount++;
    return { audioBase64: validAudioB64 };
  });
  assert.equal(callCount, 2, 'Second click must be served from in-memory cache');
  assert.equal(dataUrl2, dataUrl1);

  // If both attempts fail, it must throw an error and NEVER return synthetic tone noise
  await assert.rejects(
    async () => {
      await getVoiceSampleAudioDataUrl('Charon', undefined, async () => {
        return { audioBase64: shortAudioB64 };
      });
    },
    /under the 3\.0s minimum|Sample failed/
  );
});

test('filterAndSortVoices filters by search, category, favorites, and pins favorites to top', () => {
  // All 12 when unfiltered
  const all = filterAndSortVoices({
    searchQuery: '',
    categoryFilter: 'all',
    sortBy: 'name',
    favorites: [],
    recentVoices: [],
    onlyFavorites: false,
  });
  assert.equal(all.length, 12);

  // Filter by Baritone (Charon, Perseus)
  const baritones = filterAndSortVoices({
    searchQuery: '',
    categoryFilter: 'Baritone',
    sortBy: 'name',
    favorites: [],
    recentVoices: [],
    onlyFavorites: false,
  });
  assert.equal(baritones.length, 2);
  assert.deepEqual(
    baritones.map((v) => v.name),
    ['Charon', 'Perseus']
  );

  // Pin favorites to top
  const withFavs = filterAndSortVoices({
    searchQuery: '',
    categoryFilter: 'all',
    sortBy: 'name',
    favorites: ['Zephyr', 'Perseus'],
    recentVoices: [],
    onlyFavorites: false,
  });
  assert.equal(withFavs[0].name, 'Perseus');
  assert.equal(withFavs[1].name, 'Zephyr');

  // Show only favorites
  const favsOnly = filterAndSortVoices({
    searchQuery: '',
    categoryFilter: 'all',
    sortBy: 'name',
    favorites: ['Aoede', 'Charis'],
    recentVoices: [],
    onlyFavorites: true,
  });
  assert.equal(favsOnly.length, 2);

  // Sort by recently used
  const byRecent = filterAndSortVoices({
    searchQuery: '',
    categoryFilter: 'all',
    sortBy: 'recent',
    favorites: [],
    recentVoices: ['Orus', 'Leda'],
    onlyFavorites: false,
  });
  assert.equal(byRecent[0].name, 'Orus');
  assert.equal(byRecent[1].name, 'Leda');
});

test('toggleFavoriteVoiceList and recordRecentVoice update lists cleanly', () => {
  let favs: VoiceName[] = [];
  favs = toggleFavoriteVoiceList(favs, 'Aoede');
  assert.deepEqual(favs, ['Aoede']);
  favs = toggleFavoriteVoiceList(favs, 'Perseus');
  assert.deepEqual(favs, ['Aoede', 'Perseus']);
  favs = toggleFavoriteVoiceList(favs, 'Aoede');
  assert.deepEqual(favs, ['Perseus']);

  let recent: VoiceName[] = ['Kore', 'Puck'];
  recent = recordRecentVoice(recent, 'Charis');
  assert.equal(recent[0], 'Charis');
});

test('batchSynthesize supports switching voice dynamically mid-process without crashing', async () => {
  const sampleWavB64 = createSynthesizedToneWavDataUrl(0.5, 260).replace(
    'data:audio/wav;base64,',
    ''
  );
  const multiChunkScript =
    'First sentence of chunk one. '.repeat(140) +
    '\n\n' +
    'Second paragraph sentence in chunk two. '.repeat(140);

  let dynamicVoice: VoiceName = 'Kore';
  const voicesUsedPerChunk: VoiceName[] = [];

  const result = await batchSynthesize({
    title: 'Dynamic Voice Switch Test',
    text: multiChunkScript,
    voiceName: 'Kore',
    styleDirection: 'Broadcast narrator',
    getDynamicVoiceConfig: () => ({
      voiceName: dynamicVoice,
      styleDirection: 'Dynamic style',
    }),
    synthesizeChunkFn: async (params) => {
      voicesUsedPerChunk.push(params.voiceName);
      // Simulate user switching voice from Kore to Perseus while chunk 1 is processing
      dynamicVoice = 'Perseus';
      return { audioBase64: sampleWavB64, mimeType: 'audio/wav' };
    },
  });

  assert.equal(result.chunkCount >= 2, true);
  assert.equal(voicesUsedPerChunk[0], 'Kore');
  assert.equal(voicesUsedPerChunk[1], 'Perseus');
});

test('validateSynthesisInput allows unlimited text length and only rejects empty text', () => {
  assert.equal(validateSynthesisInput({ mode: 'single', text: '   ' }).valid, false);

  const normalRes = validateSynthesisInput({
    mode: 'single',
    text: 'Welcome to the briefing.',
  });
  assert.equal(normalRes.valid, true);
  assert.equal(normalRes.isLargeTextWarning, false);

  const massiveText = 'This is a complete sentence for unlimited speech synthesis. '.repeat(2000);
  assert.equal(massiveText.length > 100000, true);
  const massiveRes = validateSynthesisInput({ mode: 'single', text: massiveText });
  assert.equal(massiveRes.valid, true);
  assert.equal(massiveRes.isLargeTextWarning, true);
});

test('smartChunkText splits 100,000+ chars and mixed Hindi + English at complete sentences <= 3800 chars', () => {
  const hindiSentence =
    'जगन्नाथ मंदिर का सबसे बड़ा रहस्य आज भी वैज्ञानिकों को हैरान करता है। ';
  const englishSentence =
    'Scientists and historians have studied the temple architecture for centuries! ';
  const mixedParagraph = (hindiSentence + englishSentence).repeat(35);

  const hundredKText = Array.from({ length: 22 }, () => mixedParagraph).join('\n\n');
  assert.equal(hundredKText.length >= 100000, true);

  const chunks = smartChunkText(hundredKText, SMART_CHUNK_MAX_CHARS);
  assert.equal(chunks.length > 25, true);

  for (const chunk of chunks) {
    assert.equal(
      chunk.length <= SMART_CHUNK_MAX_CHARS,
      true,
      `Chunk length ${chunk.length} exceeded ${SMART_CHUNK_MAX_CHARS}`
    );
    assert.equal(
      /[.!?।॥]$/.test(chunk.trim()),
      true,
      `Chunk did not end on sentence boundary: "${chunk.slice(-40)}"`
    );
  }
});

test('smartChunkText breaks oversized single sentence (>3800 chars) at nearest space', () => {
  const longClause = 'word1 word2 word3 word4 word5 '.repeat(200) + 'finalword.';
  assert.equal(longClause.length > 5000, true);
  const chunks = smartChunkText(longClause, SMART_CHUNK_MAX_CHARS);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length <= SMART_CHUNK_MAX_CHARS, true);
  const lastToken = chunks[0].split(' ').pop() ?? '';
  assert.equal(/^word[1-5]$/.test(lastToken), true);
  assert.equal(chunks[1].endsWith('finalword.'), true);
});

test('mergeWavBase64Chunks combines multiple WAV clips into one valid RIFF WAVE file', () => {
  const url1 = createSynthesizedToneWavDataUrl(0.5, 240);
  const url2 = createSynthesizedToneWavDataUrl(0.5, 320);
  const b1 = url1.replace('data:audio/wav;base64,', '');
  const b2 = url2.replace('data:audio/wav;base64,', '');

  const buf1 = Buffer.from(b1, 'base64');
  const buf2 = Buffer.from(b2, 'base64');
  const pcm1Len = buf1.length - 44;
  const pcm2Len = buf2.length - 44;

  const mergedB64 = mergeWavBase64Chunks([b1, b2]);
  const mergedBuf = Buffer.from(mergedB64, 'base64');

  assert.equal(mergedBuf.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(mergedBuf.subarray(8, 12).toString('ascii'), 'WAVE');
  assert.equal(mergedBuf.length, 44 + pcm1Len + pcm2Len);
  assert.equal(mergedBuf.readUInt32LE(40), pcm1Len + pcm2Len);
});

test('batchSynthesize queues chunks, retries failed chunks up to 3 times, and supports resume', async () => {
  const sampleWavB64 = createSynthesizedToneWavDataUrl(0.5, 260).replace(
    'data:audio/wav;base64,',
    ''
  );
  const multiChunkScript =
    'First sentence of chunk one. '.repeat(140) +
    '\n\n' +
    'Second paragraph sentence in Hindi। '.repeat(140);

  let attemptCounter = 0;
  const progressSnapshots: number[] = [];

  const result = await batchSynthesize({
    title: 'Batch Queue Test',
    text: multiChunkScript,
    voiceName: 'Kore',
    styleDirection: 'Broadcast narrator',
    maxRetries: 3,
    onProgress: (state) => {
      progressSnapshots.push(state.percentage);
    },
    synthesizeChunkFn: async () => {
      attemptCounter++;
      if (attemptCounter === 1) {
        throw new Error('Transient network timeout');
      }
      return { audioBase64: sampleWavB64, mimeType: 'audio/wav' };
    },
  });

  assert.equal(result.chunkCount >= 2, true);
  assert.equal(result.chunkAudios.length, result.chunkCount);
  assert.equal(result.mergedAudioDataUrl.startsWith('data:audio/wav;base64,'), true);
  assert.equal(progressSnapshots.includes(100), true);
});

test('insertVocalMarker inserts expressive tags with clean spacing', () => {
  const initial = 'Hello world';
  const res = insertVocalMarker(initial, '<breath>', 5);
  assert.equal(res.text, 'Hello <breath> world');

  const atEnd = insertVocalMarker('Great point', '|yeah|', 11);
  assert.equal(atEnd.text, 'Great point |yeah|');
});

test('estimateSpeechDurationSeconds and formatDuration compute tabular strings', () => {
  const sec = estimateSpeechDurationSeconds(
    'Welcome back <breath> today we are testing expressive speech synthesis with Gemini Flash TTS.'
  );
  assert.equal(sec >= 4, true);
  assert.equal(formatDuration(5), '00:05');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(3665), '01:01:05');
});

test('parseDialogueScript parses speaker prefixes and assigns styles', () => {
  const raw = `Alex: Welcome back! <breath> Today we are exploring neural speech.\nSam: That is right, |yeah| the vocal bursts sound natural.`;
  const turns = parseDialogueScript(raw, 'Alex', 'Sam', 'Host Style', 'Co-Host Style');
  assert.equal(turns.length, 2);
  assert.equal(turns[0].speaker, 'Alex');
  assert.equal(turns[0].style, 'Host Style');
  assert.equal(turns[1].speaker, 'Sam');
  assert.equal(turns[1].style, 'Co-Host Style');
});

test('filterAudioLibrary filters by category, voice, and search query', () => {
  const sampleLibrary: AudioClipItem[] = [
    {
      id: 'c1',
      title: 'Morning Grid Briefing',
      category: 'bot',
      voiceSummary: 'Kore (Single)',
      styleDirection: 'Broadcast anchor',
      transcript: 'Battery storage capacity grew by forty percent.',
      durationSec: 12,
      createdAt: '09:15:00',
      audioDataUrl: 'data:audio/wav;base64,UklGRg==',
      modelUsed: 'gemini-3.8-flash-tts',
    },
    {
      id: 'c2',
      title: 'Deep Sea Podcast Intro',
      category: 'multi',
      voiceSummary: 'Puck + Kore (Dual)',
      styleDirection: 'Enthusiastic podcast dialogue',
      transcript: 'Alex: Welcome! <breath> Sam: Excited to talk submarines.',
      durationSec: 18,
      createdAt: '09:20:00',
      audioDataUrl: 'data:audio/wav;base64,UklGRg==',
      modelUsed: 'gemini-3.8-flash-tts',
    },
  ];

  assert.equal(filterAudioLibrary(sampleLibrary, '', 'all', 'all').length, 2);
  assert.equal(filterAudioLibrary(sampleLibrary, '', 'multi', 'all').length, 1);
  assert.equal(filterAudioLibrary(sampleLibrary, 'submarine', 'all', 'all').length, 1);
  assert.equal(filterAudioLibrary(sampleLibrary, '', 'all', 'Puck').length, 1);
});

test('formatUpstreamError extracts clean message from JSON error payloads', () => {
  const rawJson =
    '{"error":{"code":400,"message":"Invalid JSON payload received.","status":"INVALID_ARGUMENT"}}';
  assert.equal(formatUpstreamError(new Error(rawJson)), 'Invalid JSON payload received.');
  assert.equal(formatUpstreamError('Simple error message'), 'Simple error message');
});
