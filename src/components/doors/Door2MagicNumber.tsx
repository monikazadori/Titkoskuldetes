import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Door2State } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { DoorSealCelebration } from '../DoorSealCelebration';

interface Door2MagicNumberProps {
  state: Door2State;
  onUpdate: (next: Door2State) => void;
  onSolve: () => void;
  onNextDoor: () => void;
}

const SEQUENCE = ['3', '6', '9', '?', '15'];
const OPTIONS = ['11', '12', '13'];

export const Door2MagicNumber: React.FC<Door2MagicNumberProps> = ({
  state,
  onUpdate,
  onSolve,
  onNextDoor,
}) => {
  if (state.solved) {
    return <DoorSealCelebration doorId="door-2" onNextDoor={onNextDoor} />;
  }

  const handleCheck = () => {
    if (!state.selectedOption) {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint: 'Válasszátok ki a három szám közül a kérdőjel helyére illő varázsszámot!',
      });
      return;
    }

    if (state.selectedOption === '12') {
      soundEngine.playSealUnlock();
      onUpdate({ ...state, solved: true, errorHint: null });
      onSolve();
    } else {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint:
          'Figyeljétek meg a lépéseket: 3 + 3 = 6, 6 + 3 = 9. Mennyi lesz 9 + 3?',
      });
    }
  };

  return (
    <div className="space-y-6">
      <CsillagManoGuide message="A második ajtó zárját egy számsor őrzi! Számoljátok ki közösen, melyik szám hiányzik a kérdőjel helyéről!" />

      <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-10 shadow-xl space-y-8 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            2. ajtó · A varázsszám
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Melyik szám kerül a kérdőjel helyére?
          </h2>
        </div>

        {/* Sequence display */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {SEQUENCE.map((item, idx) => {
            const isMissing = item === '?';
            return (
              <div
                key={idx}
                className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-2 font-display text-3xl sm:text-4xl font-bold tabular-nums shadow-lg ${
                  isMissing
                    ? 'border-amber-300 bg-amber-400 text-[#0B192C]'
                    : 'border-amber-300/40 bg-[#FFF8EB] text-[#1E1B18]'
                }`}
              >
                {item}
              </div>
            );
          })}
        </div>

        {/* 3 Choices */}
        <div className="space-y-3">
          <p className="text-lg font-bold text-amber-100">Válaszlehetőségek:</p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {OPTIONS.map((opt) => {
              const selected = state.selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdate({ ...state, selectedOption: opt, errorHint: null });
                  }}
                  className={`rounded-2xl border-2 py-5 text-2xl sm:text-3xl font-bold tabular-nums transition-all cursor-pointer ${
                    selected
                      ? 'border-amber-300 bg-amber-400 text-[#0B192C] scale-105 shadow-lg'
                      : 'border-white/20 bg-[#0D1E36] text-white hover:border-amber-300/60 hover:bg-[#163055]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {state.errorHint && (
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-2xl border border-amber-400/50 bg-amber-950/75 p-4 text-base font-semibold text-amber-100"
          >
            {state.errorHint}
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCheck}
            className="inline-flex items-center gap-3 rounded-2xl bg-emerald-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>Válasz ellenőrzése</span>
          </button>
        </div>
      </div>
    </div>
  );
};
