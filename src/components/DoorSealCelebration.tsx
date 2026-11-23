import React from 'react';
import { ArrowRight, Gift, Sparkles } from 'lucide-react';
import { DOOR_ORDINALS, DOORS } from '../data/missions';
import { DoorId } from '../types/game';
import { GoldenSealBadge } from './GoldenSealBadge';

interface DoorSealCelebrationProps {
  doorId: DoorId;
  onNextDoor: () => void;
}

export const DoorSealCelebration: React.FC<DoorSealCelebrationProps> = ({
  doorId,
  onNextDoor,
}) => {
  const door = DOORS.find((d) => d.id === doorId);
  if (!door) return null;

  const isLastDoor = door.doorNumber === 5;
  const currentOrdinal = DOOR_ORDINALS[door.doorNumber];
  const nextOrdinal = !isLastDoor
    ? DOOR_ORDINALS[(door.doorNumber + 1) as 1 | 2 | 3 | 4 | 5]
    : null;

  return (
    <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1A355B] to-[#10233E] p-8 sm:p-10 text-center shadow-2xl space-y-6">
      <div className="mx-auto flex justify-center animate-seal-pop">
        <GoldenSealBadge number={door.doorNumber} unlocked size="lg" />
      </div>

      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>Helyes megoldás · Pecsét megszerezve!</span>
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Megszereztétek {currentOrdinal.articleLower} arany varázspecsétet!
        </h2>
        <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto">
          {isLastDoor
            ? 'Mind az öt arany varázspecsét a gyűjteményetekbe került! Valami különleges vár rátok a kastélyban...'
            : `${currentOrdinal.articleCap} arany pecsét ragyog a gyűjtőben. Kinyílt ${nextOrdinal?.articleLower} varázsajtó!`}
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onNextDoor}
          className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] shadow-lg hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer"
        >
          {isLastDoor ? (
            <>
              <Gift className="w-6 h-6" />
              <span>Tovább a titkos ajándékdobozhoz!</span>
            </>
          ) : (
            <>
              <span>Következő ajtó</span>
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
