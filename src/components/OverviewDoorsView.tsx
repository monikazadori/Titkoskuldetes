import React, { useState } from 'react';
import { CheckCircle2, DoorOpen, Lock, Sparkles } from 'lucide-react';
import { ASSETS, MISSIONS } from '../data/missions';
import { GameProgress, MissionId, TeacherSettings } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { isMissionUnlocked } from '../utils/storage';
import { CsillagManoGuide } from './CsillagManoGuide';
import { GoldenSealBadge } from './GoldenSealBadge';

interface OverviewDoorsViewProps {
  progress: GameProgress;
  settings: TeacherSettings;
  onStartMission: (missionId: MissionId) => void;
}

export const OverviewDoorsView: React.FC<OverviewDoorsViewProps> = ({
  progress,
  settings,
  onStartMission,
}) => {
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const handleDoorClick = (missionId: MissionId) => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    const unlocked = isMissionUnlocked(missionId, settings, progress);

    if (unlocked) {
      soundEngine.playClick();
      setLockedNotice(null);
      onStartMission(missionId);
    } else {
      soundEngine.playGentleHint();
      setLockedNotice(
        `A(z) ${mission.dayNumber}. varázsajtó (${mission.dateLabel}) még zárva van! Ez a küldetés ${mission.dateLabel.toLowerCase()} napon nyílik meg az osztálynak.`
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Hall Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/25 bg-[#122643]">
        <div className="h-56 sm:h-72 w-full">
          <img
            src={ASSETS.magicalDoorsHall}
            alt="Öt varázslatos ajtó a havas kastély nagytermében"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="bg-gradient-to-t from-[#0B192C] via-[#0B192C]/85 to-transparent p-6 sm:p-8 sm:absolute sm:inset-x-0 sm:bottom-0">
          <p className="text-sm font-semibold text-amber-300">
            Öt nap · Öt küldetés · Öt arany varázspecsét
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
            A havas kastély öt varázsajtaja
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-200">
            Minden megjelölt napon kinyílik egy újabb ajtó. A már teljesített ajtók mögötti
            feladatokat később is bármikor újrajátszhatjátok.
          </p>
        </div>
      </section>

      {lockedNotice && (
        <CsillagManoGuide
          speakerLabel="Türelem, kis nyomozók!"
          message={lockedNotice}
          tone="hint"
        />
      )}

      {/* 5 Doors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {MISSIONS.map((mission) => {
          const unlocked = isMissionUnlocked(mission.id, settings, progress);
          const completed = progress.completedMissions.includes(mission.id);

          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => handleDoorClick(mission.id)}
              className={`group flex flex-col justify-between text-left rounded-3xl border p-6 transition-all cursor-pointer min-h-[320px] ${
                completed
                  ? 'border-emerald-400/50 bg-[#12332B]/90 hover:-translate-y-1 shadow-lg shadow-emerald-950/30'
                  : unlocked
                  ? 'border-amber-400/60 bg-[#152E52] hover:-translate-y-1 shadow-lg shadow-amber-950/30'
                  : 'border-white/10 bg-[#0E1E36]/85 hover:border-white/25'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-amber-300 tabular-nums">
                    {mission.dayNumber}. nap · {mission.shortDate}
                  </span>
                  {completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
                  ) : unlocked ? (
                    <DoorOpen className="w-6 h-6 text-amber-300 shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </div>

                {/* Archway graphic */}
                <div
                  className="mt-5 mx-auto flex h-28 w-24 flex-col items-center justify-center rounded-t-full border-2 shadow-inner transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: unlocked ? mission.doorColor : '#1E293B',
                    borderColor: completed ? '#34D399' : unlocked ? '#FBBF24' : '#475569',
                  }}
                >
                  <GoldenSealBadge number={mission.dayNumber} unlocked={completed} size="sm" />
                </div>

                <h2 className="mt-5 font-display text-xl font-bold text-white leading-snug">
                  {mission.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {mission.subtitle}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-sm font-bold">
                {completed ? (
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Teljesítve (Újrajátszás)
                  </span>
                ) : unlocked ? (
                  <span className="text-amber-300">Ajtó kinyitása →</span>
                ) : (
                  <span className="text-slate-400">Nyitás: {mission.dateLabel}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
