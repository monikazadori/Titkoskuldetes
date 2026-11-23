import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { Door1State } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { DoorSealCelebration } from '../DoorSealCelebration';

interface Door1MissingItemProps {
  state: Door1State;
  onUpdate: (next: Door1State) => void;
  onSolve: () => void;
  onNextDoor: () => void;
}

type WinterItemId = 'kesztyu' | 'szanko' | 'hoember' | 'ajandekdoboz' | 'sal' | 'csengo';

interface WinterItemDef {
  id: WinterItemId;
  label: string;
}

const ALL_ITEMS: WinterItemDef[] = [
  { id: 'kesztyu', label: 'Kesztyű' },
  { id: 'szanko', label: 'Szánkó' },
  { id: 'hoember', label: 'Hóember' },
  { id: 'ajandekdoboz', label: 'Ajándékdoboz' },
  { id: 'sal', label: 'Sál' },
  { id: 'csengo', label: 'Csengő' },
];

// Deterministic reordered list of the 5 remaining items when the scarf ('sal') disappears
const REMAINING_ITEMS: WinterItemDef[] = [
  { id: 'hoember', label: 'Hóember' },
  { id: 'csengo', label: 'Csengő' },
  { id: 'kesztyu', label: 'Kesztyű' },
  { id: 'ajandekdoboz', label: 'Ajándékdoboz' },
  { id: 'szanko', label: 'Szánkó' },
];

const OPTIONS = ['KESZTYŰ', 'SÁL', 'CSENGŐ'];

const WinterItemSvg: React.FC<{ id: WinterItemId }> = ({ id }) => {
  switch (id) {
    case 'kesztyu':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
          <path
            d="M28 16 C28 10 46 10 48 22 L50 38 L57 32 C61 29 66 34 62 39 L50 53 L48 64 L24 64 L24 30 C24 22 28 16 28 16 Z"
            fill="#DC2626"
            stroke="#FEF2F2"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="21" y="57" width="30" height="11" rx="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M31 28 L37 36 L43 28" fill="none" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'szanko':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
          <rect x="14" y="34" width="50" height="9" rx="4" fill="#B45309" stroke="#FDE68A" strokeWidth="2" />
          <path d="M22 43 L20 55 M56 43 L58 55" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
          <path
            d="M10 56 H64 C70 56 72 48 66 44"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path d="M18 34 L25 22 L42 22 L46 34" fill="none" stroke="#D97706" strokeWidth="3.5" strokeLinejoin="round" />
        </svg>
      );
    case 'hoember':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
          <circle cx="40" cy="54" r="16" fill="#F8FAFC" stroke="#BAE6FD" strokeWidth="2.5" />
          <circle cx="40" cy="30" r="11.5" fill="#F8FAFC" stroke="#BAE6FD" strokeWidth="2.5" />
          <rect x="28" y="16" width="24" height="4" rx="2" fill="#1E293B" />
          <rect x="32" y="7" width="16" height="10" rx="2" fill="#1E293B" />
          <circle cx="36" cy="27" r="1.8" fill="#0F172A" />
          <circle cx="44" cy="27" r="1.8" fill="#0F172A" />
          <polygon points="40,30 49,32 40,34" fill="#F97316" />
          <circle cx="40" cy="49" r="2" fill="#0F172A" />
          <circle cx="40" cy="57" r="2" fill="#0F172A" />
        </svg>
      );
    case 'ajandekdoboz':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
          <rect x="16" y="30" width="48" height="36" rx="5" fill="#16A34A" stroke="#BBF7D0" strokeWidth="2" />
          <rect x="13" y="22" width="54" height="11" rx="4" fill="#15803D" stroke="#BBF7D0" strokeWidth="2" />
          <rect x="36" y="22" width="8" height="44" fill="#FBBF24" />
          <path
            d="M40 22 C33 12 22 14 26 21 C29 24 37 22 40 22 Z M40 22 C47 12 58 14 54 21 C51 24 43 22 40 22 Z"
            fill="#FBBF24"
            stroke="#FEF08A"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'sal':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
          <path
            d="M16 26 C16 20 64 20 64 26 C64 33 56 37 42 37 L42 64 L29 64 L29 37 C20 36 16 32 16 26 Z"
            fill="#0284C7"
            stroke="#E0F2FE"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="29" y="45" width="13" height="5" fill="#FBBF24" />
          <rect x="29" y="55" width="13" height="5" fill="#FBBF24" />
          <path d="M31 64 V69 M35.5 64 V69 M40 64 V69" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'csengo':
      return (
        <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
          <path
            d="M40 16 C28 16 22 27 22 40 L16 55 H64 L58 40 C58 27 52 16 40 16 Z"
            fill="#F59E0B"
            stroke="#FEF08A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="60" r="6" fill="#D97706" stroke="#FEF08A" strokeWidth="2" />
          <circle cx="40" cy="14" r="4" fill="#FBBF24" />
        </svg>
      );
  }
};

