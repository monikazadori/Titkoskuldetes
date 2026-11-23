import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Gift, Lock, Sparkles } from 'lucide-react';
import {
  DOORS,
  FINAL_CONGRATULATIONS_LINES,
  FINAL_FOREST_PHOTO,
  FINAL_SECOND_CAPTION,
  FINAL_TRAIN_PHOTO,
} from '../data/missions';
import { OneDayGameState } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { canShowFinalSurprise, canShowGiftBox } from '../utils/storage';
import { ConfettiCanvas } from './ConfettiCanvas';
import { CsillagManoGuide } from './CsillagManoGuide';
import { GoldenSealBadge } from './GoldenSealBadge';

interface SealsFinalViewProps {
  gameState: OneDayGameState;
  onOpenGiftBox: () => void;
  onRevealSecondPhoto: () => void;
  onGoToDoors: () => void;
}

export const SealsFinalView: React.FC<SealsFinalViewProps> = ({
  gameState,
  onOpenGiftBox,
  onRevealSecondPhoto,
  onGoToDoors,
}) => {
  const giftReady = canShowGiftBox(gameState);
  const showFinal = canShowFinalSurprise(gameState);

  const [openingAnimation, setOpeningAnimation] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [trainPhotoError, setTrainPhotoError] = useState(false);
  const [forestPhotoError, setForestPhotoError] = useState(false);
  const timersRef = useRef<number[]>([]);
  const secondPhotoSectionRef = useRef<HTMLDivElement | null>(null);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (!showFinal) {
      setOpeningAnimation(false);
      setConfettiActive(false);
    }
  }, [showFinal]);

  const handleRevealSecretClick = () => {
    if (openingAnimation) return;
    clearTimers();
    soundEngine.playSealUnlock();
    setOpeningAnimation(true);
    setConfettiActive(true);

    const revealTimer = window.setTimeout(() => {
      soundEngine.playGrandVictory();
      setOpeningAnimation(false);
      onOpenGiftBox();
    }, 850);

    const stopConfettiTimer = window.setTimeout(() => {
      setConfettiActive(false);
    }, 7000);

    timersRef.current.push(revealTimer, stopConfettiTimer);
  };

  const handleRevealSecondPhoto = () => {
    clearTimers();
    soundEngine.playSealUnlock();
    setConfettiActive(true);
    onRevealSecondPhoto();

    const scrollTimer = window.setTimeout(() => {
      secondPhotoSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);

    const stopConfettiTimer = window.setTimeout(() => {
      setConfettiActive(false);
    }, 5500);

    timersRef.current.push(scrollTimer, stopConfettiTimer);
  };

  return (
    <div className="space-y-8">
      <ConfettiCanvas active={confettiActive} />

      {!showFinal ? (
        <>
          <div className="rounded-3xl border border-white/10 bg-[#122643]/90 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-300 tabular-nums">
                Varázspecsét-gyűjtő · {gameState.completedDoors.length} / 5 pecsét
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
                Az öt arany varázspecsét
              </h1>
            </div>
            {!giftReady && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onGoToDoors();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-base font-bold text-[#0B192C] hover:bg-amber-300 transition-colors cursor-pointer"
              >
                <span>Tovább az ajtókhoz</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 5 Seals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {DOORS.map((door) => {
              const completed = gameState.completedDoors.includes(door.id);
              return (
                <div
                  key={door.id}
                  className={`flex flex-col items-center text-center rounded-3xl border p-6 ${
                    completed
                      ? 'border-amber-400/60 bg-[#162F52]'
                      : 'border-white/10 bg-[#0E1E36]/80'
                  }`}
                >
                  <GoldenSealBadge number={door.doorNumber} unlocked={completed} size="md" />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-300">
                    {door.shortLabel}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold text-white">
                    {door.title}
                  </h2>
                  <p className="mt-2 text-sm flex items-center gap-1.5 font-medium">
                    {completed ? (
                      <span className="text-emerald-300 inline-flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Megszerezve
                      </span>
                    ) : (
                      <span className="text-slate-400 inline-flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        Még zárva
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-300/30 bg-[#122643]/90 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="font-display text-lg sm:text-xl font-bold text-white">
              Az öt arany varázspecsét teljesítve!
            </span>
          </div>
          <div className="flex items-center gap-1.5" aria-label="Öt megszerzett varázspecsét">
            {DOORS.map((door) => (
              <GoldenSealBadge key={door.id} number={door.doorNumber} unlocked size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* STRICT SECRECY: Before 5 seals -> mystery guide. After 5 seals -> Sealed Gift Box -> Animation -> Photo 1 -> Photo 2 */}
      {!giftReady ? (
        <CsillagManoGuide
          speakerLabel="A nagy titok őrzője"
          message="Amíg mind az öt arany varázspecsét a gyűjtőbe nem kerül, a meglepetés szigorúan titkos marad! Nyissátok ki sorban az ajtókat!"
        />
      ) : openingAnimation ? (
        <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-[#1E3B68] to-[#0F223D] p-10 sm:p-14 text-center shadow-2xl space-y-5">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-400/20 animate-seal-pop shadow-xl shadow-amber-400/30">
            <Sparkles className="h-14 w-14 text-amber-300 animate-twinkle" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-amber-200">
            A varázslat feltárul...
          </h2>
        </section>
      ) : !showFinal ? (
        <section className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1A355B] to-[#0F223D] p-8 sm:p-12 text-center shadow-2xl space-y-6">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>Mind az öt varázspecsét összegyűlt!</span>
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Megérkezett a lezárt titkos ajándékdoboz!
          </h2>
          <p className="text-lg text-slate-200 max-w-xl mx-auto">
            Kattintsatok a gombra, és tárjátok fel együtt a 3. b osztály nagy meglepetését!
          </p>

          <div className="flex justify-center py-2">
            <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-amber-300/70 bg-[#122643] px-8 sm:px-12 py-8 shadow-2xl space-y-5">
              <svg
                viewBox="0 0 140 140"
                className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-[0_10px_25px_rgba(251,191,36,0.45)] animate-gentle-float"
                aria-hidden="true"
              >
                <rect
                  x="22"
                  y="54"
                  width="96"
                  height="68"
                  rx="10"
                  fill="#DC2626"
                  stroke="#FEF08A"
                  strokeWidth="3"
                />
                <rect
                  x="16"
                  y="38"
                  width="108"
                  height="22"
                  rx="7"
                  fill="#B91C1C"
                  stroke="#FEF08A"
                  strokeWidth="3"
                />
                <rect x="61" y="38" width="18" height="84" fill="#FBBF24" />
                <rect x="22" y="76" width="96" height="14" fill="#FBBF24" />
                <path
                  d="M70 38 C56 16 32 22 40 35 C46 42 62 38 70 38 Z M70 38 C84 16 108 22 100 35 C94 42 78 38 70 38 Z"
                  fill="#FBBF24"
                  stroke="#FEF9C3"
                  strokeWidth="2.5"
                />
              </svg>

              <button
                type="button"
                onClick={handleRevealSecretClick}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl sm:text-2xl font-bold text-[#0B192C] shadow-xl hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Gift className="w-6 h-6" />
                <span>Felfedjük a titkot!</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1B3358] to-[#11223B] p-5 sm:p-7 shadow-2xl space-y-6">
          {/* FIRST PHOTO + HEADLINE: Fit together cleanly without scrolling (including fullscreen) */}
          <div className="space-y-4 animate-seal-pop">
            <div className="flex justify-center">
              {!trainPhotoError ? (
                <img
                  src={FINAL_TRAIN_PHOTO}
                  alt="Az ünnepi fényekkel díszített valódi Mikulásvonat"
                  referrerPolicy="no-referrer"
                  onError={() => setTrainPhotoError(true)}
                  className="block max-h-[43vh] w-auto max-w-full rounded-2xl border-2 border-amber-300/70 bg-[#0B192C] shadow-2xl"
                />
              ) : (
                <div className="flex h-56 w-full max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-amber-300/70 bg-[#0B192C] p-6 text-center">
                  <Sparkles className="h-12 w-12 text-amber-300 mb-3" />
                  <p className="font-display text-2xl font-bold text-amber-100">
                    Diósgyőri Mikulásvonat
                  </p>
                </div>
              )}
            </div>

            <div className="mx-auto max-w-3xl text-center space-y-2.5">
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-amber-300 tracking-wide">
                {FINAL_CONGRATULATIONS_LINES[0]}
              </h2>
              <p className="font-display text-xl sm:text-2xl font-bold text-white">
                {FINAL_CONGRATULATIONS_LINES[1]}
              </p>
              <div className="rounded-2xl border-2 border-amber-300/80 bg-red-700/95 px-5 py-3.5 text-white shadow-xl">
                <p className="font-display text-xl sm:text-3xl font-bold tracking-wide">
                  {FINAL_CONGRATULATIONS_LINES[2]}
                </p>
              </div>
            </div>
          </div>

          {/* SECOND PHOTO STEP */}
          {!gameState.secondPhotoRevealed ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleRevealSecondPhoto}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-7 py-3.5 text-lg sm:text-xl font-bold text-[#0B192C] shadow-xl hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Nézzük meg, milyen kaland vár ránk!</span>
              </button>
            </div>
          ) : (
            <div
              ref={secondPhotoSectionRef}
              className="space-y-4 border-t border-amber-300/25 pt-6 animate-seal-pop"
            >
              <div className="flex justify-center">
                {!forestPhotoError ? (
                  <img
                    src={FINAL_FOREST_PHOTO}
                    alt="Havas, ünnepi fényekkel megvilágított erdei helyszín"
                    referrerPolicy="no-referrer"
                    onError={() => setForestPhotoError(true)}
                    className="block max-h-[54vh] w-auto max-w-full rounded-2xl border-2 border-amber-300/70 bg-[#0B192C] shadow-2xl"
                  />
                ) : (
                  <div className="flex h-56 w-full max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-amber-300/70 bg-[#0B192C] p-6 text-center">
                    <Sparkles className="h-12 w-12 text-amber-300 mb-3" />
                    <p className="font-display text-2xl font-bold text-amber-100">
                      Ünnepi erdei helyszín
                    </p>
                  </div>
                )}
              </div>

              <p className="mx-auto max-w-3xl text-center font-display text-xl sm:text-2xl font-bold text-amber-200 leading-relaxed">
                {FINAL_SECOND_CAPTION}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
