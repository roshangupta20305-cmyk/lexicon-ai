import React from 'react';
import { Library, Mic, Sliders, Sparkles, WifiOff } from 'lucide-react';

export type WorkspaceTab = 'studio' | 'voices' | 'library';

interface PremiumHeaderProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  libraryCount: number;
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  onTriggerInstall: () => void;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  activeTab,
  onSelectTab,
  libraryCount,
  isInstallable,
  isInstalled,
  isOnline,
  onTriggerInstall,
}) => {
  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'studio', label: 'Studio', icon: Sliders },
    { id: 'voices', label: 'Voices', icon: Mic, badge: 12 },
    { id: 'library', label: 'Library', icon: Library, badge: libraryCount },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0F19]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo: Lexicon AI */}
          <button
            type="button"
            onClick={() => onSelectTab('studio')}
            className="group flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] p-[1px] shadow-lg shadow-[#4F46E5]/30 transition-transform duration-200 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0B0F19]/90">
                <Sparkles className="h-5 w-5 text-[#06B6D4]" />
              </div>
            </div>
            <div>
              <span className="bg-gradient-to-r from-[#FFFFFF] via-[#93C5FD] to-[#06B6D4] bg-clip-text font-display text-lg font-extrabold tracking-tight text-transparent">
                Lexicon AI
              </span>
              <p className="hidden text-[11px] text-[#94A3B8] sm:block">
                Professional Voice Studio
              </p>
            </div>
          </button>

          {/* Clean Navigation: Studio | Voices | Library */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#3B82F6] text-white shadow-md shadow-[#4F46E5]/30'
                      : 'text-[#94A3B8] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && (
                    <span
                      className={`font-mono text-[10px] ${
                        isActive ? 'text-white/95 font-bold' : 'text-[#94A3B8]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Top Right: PWA Install Trigger */}
          <div className="flex items-center gap-2.5">
            {!isOnline && (
              <div className="flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#F59E0B]">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Offline Mode</span>
              </div>
            )}

            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={onTriggerInstall}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#3B82F6] to-[#06B6D4] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#4F46E5]/30 transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
              >
                <span>📱 Install App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (390x844 responsive) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-white/10 bg-[#0B0F19]/95 px-2 py-1.5 backdrop-blur-xl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex min-h-[48px] min-w-[80px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#4F46E5]/30 to-[#3B82F6]/30 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? 'text-[#06B6D4]' : 'text-[#94A3B8]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
