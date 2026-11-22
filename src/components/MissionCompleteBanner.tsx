import React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { MISSIONS } from '../data/missions';
import { MissionId } from '../types/game';
import { GoldenSealBadge } from './GoldenSealBadge';

interface MissionCompleteBannerProps {
  missionId: MissionId;
  onBackToOverview: () => void;
  onGoToClues: () => void;
  onReplay?: () => void;
}

export const MissionCompleteBanner: React.FC<MissionCompleteBannerProps> = ({
  missionId,
  onBackToOverview,
  onGoToClues,
  onReplay,
}) => {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return null;

  return (
    <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1A355B] to-[#10233E] p-8 sm:p-10 text-center shadow-2xl">
      <div className="mx-auto flex justify-center">
        <GoldenSealBadge number={mission.dayNumber} unlocked size="lg" />
      </div>

      <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300">
        <Sparkles className="w-4 h-4" />
        <span>Küldetés sikeresen teljesítve!</span>
      </p>

      <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
        Megszereztétek a(z) {mission.sealTitle.toLowerCase()}et!
      </h2>

      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-300/40 bg-[#FFF8EB] p-6 text-[#1E1B18] shadow-inner">
        <p className="text-xs font-bold uppercase tracking-wider text-red-700">
          Új titkos nyom a 3. b osztálynak
        </p>
        <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#1E1B18]">
          „{mission.clueText}”
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={onGoToClues}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 text-base font-bold text-[#0B192C] hover:bg-amber-300 transition-colors cursor-pointer"
        >
          <span>Nyomfüzet megtekintése</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-500/15 px-6 py-4 text-base font-semibold text-amber-100 hover:bg-amber-500/25 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Küldetés újrajátszása</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Vissza az öt varázsajtóhoz</span>
        </button>
      </div>
    </div>
  );
};
