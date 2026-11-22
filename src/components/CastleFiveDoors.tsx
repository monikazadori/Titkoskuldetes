import React, { useState } from 'react';
import { CheckCircle2, DoorOpen } from 'lucide-react';
import { ASSETS, MISSIONS } from '../data/missions';
import { GameProgress, MissionId, TeacherSettings } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { isMissionUnlocked } from '../utils/storage';

interface CastleFiveDoorsProps {
  progress: GameProgress;
  settings: TeacherSettings;
  onStartMission: (missionId: MissionId) => void;
}

const GoldenPadlockIcon: React.FC<{
  doorNumber: number;
  open?: boolean;
  active?: boolean;
}> = ({ doorNumber, open = false, active = false }) => {
  const gradId = `doorPadlockGold-${doorNumber}`;
  return (
    <svg
      viewBox="0 0 64 72"
      aria-hidden="true"
      className={`w-11 h-12 sm:w-12 sm:h-14 drop-shadow-[0_4px_10px_rgba(251,191,36,0.4)] transition-transform duration-300 ${
        active ? 'group-hover:scale-110' : ''
      }`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <path
        d="M20 30 V19 C20 10 44 10 44 19 V30"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="6.5"
        strokeLinecap="round"
        transform={open ? 'translate(0, -6)' : undefined}
      />
      <rect
        x="11"
        y="29"
        width="42"
        height="35"
        rx="8"
        fill={`url(#${gradId})`}
        stroke="#FFFBEB"
        strokeWidth="2"
      />
      <circle cx="32" cy="44" r="4.2" fill="#78350F" />
      <path d="M29.5 47 L34.5 47 L36 56 L28 56 Z" fill="#78350F" />
    </svg>
  );
};

export const CastleFiveDoors: React.FC<CastleFiveDoorsProps> = ({
  progress,
  settings,
  onStartMission,
}) => {
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const earnedCount = progress.completedMissions.length;

  const handleDoorPress = (missionId: MissionId) => {
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
        `A(z) ${mission.dayNumber}. titkos ajtó (${mission.dateLabel}) még zárva van! Ez a küldetés ${mission.dateLabel.toLowerCase()} napon nyílik meg az osztálynak.`
      );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-[#0B192C] p-5 sm:p-7 shadow-2xl">
      {/* Snowy enchanted castle backdrop */}
      <img
        src={ASSETS.workshopHero}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B192C]/75 via-[#102542]/85 to-[#0B192C]/95"
      />

      <div className="relative z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              A havas kastély bejárata · Öt lezárt varázsajtó
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-0.5">
              A kastély öt titkos ajtaja
            </h2>
          </div>
          <div className="rounded-xl border border-amber-300/35 bg-[#0B192C]/80 px-4 py-2 text-sm font-bold text-amber-200">
            {earnedCount} / 5 varázspecsét megszerezve
          </div>
        </div>

        {/* 5 Distinct Doors in clean non-overlapping grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {MISSIONS.map((mission) => {
            const unlocked = isMissionUnlocked(mission.id, settings, progress);
            const completed = progress.completedMissions.includes(mission.id);

            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => handleDoorPress(mission.id)}
                aria-label={`${mission.dayNumber}. ajtó – ${mission.dateLabel} – ${
                  completed ? 'Teljesítve' : unlocked ? 'Nyitva' : 'Zárva'
                }`}
                className={`group relative flex flex-col items-center justify-between rounded-2xl border-2 p-3 sm:p-4 text-center transition-all touch-manipulation cursor-pointer ${
                  completed
                    ? 'border-emerald-400/80 bg-[#102F28]/90 hover:-translate-y-1 shadow-lg shadow-emerald-950/40'
                    : unlocked
                    ? 'border-amber-400/85 bg-[#163159]/95 hover:-translate-y-1 shadow-lg shadow-amber-950/40'
                    : 'border-slate-500/40 bg-[#0D1E36]/90 hover:border-slate-400/60'
                }`}
              >
                {/* Number plaque 1-5 */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-display text-lg font-bold shadow ${
                    completed
                      ? 'border-emerald-300 bg-emerald-500 text-white'
                      : unlocked
                      ? 'border-amber-200 bg-amber-400 text-[#0B192C]'
                      : 'border-slate-400/60 bg-slate-700 text-amber-100'
                  }`}
                >
                  {mission.dayNumber}
                </div>

                {/* Arched Magic Door with EXACTLY ONE Golden Padlock */}
                <div
                  className="mt-3 flex h-32 sm:h-36 w-full max-w-[116px] flex-col items-center justify-center rounded-t-[52px] rounded-b-lg border-4 shadow-inner transition-transform group-hover:scale-[1.03]"
                  style={{
                    backgroundColor: completed
                      ? mission.doorColor
                      : unlocked
                      ? mission.doorColor
                      : '#1E293B',
                    borderColor: completed ? '#34D399' : unlocked ? '#FBBF24' : '#475569',
                  }}
                >
                  <GoldenPadlockIcon
                    doorNumber={mission.dayNumber}
                    open={completed}
                    active={unlocked}
                  />
                </div>

                {/* Date & status */}
                <div className="mt-3 w-full space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-amber-200 tabular-nums">
                    {mission.shortDate}
                  </p>
                  <p className="text-xs font-semibold text-white/90 line-clamp-1">
                    {mission.title}
                  </p>
                  <div className="pt-1 flex items-center justify-center gap-1 text-xs font-bold">
                    {completed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Teljesítve</span>
                      </span>
                    ) : unlocked ? (
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        <DoorOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>Nyitva</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Zárva</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {lockedNotice && (
          <div
            role="status"
            className="rounded-2xl border border-amber-400/50 bg-amber-950/75 px-4 py-3 text-center text-sm sm:text-base font-semibold text-amber-100"
          >
            {lockedNotice}
          </div>
        )}
      </div>
    </div>
  );
};
