/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { GoldenSealBadge } from './components/GoldenSealBadge';
import { HomeView } from './components/HomeView';
import { LetterQuestView } from './components/LetterQuestView';
import { OverviewDoorsView } from './components/OverviewDoorsView';
import { SealsFinalView } from './components/SealsFinalView';
import { SnowfallOverlay } from './components/SnowfallOverlay';
import { TeacherPanelModal } from './components/TeacherPanelModal';
import { TopBar } from './components/TopBar';
import { Door1MissingItem } from './components/doors/Door1MissingItem';
import { Door2MagicNumber } from './components/doors/Door2MagicNumber';
import { Door3GoldenKey } from './components/doors/Door3GoldenKey';
import { Door4SecretMessage } from './components/doors/Door4SecretMessage';
import { Door5BellsSecret } from './components/doors/Door5BellsSecret';
import { DOORS } from './data/missions';
import {
  AppView,
  AudioPreferences,
  DoorId,
  OneDayGameState,
  TeacherSettings,
} from './types/game';
import { soundEngine } from './utils/soundEngine';
import {
  createDefaultTeacherSettings,
  isDoorUnlocked,
  loadAudioPreferences,
  loadGameState,
  loadNavigationState,
  loadTeacherSettings,
  resetAllGameStorage,
  saveAudioPreferences,
  saveGameState,
  saveNavigationState,
  saveTeacherSettings,
} from './utils/storage';

