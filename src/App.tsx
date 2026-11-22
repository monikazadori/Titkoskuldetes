/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CluesView } from './components/CluesView';
import { HomeView } from './components/HomeView';
import { OverviewDoorsView } from './components/OverviewDoorsView';
import { SnowfallOverlay } from './components/SnowfallOverlay';
import { TeacherPanelModal } from './components/TeacherPanelModal';
import { TeamsView } from './components/TeamsView';
import { TopBar } from './components/TopBar';
import { MissionDec01 } from './components/missions/MissionDec01';
import { MissionNov25 } from './components/missions/MissionNov25';
import { MissionNov26 } from './components/missions/MissionNov26';
import { MissionNov27 } from './components/missions/MissionNov27';
import { MissionNov30 } from './components/missions/MissionNov30';
import {
  AppView,
  AudioPreferences,
  GameProgress,
  MissionId,
  TeacherSettings,
  TeamId,
} from './types/game';
import { soundEngine } from './utils/soundEngine';
import {
  clearAllMissionStates,
  clearMissionState,
  createDefaultProgress,
  isMissionUnlocked,
  loadAudioPreferences,
  loadProgress,
  loadTeacherSettings,
  markMissionReplayRequested,
  saveAudioPreferences,
  saveProgress,
  saveTeacherSettings,
} from './utils/storage';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [activeMissionId, setActiveMissionId] = useState<MissionId>('nov-25');

  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(() =>
    loadTeacherSettings()
  );
  const [audioPrefs, setAudioPrefs] = useState<AudioPreferences>(() =>
    loadAudioPreferences()
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [missionSessionKey, setMissionSessionKey] = useState(0);
  const footerTapCountRef = useRef(0);
  const footerTapTimerRef = useRef<number | null>(null);

  // Sync sound engine with stored preferences
  useEffect(() => {
    soundEngine.setSfxEnabled(audioPrefs.sfxEnabled);
    soundEngine.setMusicEnabled(audioPrefs.musicEnabled);
    saveAudioPreferences(audioPrefs);
  }, [audioPrefs]);

  // Persist progress and teacher settings
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveTeacherSettings(teacherSettings);
  }, [teacherSettings]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Hidden teacher access: Ctrl+Shift+T or Alt+T or #tanito / ?tanito=1
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
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') || (e.altKey && e.key.toLowerCase() === 't')) {
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

  const handleStartMission = (missionId: MissionId) => {
    if (!isMissionUnlocked(missionId, teacherSettings, progress)) {
      setView('overview');
      return;
    }
    soundEngine.playClick();
    setActiveMissionId(missionId);
    setView('mission');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteMission = (missionId: MissionId) => {
    setProgress((prev) => {
      const completed = prev.completedMissions.includes(missionId)
        ? prev.completedMissions
        : [...prev.completedMissions, missionId];
      return {
        ...prev,
        completedMissions: completed,
        finalRevealUnlocked:
          missionId === 'dec-01' ? true : prev.finalRevealUnlocked,
      };
    });
  };

  const handleTeamSolved = (missionId: MissionId, teamId: TeamId) => {
    setProgress((prev) => {
      const current = prev.teamCheckpoints[missionId] ?? [];
      if (current.includes(teamId)) return prev;
      return {
        ...prev,
        teamCheckpoints: {
          ...prev.teamCheckpoints,
          [missionId]: [...current, teamId],
        },
      };
    });
  };

  const handleToggleMissionCompleted = (missionId: MissionId) => {
    clearMissionState(missionId);
    setMissionSessionKey((prev) => prev + 1);
    setProgress((prev) => {
      const exists = prev.completedMissions.includes(missionId);
      const nextCompleted = exists
        ? prev.completedMissions.filter((id) => id !== missionId)
        : [...prev.completedMissions, missionId];
      const nextCheckpoints = { ...prev.teamCheckpoints };
      if (exists) {
        delete nextCheckpoints[missionId];
      }
      return {
        ...prev,
        completedMissions: nextCompleted,
        teamCheckpoints: nextCheckpoints,
        finalRevealUnlocked:
          missionId === 'dec-01' ? !exists : prev.finalRevealUnlocked,
      };
    });
  };

  const handleResetProgress = () => {
    clearAllMissionStates();
    const freshProgress = createDefaultProgress();
    saveProgress(freshProgress);
    setProgress(freshProgress);
    setMissionSessionKey((prev) => prev + 1);
    setView('home');
  };

  const handleRestartMission = (missionId: MissionId) => {
    const wasCompleted = progress.completedMissions.includes(missionId);

    if (wasCompleted) {
      // Preserve the earned golden seal, clue, and other days' results; reset only this mission's tasks/answers/hints/locks
      markMissionReplayRequested(missionId);
    } else {
      clearMissionState(missionId);
      setProgress((prev) => {
        const nextCheckpoints = { ...prev.teamCheckpoints };
        delete nextCheckpoints[missionId];
        return {
          ...prev,
          teamCheckpoints: nextCheckpoints,
        };
      });
    }

    setMissionSessionKey((prev) => prev + 1);
    if (isMissionUnlocked(missionId, teacherSettings, progress)) {
      setActiveMissionId(missionId);
      setView('mission');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Discreet 5-tap footer gesture for interactive whiteboard teacher access
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

  const renderActiveMission = () => {
    if (!isMissionUnlocked(activeMissionId, teacherSettings, progress)) {
      return (
        <OverviewDoorsView
          progress={progress}
          settings={teacherSettings}
          onStartMission={handleStartMission}
        />
      );
    }

    const alreadyCompleted = progress.completedMissions.includes(activeMissionId);

    switch (activeMissionId) {
      case 'nov-25':
        return (
          <MissionNov25
            key={`nov-25-${missionSessionKey}`}
            alreadyCompleted={alreadyCompleted}
            onComplete={() => handleCompleteMission('nov-25')}
            onTeamSolved={(teamId) => handleTeamSolved('nov-25', teamId)}
            onBackToOverview={() => handleNavigate('overview')}
            onGoToClues={() => handleNavigate('clues')}
          />
        );
      case 'nov-26':
        return (
          <MissionNov26
            key={`nov-26-${missionSessionKey}`}
            alreadyCompleted={alreadyCompleted}
            onComplete={() => handleCompleteMission('nov-26')}
            onTeamSolved={(teamId) => handleTeamSolved('nov-26', teamId)}
            onBackToOverview={() => handleNavigate('overview')}
            onGoToClues={() => handleNavigate('clues')}
          />
        );
      case 'nov-27':
        return (
          <MissionNov27
            key={`nov-27-${missionSessionKey}`}
            alreadyCompleted={alreadyCompleted}
            onComplete={() => handleCompleteMission('nov-27')}
            onTeamSolved={(teamId) => handleTeamSolved('nov-27', teamId)}
            onBackToOverview={() => handleNavigate('overview')}
            onGoToClues={() => handleNavigate('clues')}
          />
        );
      case 'nov-30':
        return (
          <MissionNov30
            key={`nov-30-${missionSessionKey}`}
            alreadyCompleted={alreadyCompleted}
            onComplete={() => handleCompleteMission('nov-30')}
            onTeamSolved={(teamId) => handleTeamSolved('nov-30', teamId)}
            onBackToOverview={() => handleNavigate('overview')}
            onGoToClues={() => handleNavigate('clues')}
          />
        );
      case 'dec-01':
        return (
          <MissionDec01
            key={`dec-01-${missionSessionKey}`}
            alreadyCompleted={alreadyCompleted}
            onComplete={() => handleCompleteMission('dec-01')}
            onTeamSolved={(teamId) => handleTeamSolved('dec-01', teamId)}
            onBackToOverview={() => handleNavigate('overview')}
          />
        );
    }
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
        {view === 'mission' && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => handleNavigate('overview')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vissza az öt varázsajtóhoz</span>
            </button>
          </div>
        )}

        {view === 'home' && (
          <HomeView
            progress={progress}
            settings={teacherSettings}
            audioPrefs={audioPrefs}
            onToggleSfx={() =>
              setAudioPrefs((prev) => ({ ...prev, sfxEnabled: !prev.sfxEnabled }))
            }
            onToggleMusic={() =>
              setAudioPrefs((prev) => ({ ...prev, musicEnabled: !prev.musicEnabled }))
            }
            onStartMission={handleStartMission}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'overview' && (
          <OverviewDoorsView
            progress={progress}
            settings={teacherSettings}
            onStartMission={handleStartMission}
          />
        )}

        {view === 'teams' && <TeamsView progress={progress} />}

        {view === 'clues' && (
          <CluesView progress={progress} settings={teacherSettings} />
        )}

        {view === 'mission' && renderActiveMission()}
      </main>

      <footer className="relative z-20 border-t border-white/10 bg-[#081324]/90 py-5 text-center text-sm text-slate-400">
        <button
          type="button"
          onClick={handleFooterSecretTap}
          className="select-none cursor-default hover:text-slate-300 transition-colors"
        >
          A 3. b titkos téli küldetése · Közös nyomozás
        </button>
      </footer>

      <TeacherPanelModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        settings={teacherSettings}
        progress={progress}
        onUpdateSettings={setTeacherSettings}
        onResetProgress={handleResetProgress}
        onToggleMissionCompleted={handleToggleMissionCompleted}
        onTestMission={(missionId) => {
          setActiveMissionId(missionId);
          setView('mission');
        }}
        onRestartMission={handleRestartMission}
      />
    </div>
  );
}
