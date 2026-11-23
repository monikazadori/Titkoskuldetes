import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { Door5State } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { DoorSealCelebration } from '../DoorSealCelebration';

interface Door5BellsSecretProps {
  state: Door5State;
  onUpdate: (next: Door5State) => void;
  onSolve: () => void;
  onNextDoor: () => void;
}

interface BellItem {
  label: 'PIROS' | 'SÁRGA' | 'ZÖLD' | 'KÉK';
  fill: string;
  stroke: string;
  badgeBg: string;
}

const BELLS: BellItem[] = [
  { label: 'PIROS', fill: '#EF4444', stroke: '#FECACA', badgeBg: 'bg-red-600' },
  { label: 'SÁRGA', fill: '#FACC15', stroke: '#FEF9C3', badgeBg: 'bg-yellow-400 text-[#0B192C]' },
  { label: 'ZÖLD', fill: '#22C55E', stroke: '#BBF7D0', badgeBg: 'bg-emerald-600' },
  { label: 'KÉK', fill: '#3B82F6', stroke: '#BFDBFE', badgeBg: 'bg-blue-600' },
];

const BELL_COLOR_MAP: Record<string, string> = {
  PIROS: 'bg-red-600 text-white',
  SÁRGA: 'bg-yellow-400 text-[#0B192C]',
  ZÖLD: 'bg-emerald-600 text-white',
  KÉK: 'bg-blue-600 text-white',
};

const CORRECT_ORDER = 'PIROS – SÁRGA – ZÖLD – KÉK';

const ORDER_OPTIONS = [
  'SÁRGA – PIROS – KÉK – ZÖLD',
  'PIROS – SÁRGA – ZÖLD – KÉK',
  'PIROS – ZÖLD – SÁRGA – KÉK',
];

const ColoredBellSvg: React.FC<{ fill: string; stroke: string }> = ({ fill, stroke }) => (
  <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
    <path
      d="M40 16 C27 16 21 27 21 41 L14 57 H66 L59 41 C59 27 53 16 40 16 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="40" cy="63" r="6" fill={fill} stroke={stroke} strokeWidth="2.5" />
    <circle cx="40" cy="13" r="4.5" fill={stroke} />
  </svg>
);

export const Door5BellsSecret: React.FC<Door5BellsSecretProps> = ({
  state,
  onUpdate,
  onSolve,
  onNextDoor,
}) => {
  const [countdown, setCountdown] = useState(6);
  const [activeBellIdx, setActiveBellIdx] = useState<number | null>(null);

  useEffect(() => {
    if (state.phase !== 'observe') {
      setActiveBellIdx(null);
      return;
    }

    let remaining = 6;
    setCountdown(remaining);
    setActiveBellIdx(0);
    soundEngine.playBellNote(0);

    const chimeTimers = [1, 2, 3].map((idx) =>
      window.setTimeout(() => {
        setActiveBellIdx(idx);
        soundEngine.playBellNote(idx);
      }, idx * 800)
    );
    const clearHighlightTimer = window.setTimeout(() => {
      setActiveBellIdx(null);
    }, 3400);

    const interval = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        soundEngine.playClick();
        onUpdate({ ...state, phase: 'guess', errorHint: null });
      }
    }, 1000);

    return () => {
      chimeTimers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(clearHighlightTimer);
      window.clearInterval(interval);
    };
  }, [state.phase]);

  if (state.phase === 'solved') {
    return <DoorSealCelebration doorId="door-5" onNextDoor={onNextDoor} />;
  }

  const handleCheck = () => {
    if (!state.selectedOrder) {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint: 'Válasszátok ki a három lehetőség közül a csengők helyes sorrendjét!',
      });
      return;
    }

    if (state.selectedOrder === CORRECT_ORDER) {
      soundEngine.playSealUnlock();
      onUpdate({ ...state, phase: 'solved', errorHint: null });
      onSolve();
    } else {
      soundEngine.playGentleHint();
      onUpdate({
        ...state,
        errorHint:
          'Idézzétek fel, melyik két szín volt az elején, és melyik kettő a végén! Ha szeretnétek, nézzétek meg újra a csengőket!',
      });
    }
  };

  return (
    <div className="space-y-6">
      <CsillagManoGuide
        message={
          state.phase === 'observe'
            ? 'Figyeljétek meg jól a négy színes csengő sorrendjét balról jobbra! Mindjárt eltűnnek!'
            : 'A csengők elrejtőztek! Melyik volt a helyes színsorrend?'
        }
      />

      {state.phase === 'observe' ? (
        <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                5. ajtó · 1. lépés · Megfigyelés
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                A csengők titkos sorrendje
              </h2>
            </div>
            <div className="rounded-xl border border-amber-300/40 bg-[#0B192C] px-4 py-2 text-base font-bold text-amber-200 tabular-nums">
              Elrejtés: {countdown} mp
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BELLS.map((bell, idx) => (
              <div
                key={bell.label}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-5 transition-transform duration-300 ${
                  activeBellIdx === idx
                    ? 'border-amber-300 bg-[#1B3A66] scale-105 shadow-lg shadow-amber-400/20'
                    : 'border-white/20 bg-[#0D1E36]'
                }`}
              >
                <span className="text-xs font-bold text-amber-200 tabular-nums">
                  {idx + 1}. csengő
                </span>
                <ColoredBellSvg fill={bell.fill} stroke={bell.stroke} />
                <span className="font-display text-xl font-bold text-white tracking-wide">
                  {bell.label}
                </span>
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
              <span>Megjegyeztük – Rejtsd el a csengőket!</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                5. ajtó · 2. lépés · Válaszadás
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Melyik volt a csengők helyes sorrendje?
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
              <span>Csengők újranézése</span>
            </button>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {ORDER_OPTIONS.map((opt) => {
              const selected = state.selectedOrder === opt;
              const colors = opt.split(' – ');
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdate({ ...state, selectedOrder: opt, errorHint: null });
                  }}
                  className={`w-full flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 px-6 py-4 transition-all cursor-pointer ${
                    selected
                      ? 'border-amber-300 bg-amber-400 text-[#0B192C] shadow-lg'
                      : 'border-white/20 bg-[#0D1E36] text-white hover:border-amber-300/60 hover:bg-[#163055]'
                  }`}
                >
                  <span className="font-display text-lg sm:text-xl font-bold tracking-wide">
                    {opt}
                  </span>
                  <div className="flex items-center gap-2">
                    {colors.map((c) => (
                      <span
                        key={c}
                        className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                          BELL_COLOR_MAP[c] ?? 'bg-slate-600 text-white'
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
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