export default function App() {
  const [gameState, setGameState] = useState<OneDayGameState>(() => loadGameState());
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(() =>
    loadTeacherSettings()
  );
  const [audioPrefs, setAudioPrefs] = useState<AudioPreferences>(() =>
    loadAudioPreferences()
  );

  const [initialNav] = useState(() => {
    const savedNav = loadNavigationState();
    const loadedState = loadGameState();
    const loadedTeacher = loadTeacherSettings();
    if (
      savedNav.view === 'door' &&
      !isDoorUnlocked(savedNav.activeDoorId, loadedState, loadedTeacher)
    ) {
      return { view: 'doors' as AppView, activeDoorId: savedNav.activeDoorId };
    }
    return savedNav;
  });

  const [view, setView] = useState<AppView>(initialNav.view);
  const [activeDoorId, setActiveDoorId] = useState<DoorId>(initialNav.activeDoorId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const footerTapCountRef = useRef(0);
  const footerTapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    soundEngine.setSfxEnabled(audioPrefs.sfxEnabled);
    soundEngine.setMusicEnabled(audioPrefs.musicEnabled);
    saveAudioPreferences(audioPrefs);
  }, [audioPrefs]);

  const latestStateRef = useRef({ gameState, teacherSettings, view, activeDoorId });
  latestStateRef.current = { gameState, teacherSettings, view, activeDoorId };

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    saveTeacherSettings(teacherSettings);
  }, [teacherSettings]);

  useEffect(() => {
    saveNavigationState({ view, activeDoorId });
  }, [view, activeDoorId]);

  useEffect(() => {
    const flushState = () => {
      const {
        gameState: currentGame,
        teacherSettings: currentTeacher,
        view: currentView,
        activeDoorId: currentDoor,
      } = latestStateRef.current;
      saveGameState(currentGame);
      saveTeacherSettings(currentTeacher);
      saveNavigationState({ view: currentView, activeDoorId: currentDoor });
    };
    window.addEventListener('pagehide', flushState);
    window.addEventListener('beforeunload', flushState);
    return () => {
      window.removeEventListener('pagehide', flushState);
      window.removeEventListener('beforeunload', flushState);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Hidden teacher access: Ctrl+Shift+T, Alt+T, #tanito, ?tanito=1, or 5 taps on footer
  useEffect(() => {
    const checkHashOrQuery = () => {
      if (
        window.location.hash === '#tanito' ||
        new URLSearchParams(window.location.search).get('tanito') === '1'
      ) {
        setTeacherModalOpen(true);
      }
    };
    checkHashOrQuery();
    window.addEventListener('hashchange', checkHashOrQuery);

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') ||
        (e.altKey && e.key.toLowerCase() === 't')
      ) {
        e.preventDefault();
        setTeacherModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHashOrQuery);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const handleNavigate = (nextView: AppView) => {
    soundEngine.playClick();
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDoor = (doorId: DoorId) => {
    if (!isDoorUnlocked(doorId, gameState, teacherSettings)) {
      setView('doors');
      return;
    }
    soundEngine.playClick();
    setActiveDoorId(doorId);
    setView('door');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markDoorCompleted = (doorId: DoorId) => {
    setGameState((prev) => {
      if (prev.completedDoors.includes(doorId)) return prev;
      return {
        ...prev,
        completedDoors: [...prev.completedDoors, doorId],
      };
    });
  };

  const handleCheckLetterTf = () => {
    const { tf1Answer, tf2Answer } = gameState;
    if (tf1Answer === null || tf2Answer === null) {
      soundEngine.playGentleHint();
      setGameState((prev) => ({
        ...prev,
        tfHint: 'Válaszoljatok mindkét igaz–hamis kérdésre közösen!',
      }));
      return;
    }

    if (tf1Answer === true && tf2Answer === false) {
      soundEngine.playSealUnlock();
      setGameState((prev) => ({
        ...prev,
        letterChallengeSolved: true,
        tfHint: null,
      }));
    } else {
      soundEngine.playGentleHint();
      setGameState((prev) => ({
        ...prev,
        tfHint:
          'Olvassátok el újra a levelet! Öt varázspecsét kell a megfejtéshez, és nem versenyezve, hanem együtt gondolkodva kell megszerezni őket!',
      }));
    }
  };

  const handleResetFullGame = () => {
    const fresh = resetAllGameStorage();
    setTeacherSettings(createDefaultTeacherSettings());
    setGameState(fresh);
    setActiveDoorId('door-1');
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFooterSecretTap = () => {
    footerTapCountRef.current += 1;
    if (footerTapTimerRef.current) {
      window.clearTimeout(footerTapTimerRef.current);
    }
    if (footerTapCountRef.current >= 5) {
      footerTapCountRef.current = 0;
      setTeacherModalOpen(true);
      return;
    }
    footerTapTimerRef.current = window.setTimeout(() => {
      footerTapCountRef.current = 0;
    }, 2500);
  };

  const renderActiveDoor = () => {
    if (!isDoorUnlocked(activeDoorId, gameState, teacherSettings)) {
      return (
        <OverviewDoorsView
          gameState={gameState}
          settings={teacherSettings}
          onOpenDoor={handleOpenDoor}
          onGoToLetter={() => handleNavigate('letter')}
        />
      );
    }

    const activeDoorMeta = DOORS.find((d) => d.id === activeDoorId) ?? DOORS[0];

    return (
      <div className="space-y-6">
        {/* Door Header & Live Seals Collector */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {activeDoorMeta.shortLabel}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {activeDoorMeta.title}
            </h1>
          </div>

          <div className="flex items-center gap-2" aria-label="Összegyűjtött varázspecsétek">
            {DOORS.map((d) => (
              <GoldenSealBadge
                key={d.id}
                number={d.doorNumber}
                unlocked={gameState.completedDoors.includes(d.id)}
                size="sm"
              />
            ))}
          </div>
        </div>

        {activeDoorId === 'door-1' && (
          <Door1MissingItem
            state={gameState.door1}
            onUpdate={(next) => setGameState((prev) => ({ ...prev, door1: next }))}
            onSolve={() => markDoorCompleted('door-1')}
            onNextDoor={() => handleOpenDoor('door-2')}
          />
        )}

        {activeDoorId === 'door-2' && (
          <Door2MagicNumber
            state={gameState.door2}
            onUpdate={(next) => setGameState((prev) => ({ ...prev, door2: next }))}
            onSolve={() => markDoorCompleted('door-2')}
            onNextDoor={() => handleOpenDoor('door-3')}
          />
        )}

        {activeDoorId === 'door-3' && (
          <Door3GoldenKey
            state={gameState.door3}
            onUpdate={(next) => setGameState((prev) => ({ ...prev, door3: next }))}
            onSolve={() => markDoorCompleted('door-3')}
            onNextDoor={() => handleOpenDoor('door-4')}
          />
        )}

        {activeDoorId === 'door-4' && (
          <Door4SecretMessage
            state={gameState.door4}
            onUpdate={(next) => setGameState((prev) => ({ ...prev, door4: next }))}
            onSolve={() => markDoorCompleted('door-4')}
            onNextDoor={() => handleOpenDoor('door-5')}
          />
        )}

        {activeDoorId === 'door-5' && (
          <Door5BellsSecret
            state={gameState.door5}
            onUpdate={(next) => setGameState((prev) => ({ ...prev, door5: next }))}
            onSolve={() => markDoorCompleted('door-5')}
            onNextDoor={() => handleNavigate('seals')}
          />
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#0B192C] via-[#0E223D] to-[#081324] text-slate-100">
      <SnowfallOverlay />

      <TopBar
        activeView={view}
        onNavigate={handleNavigate}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <main className="relative z-20 mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8 sm:py-10">
        {view === 'door' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => handleNavigate('doors')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vissza az öt varázsajtóhoz</span>
            </button>
          </div>
        )}

        {view === 'home' && (
          <HomeView
            gameState={gameState}
            settings={teacherSettings}
            audioPrefs={audioPrefs}
            onToggleSfx={() =>
              setAudioPrefs((prev) => ({ ...prev, sfxEnabled: !prev.sfxEnabled }))
            }
            onToggleMusic={() =>
              setAudioPrefs((prev) => ({ ...prev, musicEnabled: !prev.musicEnabled }))
            }
            onOpenDoor={handleOpenDoor}
            onNavigate={handleNavigate}
            onResetFullGame={handleResetFullGame}
          />
        )}

        {view === 'letter' && (
          <LetterQuestView
            gameState={gameState}
            onOpenLetter={() =>
              setGameState((prev) => ({ ...prev, letterOpened: true }))
            }
            onSelectTf1={(val) =>
              setGameState((prev) => ({ ...prev, tf1Answer: val, tfHint: null }))
            }
            onSelectTf2={(val) =>
              setGameState((prev) => ({ ...prev, tf2Answer: val, tfHint: null }))
            }
            onCheckAnswers={handleCheckLetterTf}
            onEnterDoor1={() => handleOpenDoor('door-1')}
            onBackToDoors={() => handleNavigate('doors')}
          />
        )}

        {view === 'doors' && (
          <OverviewDoorsView
            gameState={gameState}
            settings={teacherSettings}
            onOpenDoor={handleOpenDoor}
            onGoToLetter={() => handleNavigate('letter')}
          />
        )}

        {view === 'seals' && (
          <SealsFinalView
            gameState={gameState}
            onOpenGiftBox={() =>
              setGameState((prev) => ({ ...prev, giftBoxOpened: true }))
            }
            onRevealSecondPhoto={() =>
              setGameState((prev) => ({ ...prev, secondPhotoRevealed: true }))
            }
            onGoToDoors={() => handleNavigate('doors')}
          />
        )}

        {view === 'door' && renderActiveDoor()}
      </main>

      <footer className="relative z-20 border-t border-white/10 bg-[#081324]/90 py-5 text-center text-sm text-slate-400">
        <button
          type="button"
          onClick={handleFooterSecretTap}
          className="select-none cursor-default hover:text-slate-300 transition-colors"
        >
          A 3. b titkos téli küldetése · Közös osztálykaland
        </button>
      </footer>

      <TeacherPanelModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        settings={teacherSettings}
        gameState={gameState}
        onUpdateSettings={setTeacherSettings}
        onResetFullGame={handleResetFullGame}
        onTestDoor={(doorId) => {
          setActiveDoorId(doorId);
          setView('door');
        }}
        onTestLetter={() => {
          setView('letter');
        }}
      />
    </div>
  );
}
