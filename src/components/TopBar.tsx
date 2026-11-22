import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { AppView } from '../types/game';

interface TopBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onNavigate,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'home', label: 'Kezdőlap' },
    { id: 'overview', label: 'Öt varázsajtó' },
    { id: 'teams', label: 'Csapatok' },
    { id: 'clues', label: 'Nyomok' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B192C]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-5 py-3.5">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-amber-100 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          A 3. b titkos téli küldetése
        </button>

        <nav
          aria-label="Fő navigáció"
          className="hidden md:flex items-center gap-7 text-base font-medium"
        >
          {navItems.map((item) => {
            const isActive =
              activeView === item.id ||
              (item.id === 'overview' && activeView === 'mission');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-amber-400 text-amber-200 font-semibold'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#0B192C] shadow-sm hover:bg-amber-300 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Kilépés a teljes képernyőből</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Teljes képernyő</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile / narrow whiteboard secondary nav */}
      <nav
        aria-label="Mobil navigáció"
        className="flex md:hidden items-center justify-around border-t border-white/10 px-3 py-2 text-sm font-medium"
      >
        {navItems.map((item) => {
          const isActive =
            activeView === item.id ||
            (item.id === 'overview' && activeView === 'mission');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'bg-amber-400/20 text-amber-200 font-bold' : 'text-slate-300'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
