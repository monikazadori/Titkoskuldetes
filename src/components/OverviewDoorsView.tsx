import React, { useState } from 'react';
import { CheckCircle2, DoorOpen, Lock, MailOpen, Sparkles } from 'lucide-react';
import { ASSETS, DOOR_ORDINALS, DOORS } from '../data/missions';
import { DoorId, OneDayGameState, TeacherSettings } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { isDoorUnlocked } from '../utils/storage';
import { CsillagManoGuide } from './CsillagManoGuide';
import { GoldenSealBadge } from './GoldenSealBadge';

interface OverviewDoorsViewProps {
  gameState: OneDayGameState;
  settings: TeacherSettings;
  onOpenDoor: (doorId: DoorId) => void;
  onGoToLetter: () => void;
}

export const OverviewDoorsView: React.FC<OverviewDoorsViewProps> = ({
  gameState,
  settings,
  onOpenDoor,
  onGoToLetter,
}) => {
  const [lockedNotice, setLockedNotice] = useState<{
    message: string;
    needsLetter: boolean;
  } | null>(null);

  const handleDoorClick = (doorId: DoorId) => {
    const door = DOORS.find((d) => d.id === doorId);
    if (!door) return;
    const unlocked = isDoorUnlocked(doorId, gameState, settings);

    if (unlocked) {
      soundEngine.playClick();
      setLockedNotice(null);
      onOpenDoor(doorId);
    } else {
      soundEngine.playGentleHint();
      if (door.doorNumber === 1 && !gameState.letterChallengeSolved) {
        setLockedNotice({
          message:
            'Előbb olvassátok el a titkos levelet, és válaszoljatok a két igaz–hamis kérdésre az 1. ajtó kinyitásához!',
          needsLetter: true,
        });
      } else {
        const currentOrd = DOOR_ORDINALS[door.doorNumber];
        const prevOrd = DOOR_ORDINALS[(door.doorNumber - 1) as 1 | 2 | 3 | 4 | 5];
        setLockedNotice({
          message: `${currentOrd.articleCap} varázsajtó még zárva van! Haladjatok sorban, és előbb teljesítsétek ${prevOrd.articleLower} ajtó játékát!`,
          needsLetter: false,
        });
      }
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
            Öt varázsajtó · Öt rövid játék · Öt arany varázspecsét
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
            A havas kastély öt varázsajtaja
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-200">
            Haladjatok sorban az ajtókon keresztül! Minden helyes megoldás után egy arany
            varázspecsét kerül a gyűjtőbe.
          </p>
        </div>
      </section>

      {lockedNotice && (
        <div className="space-y-3">
          <CsillagManoGuide
            speakerLabel="Sorban nyílnak az ajtók!"
            message={lockedNotice.message}
            tone="hint"
          />
          {lockedNotice.needsLetter && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onGoToLetter();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-base font-bold text-[#0B192C] hover:bg-amber-300 transition-colors cursor-pointer"
              >
                <MailOpen className="w-5 h-5" />
                <span>Titkos levél kinyitása</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5 Doors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {DOORS.map((door) => {
          const unlocked = isDoorUnlocked(door.id, gameState, settings);
          const completed = gameState.completedDoors.includes(door.id);

          return (
            <button
              key={door.id}
              type="button"
              onClick={() => handleDoorClick(door.id)}
              className={`group flex flex-col justify-between text-left rounded-3xl border p-6 transition-all cursor-pointer min-h-[310px] ${
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
                    {door.shortLabel}
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
                    backgroundColor: unlocked ? door.doorColor : '#1E293B',
                    borderColor: completed ? '#34D399' : unlocked ? '#FBBF24' : '#475569',
                  }}
                >
                  <GoldenSealBadge number={door.doorNumber} unlocked={completed} size="sm" />
                </div>

                <h2 className="mt-5 font-display text-xl font-bold text-white leading-snug">
                  {door.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {door.subtitle}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-sm font-bold">
                {completed ? (
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Megszerezve
                  </span>
                ) : unlocked ? (
                  <span className="text-amber-300">Ajtó kinyitása →</span>
                ) : (
                  <span className="text-slate-400">Előző ajtó után nyílik</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
