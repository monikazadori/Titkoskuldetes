import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Gift,
  MailOpen,
  Music,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { DOORS } from '../data/missions';
import {
  AppView,
  AudioPreferences,
  DoorId,
  OneDayGameState,
  TeacherSettings,
} from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { canShowFinalSurprise, canShowGiftBox, isDoorUnlocked } from '../utils/storage';
import { CastleFiveDoors } from './CastleFiveDoors';
import { CsillagManoGuide } from './CsillagManoGuide';
import { GoldenSealBadge } from './GoldenSealBadge';

interface HomeViewProps {
  gameState: OneDayGameState;
  settings: TeacherSettings;
  audioPrefs: AudioPreferences;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onOpenDoor: (doorId: DoorId) => void;
  onNavigate: (view: AppView) => void;
  onResetFullGame: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  gameState,
  settings,
  audioPrefs,
  onToggleSfx,
  onToggleMusic,
  onOpenDoor,
  onNavigate,
  onResetFullGame,
}) => {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (!confirmResetOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmResetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmResetOpen]);
  const earnedCount = gameState.completedDoors.length;
  const giftReady = canShowGiftBox(gameState);
  const finalRevealed = canShowFinalSurprise(gameState);

  const nextDoor =
    DOORS.find(
      (d) =>
        isDoorUnlocked(d.id, gameState, settings) &&
        !gameState.completedDoors.includes(d.id)
    ) ?? DOORS[0];

  const handlePrimaryStart = () => {
    if (!gameState.letterChallengeSolved) {
      onNavigate('letter');
    } else if (giftReady) {
      onNavigate('seals');
    } else if (isDoorUnlocked(nextDoor.id, gameState, settings)) {
      onOpenDoor(nextDoor.id);
    } else {
      onNavigate('doors');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero + Five Interactive Castle Doors */}
      <section className="space-y-6 rounded-3xl border border-amber-300/20 bg-[#122643]/90 p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-sm font-semibold tracking-wide text-amber-300">
              3. b osztály · Közös téli osztálykaland
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white [text-wrap:balance]">
              A 3. b titkos téli küldetése – Az öt varázspecsét
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-slate-200">
              A Titkok Őrzője különleges meglepetéssel készül a 3. b osztálynak! A választ öt
              varázsajtó és öt aranypecsét őrzi a havas kastélyban.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrimaryStart}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-red-950/50 hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer"
              >
                {!gameState.letterChallengeSolved ? (
                  <>
                    <MailOpen className="w-5 h-5" />
                    <span>Titkos levél kinyitása</span>
                  </>
                ) : giftReady ? (
                  <>
                    <Gift className="w-5 h-5" />
                    <span>
                      {finalRevealed
                        ? 'A nagy meglepetés megtekintése'
                        : 'Titkos ajándékdoboz megnyitása!'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Tovább: {nextDoor.shortLabel}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('doors')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/35 bg-white/5 px-5 py-3.5 text-base font-semibold text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Compass className="w-5 h-5 text-amber-300" />
                <span>Öt varázsajtó</span>
              </button>
            </div>

            {/* Classroom audio controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleSfx}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  audioPrefs.sfxEnabled
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                    : 'border-white/15 bg-white/5 text-slate-300'
                }`}
              >
                {audioPrefs.sfxEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span>Hanghatások: {audioPrefs.sfxEnabled ? 'Be' : 'Ki'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleMusic}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  audioPrefs.musicEnabled
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                    : 'border-white/15 bg-white/5 text-slate-300'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Háttérzene: {audioPrefs.musicEnabled ? 'Be' : 'Ki'}</span>
              </button>
            </div>
          </div>
        </div>

        <CastleFiveDoors
          gameState={gameState}
          settings={settings}
          onOpenDoor={onOpenDoor}
          onGoToLetter={() => onNavigate('letter')}
        />
      </section>

      {/* Csillag welcome */}
      <CsillagManoGuide
        speakerLabel="Csillag, a Titkok Őrzőjének segítője üzeni"
        message={
          !gameState.letterChallengeSolved
            ? 'Szervusztok, 3. b osztály! Én vagyok Csillag. Először nyissátok ki a Titkok Őrzőjének levelét és válaszoljatok a két kérdésre, hogy feltáruljon az első varázsajtó!'
            : earnedCount < 5
            ? `Szép munka, nyomozók! Már ${earnedCount} arany varázspecsét ragyog a gyűjtőtökben. Haladjatok sorban a következő nyitott varázsajtón át!`
            : 'Hurrá, mind az öt arany varázspecsétet megszereztétek! Nyissátok ki együtt a titkos ajándékdobozt a Varázspecsétek oldalon!'
        }
      />

      {/* Five Seals Shelf */}
      <section className="rounded-3xl border border-white/10 bg-[#122643]/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Az öt arany varázspecsét
            </h2>
            <p className="mt-1 text-base text-slate-300">
              Minden megoldott ajtó után egy újabb arany varázspecsét kerül a gyűjtőbe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('seals')}
            className="text-base font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer self-start sm:self-auto"
          >
            Pecsétgyűjtő megtekintése →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DOORS.map((door) => {
            const completed = gameState.completedDoors.includes(door.id);
            const unlocked = isDoorUnlocked(door.id, gameState, settings);
            return (
              <button
                key={door.id}
                type="button"
                onClick={() =>
                  unlocked
                    ? onOpenDoor(door.id)
                    : !gameState.letterChallengeSolved
                    ? onNavigate('letter')
                    : onNavigate('doors')
                }
                className={`flex flex-col items-center text-center rounded-2xl border p-5 transition-all cursor-pointer ${
                  completed
                    ? 'border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/15'
                    : unlocked
                    ? 'border-sky-300/35 bg-white/5 hover:bg-white/10'
                    : 'border-white/10 bg-[#0D1E36]/70 opacity-80 hover:opacity-100'
                }`}
              >
                <GoldenSealBadge number={door.doorNumber} unlocked={completed} size="md" />
                <p className="mt-3 text-xs font-semibold text-amber-300">
                  {door.shortLabel}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-white leading-snug">
                  {door.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {completed
                    ? 'Pecsét megszerezve'
                    : unlocked
                    ? 'Nyitva · Kattints ide!'
                    : 'Még zárva'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Visible Teacher Reset button directly under "Az öt arany varázspecsét" */}
      <div className="flex justify-center pt-1 pb-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setConfirmResetOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/45 bg-[#122643]/95 px-6 py-3.5 text-base font-bold text-amber-100 shadow-lg hover:border-amber-300 hover:bg-[#19345B] active:scale-[0.98] transition-all cursor-pointer"
        >
          🔄 Tanítói újrakezdés
        </button>
      </div>

      {/* Confirmation dialog */}
      {confirmResetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-reset-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setConfirmResetOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-amber-300/40 bg-[#0F213B] p-6 sm:p-8 text-slate-100 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/15 text-rose-300">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h2
                  id="home-reset-dialog-title"
                  className="font-display text-xl sm:text-2xl font-bold text-amber-200"
                >
                  Teljes játék újrakezdése
                </h2>
              </div>
              <button
                type="button"
                aria-label="Bezárás"
                onClick={() => setConfirmResetOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-base leading-relaxed text-slate-200">
              Biztosan alaphelyzetbe szeretnéd állítani a teljes játékot? A megerősítés után:
            </p>
            <ul className="space-y-1.5 rounded-2xl border border-white/10 bg-[#142B4C] p-4 text-sm text-slate-200 list-disc list-inside">
              <li>Törlődik mind az öt megszerzett pecsét (a számláló 0/5-re áll).</li>
              <li>Visszazáródik mind az öt varázsajtó és törlődik minden feladatmegoldás.</li>
              <li>Alaphelyzetbe áll a titkos levél és a két igaz–hamis kérdés.</li>
              <li>Elrejtőzik a Mikulásvonatos meglepetés is.</li>
            </ul>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setConfirmResetOpen(false);
                }}
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/15 cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setConfirmResetOpen(false);
                  onResetFullGame();
                }}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-rose-500 active:scale-[0.98] transition-all cursor-pointer"
              >
                Igen, újrakezdés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
