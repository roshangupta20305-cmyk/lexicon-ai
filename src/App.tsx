/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AudioClipItem,
  ChapterItem,
  SavedBatchCheckpoint,
  VoiceName,
  clearLegacyDemoStorage,
  getVoiceProfile,
  loadFavoriteVoices,
  loadRecentVoices,
  recordRecentVoice,
  toggleFavoriteVoiceList,
} from './utils/ttsEngine';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useVoiceQueue } from './hooks/useVoiceQueue';
import { PremiumHeader, WorkspaceTab } from './components/PremiumHeader';
import { PremiumTextEditor, VOCAL_STYLE_PRESETS } from './components/PremiumTextEditor';
import { PremiumVoiceSelector } from './components/PremiumVoiceSelector';
import { PremiumChapterManager } from './components/PremiumChapterManager';
import { PremiumAudioPlayer } from './components/PremiumAudioPlayer';
import { PremiumProgressBar } from './components/PremiumProgressBar';
import { AudioLibrary } from './components/AudioLibrary';
import { InstallPrompt } from './components/InstallPrompt';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');

  // Clear all legacy/demo localStorage keys on first mount
  useEffect(() => {
    clearLegacyDemoStorage();
  }, []);

  // Voice & Delivery Style state (all 12 Gemini voices unlocked & 100% free, default Kore)
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<string>(
    VOCAL_STYLE_PRESETS[0].direction
  );
  const [favorites, setFavorites] = useState<VoiceName[]>(() => loadFavoriteVoices());
  const [recentVoices, setRecentVoices] = useState<VoiceName[]>(() => loadRecentVoices());

  // Live ref for dynamic mid-synthesis voice switching
  const liveVoiceConfigRef = useRef<{ voiceName: VoiceName; styleDirection: string }>({
    voiceName: 'Kore',
    styleDirection: VOCAL_STYLE_PRESETS[0].direction,
  });

  // Clean, empty Studio Editor state on page load
  const [clipTitle, setClipTitle] = useState('');
  const [scriptText, setScriptText] = useState('');

  // Clean, empty Audio Library & Player state (player only appears after generation)
  const [clips, setClips] = useState<AudioClipItem[]>([]);
  const [activeClip, setActiveClip] = useState<AudioClipItem | null>(null);

  // Clean, empty Chapter Manager initial state
  const [chapters, setChapters] = useState<ChapterItem[]>([
    {
      id: 'ch-1',
      title: 'Chapter 1',
      text: '',
      voiceName: 'Kore',
      styleDirection: getVoiceProfile('Kore').defaultStyle,
      status: 'idle',
    },
  ]);

  // Instant voice selection handler (no API call blocking selection)
  const handleSelectVoice = (voiceName: VoiceName) => {
    const profile = getVoiceProfile(voiceName);
    setSelectedVoice(voiceName);
    setSelectedStyle(profile.defaultStyle);
    liveVoiceConfigRef.current = {
      voiceName,
      styleDirection: profile.defaultStyle,
    };
    setRecentVoices((prev) => recordRecentVoice(prev, voiceName));
  };

  const handleSelectStyle = (styleDirection: string) => {
    setSelectedStyle(styleDirection);
    liveVoiceConfigRef.current = {
      voiceName: selectedVoice,
      styleDirection,
    };
  };

  const handleToggleFavorite = (voiceName: VoiceName) => {
    setFavorites((prev) => toggleFavoriteVoiceList(prev, voiceName));
  };

  const handleClipCreated = (newClip: AudioClipItem) => {
    setClips((prev) => [newClip, ...prev]);
  };

  const handleDeleteClip = (id: string) => {
    setClips((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeClip?.id === id) {
        setActiveClip(remaining[0] ?? null);
      }
      return remaining;
    });
  };

  // Batch synthesis queue hook
  const {
    batchProgress,
    savedCheckpoint,
    isSynthesizing,
    validationError,
    apiError,
    statusNotice,
    runSynthesisQueue,
    cancelQueue,
    discardCheckpoint,
  } = useVoiceQueue({
    onClipCreated: handleClipCreated,
    onSelectActiveClip: (clip) => setActiveClip(clip),
    getDynamicVoiceConfig: () => liveVoiceConfigRef.current,
  });

  // PWA Install hook
  const {
    isInstallable,
    hasNativePrompt,
    isInstalled,
    isIOS,
    isOnline,
    showBanner,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
    confirmStandaloneInstall,
    dismissBanner,
  } = usePWAInstall();

  const handleSynthesizeStudio = async () => {
    await runSynthesisQueue({
      title: clipTitle.trim() || 'Untitled Project',
      text: scriptText,
      voiceName: selectedVoice,
      styleDirection: selectedStyle,
    });
  };

  const handleResumeCheckpoint = async (checkpoint: SavedBatchCheckpoint) => {
    setClipTitle(checkpoint.title);
    setScriptText(checkpoint.fullText);
    handleSelectVoice(checkpoint.voiceName);
    await runSynthesisQueue({
      title: checkpoint.title,
      text: checkpoint.fullText,
      voiceName: checkpoint.voiceName,
      styleDirection: checkpoint.styleDirection,
      checkpointToResume: checkpoint,
    });
  };

  return (
    <div className="relative min-h-screen bg-[#0B0F19] text-white pb-24 md:pb-12">
      {/* Subtle Ambient Deep Indigo & Electric Blue Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#4F46E5]/15 blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/12 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#06B6D4]/10 blur-[140px]" />
      </div>

      {/* 1. Premium Header: Lexicon AI | Studio • Voices • Library | 📱 Install App */}
      <PremiumHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        libraryCount={clips.length}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isOnline={isOnline}
        onTriggerInstall={triggerInstall}
      />

      {/* Core Workflow Container: Text Input -> Voice Selection -> Chapter Management -> Generation -> Download */}
      <main className="relative z-10 mx-auto max-w-[1440px] space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {/* 5. Audio Output & Waveform Player (Only visible after generation) */}
        <PremiumAudioPlayer clip={activeClip} />

        {/* Live Progress Bar & Save/Resume */}
        <PremiumProgressBar
          progress={batchProgress}
          savedCheckpoint={savedCheckpoint}
          onCancel={cancelQueue}
          onResumeCheckpoint={handleResumeCheckpoint}
          onDiscardCheckpoint={discardCheckpoint}
        />

        {/* Studio View: Text Input -> Visual Voice Selection -> Chapter Management */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <PremiumTextEditor
                  clipTitle={clipTitle}
                  onChangeClipTitle={setClipTitle}
                  scriptText={scriptText}
                  onChangeScriptText={setScriptText}
                  selectedVoice={selectedVoice}
                  selectedStyle={selectedStyle}
                  onSelectStyle={handleSelectStyle}
                  isSynthesizing={isSynthesizing}
                  validationError={validationError}
                  apiError={apiError}
                  statusNotice={statusNotice}
                  onSynthesize={handleSynthesizeStudio}
                  onOpenVoiceTab={() => setActiveTab('voices')}
                />
              </div>

              <div className="lg:col-span-5">
                <PremiumVoiceSelector
                  selectedVoice={selectedVoice}
                  onSelectVoice={handleSelectVoice}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  recentVoices={recentVoices}
                  compactMode
                />
              </div>
            </div>

            {/* 4. Chapter Manager integrated into Studio Workflow */}
            <PremiumChapterManager
              chapters={chapters}
              onChangeChapters={setChapters}
              defaultVoice={selectedVoice}
              onClipCreated={handleClipCreated}
              onSelectActiveClip={(clip) => setActiveClip(clip)}
            />
          </div>
        )}

        {/* Voices View */}
        {activeTab === 'voices' && (
          <PremiumVoiceSelector
            selectedVoice={selectedVoice}
            onSelectVoice={handleSelectVoice}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            recentVoices={recentVoices}
          />
        )}

        {/* Library View */}
        {activeTab === 'library' && (
          <AudioLibrary
            clips={clips}
            activeClipId={activeClip?.id ?? null}
            onSelectClip={(clip) => setActiveClip(clip)}
            onDeleteClip={handleDeleteClip}
          />
        )}
      </main>

      {/* PWA Install Banner & Modal */}
      <InstallPrompt
        showBanner={showBanner}
        showInstallModal={showInstallModal}
        isIOS={isIOS}
        hasNativePrompt={hasNativePrompt}
        onTriggerInstall={triggerInstall}
        onConfirmStandaloneInstall={confirmStandaloneInstall}
        onDismissBanner={dismissBanner}
        onCloseModal={() => setShowInstallModal(false)}
      />
    </div>
  );
}