export const Door1MissingItem: React.FC<Door1MissingItemProps> = ({
  state,
  onUpdate,
  onSolve,
  onNextDoor,
}) => {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (state.phase !== 'observe') return;
    let remaining = 6;
    setCountdown(remaining);
    const interval = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        soundEngine.playClick();
        onUpdate({ ...state, phase: 'guess', errorHint: null });
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.phase]);

  if (state.phase === 'solved') {
    return <DoorSealCelebration doorId="door-1" onNextDoor={onNextDoor} />;
  }

  const handleCheck = () => {
    if (!state.selectedOption) {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint: 'Válasszátok ki közösen a három lehetőség közül a hiányzó tárgyat!',
      });
      return;
    }

    if (state.selectedOption === 'SÁL') {
      soundEngine.playSealUnlock();
      onUpdate({ ...state, phase: 'solved', errorHint: null });
      onSolve();
    } else {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint:
          'Nézzétek meg figyelmesen a megmaradt öt tárgyat! Ez a tárgy még ott van köztük. Próbáljátok újra!',
      });
    }
  };

  return (
    <div className="space-y-6">
      <CsillagManoGuide
        message={
          state.phase === 'observe'
            ? 'Figyeljétek meg jól mind a hat téli tárgyat! Hamarosan az egyik varázsütésre eltűnik!'
            : 'Hoppá, az egyik téli tárgy eltűnt! Melyik hiányzik a hat közül?'
        }
      />

      {state.phase === 'observe' ? (
        <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                1. lépés · Megfigyelés
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Hat téli tárgy a kastély asztalán
              </h2>
            </div>
            <div className="rounded-xl border border-amber-300/40 bg-[#0B192C] px-4 py-2 text-base font-bold text-amber-200 tabular-nums">
              Eltűnés: {countdown} mp
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ALL_ITEMS.map((item) => (
              <div
                key={item.id}
                role="img"
                aria-label={item.label}
                className="flex flex-col items-center justify-center rounded-2xl border border-amber-300/25 bg-[#FFF8EB] p-6 shadow-md"
              >
                <WinterItemSvg id={item.id} />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onUpdate({ ...state, phase: 'guess', errorHint: null });
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-[#0B192C] hover:bg-amber-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Megfigyeltük – Tűnjön el az egyik!</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                2. lépés · Nyomozás
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Melyik tárgy hiányzik?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onUpdate({ ...state, phase: 'observe', errorHint: null });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-amber-100 hover:bg-white/15 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Újra megfigyelem</span>
            </button>
          </div>

          {/* Remaining 5 items */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {REMAINING_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#FFF8EB]/95 p-4 text-[#1E1B18]"
              >
                <WinterItemSvg id={item.id} />
                <span className="font-display text-base sm:text-lg font-bold">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* 3 answer choices */}
          <div className="space-y-3">
            <p className="text-lg font-bold text-center text-amber-100">
              Válasszátok ki a hiányzó tárgyat:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
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
                    className={`rounded-2xl border-2 px-6 py-4 text-xl font-bold transition-all cursor-pointer ${
                      selected
                        ? 'border-amber-300 bg-amber-400 text-[#0B192C] scale-[1.02] shadow-lg'
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
              className="mx-auto max-w-2xl rounded-2xl border border-amber-400/50 bg-amber-950/75 p-4 text-center text-base font-semibold text-amber-100"
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
      )}
    </div>
  );
};
