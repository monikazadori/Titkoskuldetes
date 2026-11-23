import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Door4State } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { DoorSealCelebration } from '../DoorSealCelebration';

interface Door4SecretMessageProps {
  state: Door4State;
  onUpdate: (next: Door4State) => void;
  onSolve: () => void;
  onNextDoor: () => void;
}

const CODE_TABLE = [
  { symbol: '⭐', letter: 'T' },
  { symbol: '🔔', letter: 'É' },
  { symbol: '❄️', letter: 'L' },
];

const MESSAGE_SYMBOLS = ['⭐', '🔔', '❄️'];
const OPTIONS = ['TÉL', 'TÁL', 'TÉR'];

export const Door4SecretMessage: React.FC<Door4SecretMessageProps> = ({
  state,
  onUpdate,
  onSolve,
  onNextDoor,
}) => {
  if (state.solved) {
    return <DoorSealCelebration doorId="door-4" onNextDoor={onNextDoor} />;
  }

  const handleCheck = () => {
    if (!state.selectedOption) {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint: 'Válasszátok ki a három szó közül a megfejtett titkos üzenetet!',
      });
      return;
    }

    if (state.selectedOption === 'TÉL') {
      soundEngine.playSealUnlock();
      onUpdate({ ...state, solved: true, errorHint: null });
      onSolve();
    } else {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint:
          'Nézzétek meg sorban a jeleket a kódtáblában: ⭐ = T, 🔔 = É, ❄️ = L. Milyen szó áll össze belőlük?',
      });
    }
  };

  return (
    <div className="space-y-6">
      <CsillagManoGuide message="A Titkok Őrzője három jelképpel írt egy rövid szót! Fejtsétek meg együtt a titkos kódtábla segítségével!" />

      <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-10 shadow-xl space-y-8 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            4. ajtó · A titkos üzenet
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Fejtsétek meg a három jelképet!
          </h2>
        </div>

        {/* Code table */}
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/40 bg-[#FFF8EB] p-5 sm:p-6 text-[#1E1B18] shadow-inner space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">
            Titkos kódtábla
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CODE_TABLE.map((entry) => (
              <div
                key={entry.letter}
                className="flex flex-col items-center justify-center rounded-xl border border-amber-900/15 bg-white p-4 shadow-sm"
              >
                <span className="text-3xl sm:text-4xl" aria-hidden="true">
                  {entry.symbol}
                </span>
                <span className="mt-2 font-display text-2xl font-bold text-red-800">
                  = {entry.letter}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Secret message */}
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-200">
            A megfejtendő üzenet:
          </p>
          <div className="flex justify-center gap-4">
            {MESSAGE_SYMBOLS.map((sym, idx) => (
              <div
                key={idx}
                className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-2 border-amber-400 bg-[#0B192C] text-4xl sm:text-5xl shadow-lg"
              >
                {sym}
              </div>
            ))}
          </div>
        </div>

        {/* 3 word options */}
        <div className="space-y-3">
          <p className="text-lg font-bold text-amber-100">Válaszlehetőségek:</p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
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
                  className={`rounded-2xl border-2 py-4 text-2xl font-bold tracking-wide transition-all cursor-pointer ${
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
