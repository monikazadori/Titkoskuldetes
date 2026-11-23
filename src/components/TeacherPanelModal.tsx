import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import { DOORS } from '../data/missions';
import { DoorId, OneDayGameState, TeacherSettings } from '../types/game';
import { isDoorUnlocked } from '../utils/storage';

interface TeacherPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeacherSettings;
  gameState: OneDayGameState;
  onUpdateSettings: (next: TeacherSettings) => void;
  onResetFullGame: () => void;
  onTestDoor: (doorId: DoorId) => void;
  onTestLetter: () => void;
}

export const TeacherPanelModal: React.FC<TeacherPanelModalProps> = ({
  isOpen,
  onClose,
  settings,
  gameState,
  onUpdateSettings,
  onResetFullGame,
  onTestDoor,
  onTestLetter,
}) => {
  const [verified, setVerified] = useState(false);
  const [gateError, setGateError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDoneNotice, setResetDoneNotice] = useState(false);

  if (!isOpen) return null;

  const handleGateChoice = (val: number) => {
    if (val === 56) {
      setVerified(true);
      setGateError(false);
    } else {
      setGateError(true);
    }
  };

  const handleToggleManualUnlock = (doorId: DoorId) => {
    onUpdateSettings({
      ...settings,
      manualUnlocks: {
        ...settings.manualUnlocks,
        [doorId]: !settings.manualUnlocks[doorId],
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tanítói kezelőfelület"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-amber-400/30 bg-[#0F213B] p-6 sm:p-8 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-200">
              Tanítói kezelőfelület
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Egynapos osztályjáték állapota, kipróbálás és teljes újrakezdés
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bezárás"
            className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!verified ? (
          <div className="py-8 text-center">
            <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-amber-300" />
            <h3 className="font-display text-xl font-bold text-white">
              Gyors tanítói ellenőrzés
            </h3>
            <p className="mt-2 text-base text-slate-300">
              A diákok védelme érdekében válassza ki a helyes szorzatot: Mennyi 7 × 8?
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {[48, 54, 56, 63].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleGateChoice(n)}
                  className="min-w-[84px] rounded-xl border border-amber-300/40 bg-amber-400/15 px-6 py-3 text-xl font-bold text-amber-100 hover:bg-amber-400/30 cursor-pointer"
                >
                  {n}
                </button>
              ))}
            </div>
            {gateError && (
              <p className="mt-4 text-sm font-medium text-rose-300">
                Ez nem a helyes szorzat – próbálja meg újra!
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Current game summary */}
            <div className="rounded-xl border border-white/10 bg-[#142B4C] p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Bevezető · Titkos levél és két igaz–hamis kérdés
                </p>
                <p className="text-sm text-slate-200">
                  Levél állapota:{' '}
                  <strong>{gameState.letterOpened ? 'Kinyitva' : 'Zárva'}</strong> · Kérdések:{' '}
                  <strong>
                    {gameState.letterChallengeSolved ? 'Megoldva (1. ajtó nyitva)' : 'Folyamatban'}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onTestLetter();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Levél megnyitása</span>
              </button>
            </div>

            {/* 5 Doors testing / status */}
            <div className="space-y-3">
              <h3 className="font-display text-lg font-bold text-white">
                Az öt varázsajtó állapota és tesztelése
              </h3>

              {DOORS.map((door) => {
                const unlocked = isDoorUnlocked(door.id, gameState, settings);
                const completed = gameState.completedDoors.includes(door.id);
                const manual = settings.manualUnlocks[door.id];
                return (
                  <div
                    key={door.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#142B4C] p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm text-amber-200 font-semibold">
                        <span>{door.shortLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{unlocked ? 'Nyitva' : 'Zárva'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{completed ? 'Pecsét megszerezve' : 'Megoldásra vár'}</span>
                      </div>
                      <p className="font-bold text-white text-base mt-0.5">{door.title}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleManualUnlock(door.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer ${
                          manual
                            ? 'bg-amber-400 text-[#0B192C]'
                            : 'bg-white/10 text-slate-100 hover:bg-white/20'
                        }`}
                      >
                        {manual ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Kézi nyitás aktív</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Feloldás teszthez</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            manualUnlocks: { ...settings.manualUnlocks, [door.id]: true },
                          });
                          onTestDoor(door.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Tesztelés</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-amber-950/30 p-4 text-sm text-amber-100">
              <p>
                <strong>Titoktartás:</strong> A végső meglepetés kizárólag mind az öt arany
                varázspecsét megszerzése után, a titkos ajándékdobozra kattintva jelenik meg.
              </p>
            </div>

            {resetDoneNotice && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-950/50 p-4 text-sm font-semibold text-emerald-200"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
                <span>
                  A teljes játék alaphelyzetbe állt! Minden feladat, ajtózár, pecsét, a titkos
                  levél, a két kérdés és a végső meglepetés is visszaállt a kezdőállapotba.
                </span>
              </div>
            )}

            {/* Full Game Reset */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmReset(true);
                    setResetDoneNotice(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-950/40 px-4 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-900/50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Teljes játék újrakezdése</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-rose-200">
                    Biztosan újra szeretnéd kezdeni a teljes játékot? Minden megoldás, pecsét és
                    ajtózár törlődik.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetFullGame();
                      setConfirmReset(false);
                      setResetDoneNotice(true);
                    }}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 cursor-pointer"
                  >
                    Igen, újrakezdés
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 cursor-pointer"
                  >
                    Mégse
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setResetDoneNotice(false);
                  onClose();
                }}
                className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
              >
                Kész, vissza az osztályhoz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
