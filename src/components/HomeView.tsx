import React from 'react';
import { ArrowRight, Compass, Music, Volume2, VolumeX } from 'lucide-react';
import { MISSIONS } from '../data/missions';
import { AppView, AudioPreferences, GameProgress, MissionId, TeacherSettings } from '../types/game';
import { canShowFinalSurprise, isMissionUnlocked } from '../utils/storage';
import { CastleFiveDoors } from './CastleFiveDoors';
import { CsillagManoGuide } from './CsillagManoGuide';
import { GoldenSealBadge } from './GoldenSealBadge';

interface HomeViewProps {
  progress: GameProgress;
  settings: TeacherSettings;
  audioPrefs: AudioPreferences;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onStartMission: (missionId: MissionId) => void;
  onNavigate: (view: AppView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  progress,
  settings,
  audioPrefs,
  onToggleSfx,
  onToggleMusic,
  onStartMission,
  onNavigate,
}) => {
  const earnedCount = progress.completedMissions.length;
  const showFinal = canShowFinalSurprise(settings, progress);

  const nextMission =
    MISSIONS.find(
      (m) =>
        isMissionUnlocked(m.id, settings, progress) &&
        !progress.completedMissions.includes(m.id)
    ) ??
    MISSIONS.find((m) => isMissionUnlocked(m.id, settings, progress)) ??
    MISSIONS[0];

  const nextUnlocked = isMissionUnlocked(nextMission.id, settings, progress);

  const handlePrimaryStart = () => {
    if (nextUnlocked) {
      onStartMission(nextMission.id);
    } else {
      onNavigate('overview');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero + Five Interactive Castle Doors */}
      <section className="space-y-6 rounded-3xl border border-amber-300/20 bg-[#122643]/90 p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-sm font-semibold tracking-wide text-amber-300">
              3. b osztály · Szigorúan titkos téli nyomozás
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white [text-wrap:balance]">
              A 3. b titkos téli küldetése – Az öt varázspecsét
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-slate-200">
              A Titkok Őrzője különleges meglepetéssel készül a 3. b osztálynak! A választ öt
              lezárt varázsajtó és öt aranypecsét őrzi a havas kastélyban.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrimaryStart}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-red-950/50 hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>
                  {showFinal
                    ? 'A nagy leleplezés megtekintése'
                    : nextUnlocked
                    ? `Indulás: ${nextMission.shortDate} küldetés`
                    : 'Öt varázsajtó megtekintése'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/35 bg-white/5 px-5 py-3.5 text-base font-semibold text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Compass className="w-5 h-5 text-amber-300" />
                <span>Öt nap áttekintése</span>
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
          progress={progress}
          settings={settings}
          onStartMission={onStartMission}
        />
      </section>

      {/* Csillag welcome */}
      <CsillagManoGuide
        speakerLabel="Csillag, a Titkok Őrzőjének segítője üzeni"
        message={
          earnedCount === 0
            ? 'Szervusztok, 3. b osztály! Én vagyok Csillag. A Titkok Őrzője öt napon át próbák elé állít benneteket. Ha ügyesen összefogtok az öt csapattal, minden nap végén egy varázspecsét és egy újabb nyom lesz a tiétek!'
            : earnedCount < 5
            ? `Szép munka, nyomozók! Már ${earnedCount} varázspecsét ragyog a gyűjteményetekben. Nyissátok ki a következő elérhető varázsajtót, vagy nézzétek át az összegyűjtött nyomokat!`
            : 'Hurrá, mind az öt varázspecsét a tiétek! Nézzétek meg együtt a nagy leleplezést az ötödik küldetés végén vagy a Nyomok oldalon!'
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
              Minden teljesített küldetés egy újabb pecséttel visz közelebb a titok megfejtéséhez.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="text-base font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer self-start sm:self-auto"
          >
            Mind az öt ajtó megnyitása →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MISSIONS.map((mission) => {
            const completed = progress.completedMissions.includes(mission.id);
            const unlocked = isMissionUnlocked(mission.id, settings, progress);
            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => (unlocked ? onStartMission(mission.id) : onNavigate('overview'))}
                className={`flex flex-col items-center text-center rounded-2xl border p-5 transition-all cursor-pointer ${
                  completed
                    ? 'border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/15'
                    : unlocked
                    ? 'border-sky-300/35 bg-white/5 hover:bg-white/10'
                    : 'border-white/10 bg-[#0D1E36]/70 opacity-80 hover:opacity-100'
                }`}
              >
                <GoldenSealBadge number={mission.dayNumber} unlocked={completed} size="md" />
                <p className="mt-3 text-xs font-semibold text-amber-300">
                  {mission.dateLabel}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-white leading-snug">
                  {mission.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {completed
                    ? 'Pecsét megszerezve'
                    : unlocked
                    ? 'Nyitva · Kattints ide!'
                    : 'Zárva · Várja a napját'}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
