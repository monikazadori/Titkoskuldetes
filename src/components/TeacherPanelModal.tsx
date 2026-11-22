import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import { MISSIONS } from '../data/missions';
import { GameProgress, MissionId, TeacherSettings } from '../types/game';
import { isMissionUnlocked } from '../utils/storage';

interface TeacherPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeacherSettings;
  progress: GameProgress;
  onUpdateSettings: (next: TeacherSettings) => void;
  onResetProgress: () => void;
  onToggleMissionCompleted: (missionId: MissionId) => void;
  onTestMission: (missionId: MissionId) => void;
  onRestartMission: (missionId: MissionId) => void;
}

export const TeacherPanelModal: React.FC<TeacherPanelModalProps> = ({
  isOpen,
  onClose,
  settings,
  progress,
  onUpdateSettings,
  onResetProgress,
  onToggleMissionCompleted,
  onTestMission,
  onRestartMission,
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

  const handleToggleManualUnlock = (missionId: MissionId) => {
    onUpdateSettings({
      ...settings,
      manualUnlocks: {
        ...settings.manualUnlocks,
        [missionId]: !settings.manualUnlocks[missionId],
      },
    });
  };

  const handleUnlockAllExceptFinal = () => {
    onUpdateSettings({
      ...settings,
      manualUnlocks: {
        'nov-25': true,
        'nov-26': true,
        'nov-27': true,
        'nov-30': true,
        'dec-01': settings.manualUnlocks['dec-01'],
      },
    });
  };

  const handleLockAll = () => {
    onUpdateSettings({
      strictDay1DateLock: true,
      simulatedDate: null,
      manualUnlocks: {
        'nov-25': false,
        'nov-26': false,
        'nov-27': false,
        'nov-30': false,
        'dec-01': false,
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
              Küldetések feloldása, dátumszimuláció, tesztelés és osztályhaladás kezelése
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
            {/* Date simulation & calendar strictness */}
            <div className="rounded-xl border border-white/10 bg-[#142B4C] p-5">
              <div className="flex items-center gap-2 text-amber-200 font-semibold mb-3">
                <Calendar className="w-5 h-5" />
                <span>Dátumbeállítás és naptárzár</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Valós rendszeridő', value: null },
                  { label: 'Nov. 25.', value: '2026-11-25' },
                  { label: 'Nov. 26.', value: '2026-11-26' },
                  { label: 'Nov. 27.', value: '2026-11-27' },
                  { label: 'Nov. 30.', value: '2026-11-30' },
                  { label: 'Dec. 1.', value: '2026-12-01' },
                ].map((opt) => {
                  const active = settings.simulatedDate === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, simulatedDate: opt.value })
                      }
                      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-400 text-[#0B192C]'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 flex items-center gap-3 cursor-pointer text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.strictDay1DateLock}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      strictDay1DateLock: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-amber-400"
                />
                <span>
                  Szigorú naptárzár az 1. napra is (Nov. 25. előtt legyen zárva az 1. ajtó)
                </span>
              </label>
            </div>

            {/* Mission list controls */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-white">
                  Küldetések állapota és tesztelése
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUnlockAllExceptFinal}
                    className="rounded-lg bg-emerald-600/30 border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/45 cursor-pointer"
                  >
                    1–4. nap feloldása
                  </button>
                  <button
                    type="button"
                    onClick={handleLockAll}
                    className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 cursor-pointer"
                  >
                    Szigorú naptármód
                  </button>
                </div>
              </div>

              {MISSIONS.map((m) => {
                const unlocked = isMissionUnlocked(m.id, settings, progress);
                const completed = progress.completedMissions.includes(m.id);
                const manual = settings.manualUnlocks[m.id];
                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#142B4C] p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm text-amber-200 font-semibold">
                        <span>{m.dateLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{unlocked ? 'Nyitva' : 'Zárva'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{completed ? 'Pecsét megszerezve' : 'Folyamatban'}</span>
                      </div>
                      <p className="font-bold text-white text-base mt-0.5">{m.title}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleManualUnlock(m.id)}
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
                            <span>Feloldás most</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleMissionCompleted(m.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer ${
                          completed
                            ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200'
                            : 'bg-white/10 text-slate-200 hover:bg-white/20'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{completed ? 'Kész (Visszavonás)' : 'Készre jelölés'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            manualUnlocks: { ...settings.manualUnlocks, [m.id]: true },
                          });
                          onTestMission(m.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Tesztelés</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onRestartMission(m.id);
                          onClose();
                        }}
                        title={
                          completed
                            ? 'Visszaállítja a küldetés feladatait és zárját az 1. lépésre, a megszerzett pecsét megőrzésével'
                            : 'Visszaállítja a küldetést az 1. lépésre'
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/35 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>
                          {completed ? 'Küldetés újrajátszása' : 'Újrakezdés'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-amber-400/25 bg-amber-950/30 p-4 text-sm text-amber-100 space-y-1.5">
              <p>
                <strong>Titoktartási védelem:</strong> A december 1-jei végső meglepetés akkor sem
                jelenik meg a nyomoknál vagy a kezdőképernyőn, ha az 5. ajtó fel van oldva – kizárólag az
                5. küldetés sikeres teljesítése után tárul fel!
              </p>
              <p>
                <strong>Küldetés újrajátszása:</strong> A már teljesített küldetések újrajátszása
                visszaállítja az adott nap feladatait, válaszait, segítségeit és kódzárát, miközben a
                korábban megszerzett varázspecsét, a nyom és a többi nap eredménye megmarad.
              </p>
            </div>

            {resetDoneNotice && (
              <div
                role="status"
                className="rounded-xl border border-emerald-400/40 bg-emerald-950/50 p-4 text-sm font-semibold text-emerald-200"
              >
                A teljes nyomozás eredményei visszaállítva. A dátumhoz kötött ajtónyitási szabályok
                változatlanok maradtak.
              </div>
            )}

            {/* Reset danger zone */}
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
                  <span>Teljes nyomozás visszaállítása</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-rose-200">
                    Biztosan törölni szeretnéd a teljes nyomozás eredményeit? Ez a művelet nem vonható vissza.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                      setResetDoneNotice(true);
                    }}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 cursor-pointer"
                  >
                    Igen, visszaállítás
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
