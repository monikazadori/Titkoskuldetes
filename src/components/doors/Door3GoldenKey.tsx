import React from 'react';
import { KeyRound } from 'lucide-react';
import { Door3State } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { DoorSealCelebration } from '../DoorSealCelebration';

interface Door3GoldenKeyProps {
  state: Door3State;
  onUpdate: (next: Door3State) => void;
  onSolve: () => void;
  onNextDoor: () => void;
}

type ChestColorId = 'piros' | 'kek' | 'zold';

const CHESTS: {
  id: ChestColorId;
  label: string;
  bodyFill: string;
  lidFill: string;
  borderClass: string;
}[] = [
  {
    id: 'piros',
    label: 'Piros láda',
    bodyFill: '#DC2626',
    lidFill: '#B91C1C',
    borderClass: 'border-rose-400/60 hover:border-rose-300',
  },
  {
    id: 'kek',
    label: 'Kék láda',
    bodyFill: '#2563EB',
    lidFill: '#1D4ED8',
    borderClass: 'border-sky-400/60 hover:border-sky-300',
  },
  {
    id: 'zold',
    label: 'Zöld láda',
    bodyFill: '#16A34A',
    lidFill: '#15803D',
    borderClass: 'border-emerald-400/60 hover:border-emerald-300',
  },
];

const ChestSvg: React.FC<{
  bodyFill: string;
  lidFill: string;
  openedEmpty: boolean;
}> = ({ bodyFill, lidFill, openedEmpty }) => (
  <svg viewBox="0 0 120 100" className="w-28 h-24 sm:w-32 sm:h-28" aria-hidden="true">
    {/* Chest base */}
    <rect
      x="16"
      y="44"
      width="88"
      height="44"
      rx="8"
      fill={bodyFill}
      stroke="#FDE68A"
      strokeWidth="3"
    />
    {/* Chest lid */}
    <path
      d={
        openedEmpty
          ? 'M14 34 C14 14 106 14 106 34 Z'
          : 'M14 44 C14 22 106 22 106 44 Z'
      }
      fill={lidFill}
      stroke="#FDE68A"
      strokeWidth="3"
    />
    {/* Gold clasp */}
    <rect x="52" y="40" width="16" height="16" rx="4" fill="#FBBF24" stroke="#FEF9C3" strokeWidth="2" />
    <circle cx="60" cy="48" r="2.5" fill="#78350F" />
    {openedEmpty && (
      <rect x="20" y="34" width="80" height="10" rx="2" fill="#0F172A" opacity="0.85" />
    )}
  </svg>
);

export const Door3GoldenKey: React.FC<Door3GoldenKeyProps> = ({
  state,
  onUpdate,
  onSolve,
  onNextDoor,
}) => {
  if (state.solved) {
    return <DoorSealCelebration doorId="door-3" onNextDoor={onNextDoor} />;
  }

  const handleChestClick = (id: ChestColorId) => {
    if (id === 'zold') {
      soundEngine.playSealUnlock();
      onUpdate({ ...state, solved: true, errorHint: null });
      onSolve();
      return;
    }

    soundEngine.playGentleHint();
    const nextOpened = state.openedEmpty.includes(id)
      ? state.openedEmpty
      : [...state.openedEmpty, id];
    onUpdate({
      ...state,
      openedEmpty: nextOpened,
      errorHint:
        id === 'piros'
          ? 'A piros láda üres! Olvassátok el újra a nyomot: az aranykulcs nincs a piros ládában!'
          : 'A kék láda is üres! Olvassátok el újra a nyomot: a kék ládában sincs!',
    });
  };

  return (
    <div className="space-y-6">
      <CsillagManoGuide message="Három színes láda áll előttetek, de csak az egyikben lapul az aranykulcs! Kattintsatok a helyes ládára!" />

      <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-10 shadow-xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            3. ajtó · Az aranykulcs
          </p>
          <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300/40 bg-[#FFF8EB] p-6 text-[#1E1B18] shadow-inner">
            <p className="font-display text-xl sm:text-2xl font-bold leading-relaxed">
              „Az aranykulcs nincs a piros ládában. A kék ládában sincs. Melyik ládában rejtőzik?”
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {CHESTS.map((chest) => {
            const isEmpty =
              chest.id !== 'zold' && state.openedEmpty.includes(chest.id);
            return (
              <button
                key={chest.id}
                type="button"
                onClick={() => handleChestClick(chest.id)}
                className={`group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 bg-[#0D1E36]/90 p-6 transition-all cursor-pointer hover:-translate-y-1 ${
                  isEmpty ? 'border-slate-500/50 opacity-75' : chest.borderClass
                }`}
              >
                <ChestSvg
                  bodyFill={chest.bodyFill}
                  lidFill={chest.lidFill}
                  openedEmpty={isEmpty}
                />
                <span className="font-display text-2xl font-bold text-white">
                  {chest.label}
                </span>
                <span className="text-sm font-semibold text-amber-200 flex items-center gap-1.5">
                  {isEmpty ? (
                    'Üres láda'
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Láda kinyitása</span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {state.errorHint && (
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-2xl border border-amber-400/50 bg-amber-950/75 p-4 text-base font-semibold text-amber-100"
          >
            {state.errorHint}
          </div>
        )}
      </div>
    </div>
  );
};
