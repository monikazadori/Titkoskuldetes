import React from 'react';
import { ArrowRight, CheckCircle2, DoorOpen, MailOpen, Sparkles } from 'lucide-react';
import { ASSETS, LETTER_PARAGRAPHS } from '../data/missions';
import { OneDayGameState } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { CsillagManoGuide } from './CsillagManoGuide';

interface LetterQuestViewProps {
  gameState: OneDayGameState;
  onOpenLetter: () => void;
  onSelectTf1: (val: boolean) => void;
  onSelectTf2: (val: boolean) => void;
  onCheckAnswers: () => void;
  onEnterDoor1: () => void;
  onBackToDoors: () => void;
}

export const LetterQuestView: React.FC<LetterQuestViewProps> = ({
  gameState,
  onOpenLetter,
  onSelectTf1,
  onSelectTf2,
  onCheckAnswers,
  onEnterDoor1,
  onBackToDoors,
}) => {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Bevezető · A Titkok Őrzőjének üzenete
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            A titkos levél
          </h1>
        </div>
        {gameState.letterChallengeSolved && (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="w-5 h-5" />
            <span>Az első varázsajtó nyitva áll!</span>
          </span>
        )}
      </div>

      {!gameState.letterOpened ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-amber-300/30 bg-[#122643]/95 p-6 sm:p-10 shadow-xl">
          <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-amber-300/30 bg-[#0B192C]">
            <img
              src={ASSETS.sealedScroll}
              alt="Arany csillagpecséttel lezárt titkos levél"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Szigorúan titkos küldemény!
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Lezárt levél a 3. b osztálynak
            </h2>
            <p className="text-lg leading-relaxed text-slate-200">
              Csillag egy arany csillagpecséttel lezárt tekercset talált a havas kastély kapuja
              előtt. Nyissátok ki együtt, és figyeljetek minden egyes mondatára!
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSealUnlock();
                onOpenLetter();
              }}
              className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MailOpen className="w-6 h-6" />
              <span>Levél kinyitása</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sealed parchment letter */}
          <div className="mx-auto max-w-3xl rounded-3xl border-2 border-amber-400/60 bg-[#FFF8EB] p-8 sm:p-12 text-[#1E1B18] shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-900/15 pb-4 mb-6">
              <span className="font-display text-xl font-bold tracking-wide text-red-800">
                SZIGORÚAN TITKOS!
              </span>
              <span className="text-sm font-semibold text-amber-800">3. b osztály</span>
            </div>

            <div className="space-y-4 text-lg sm:text-xl leading-relaxed font-medium">
              <p className="font-display text-2xl font-bold text-red-800">
                Kedves 3. b osztály!
              </p>
              {LETTER_PARAGRAPHS.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
              <p className="font-bold text-red-900">
                De vigyázzatok! Nem minden nyom jelenti azt, aminek első pillantásra látszik!
              </p>
              <p>Vajon sikerül megfejtenetek a titkot?</p>
              <p>Sok sikert kívánok!</p>
              <p className="pt-3 font-display text-2xl font-bold text-red-800">
                A Titkok Őrzője
              </p>
            </div>
          </div>

          <CsillagManoGuide message="Olvastátok a levelet? Válaszoljatok együtt a két igaz–hamis kérdésre, és már nyílik is az első varázsajtó!" />

          {/* Two True/False Questions */}
          <div className="mx-auto max-w-3xl rounded-3xl border border-amber-300/35 bg-[#122643]/95 p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Közös ellenőrző kérdések az 1. ajtóhoz
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                Igaz vagy hamis?
              </h2>
            </div>

            {/* Question 1 */}
            <div className="rounded-2xl border border-white/10 bg-[#0D1E36]/90 p-5 sm:p-6 space-y-4">
              <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                1. „A titok megfejtéséhez öt varázspecsétet kell összegyűjtenünk.”
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'IGAZ', val: true },
                  { label: 'HAMIS', val: false },
                ].map((opt) => {
                  const selected = gameState.tf1Answer === opt.val;
                  const solvedCorrect = gameState.letterChallengeSolved && opt.val === true;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={gameState.letterChallengeSolved}
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectTf1(opt.val);
                      }}
                      className={`min-w-[140px] rounded-xl border-2 px-6 py-3.5 text-lg font-bold transition-all cursor-pointer disabled:cursor-default ${
                        solvedCorrect
                          ? 'border-emerald-400 bg-emerald-600 text-white'
                          : selected
                          ? 'border-amber-300 bg-amber-400 text-[#0B192C]'
                          : 'border-white/20 bg-white/5 text-slate-100 hover:bg-white/15'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 2 */}
            <div className="rounded-2xl border border-white/10 bg-[#0D1E36]/90 p-5 sm:p-6 space-y-4">
              <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                2. „A küldetés során a csapatoknak egymással versenyezve kell megszerezniük a pecséteket.”
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'IGAZ', val: true },
                  { label: 'HAMIS', val: false },
                ].map((opt) => {
                  const selected = gameState.tf2Answer === opt.val;
                  const solvedCorrect = gameState.letterChallengeSolved && opt.val === false;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={gameState.letterChallengeSolved}
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectTf2(opt.val);
                      }}
                      className={`min-w-[140px] rounded-xl border-2 px-6 py-3.5 text-lg font-bold transition-all cursor-pointer disabled:cursor-default ${
                        solvedCorrect
                          ? 'border-emerald-400 bg-emerald-600 text-white'
                          : selected
                          ? 'border-amber-300 bg-amber-400 text-[#0B192C]'
                          : 'border-white/20 bg-white/5 text-slate-100 hover:bg-white/15'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {gameState.tfHint && !gameState.letterChallengeSolved && (
              <div
                role="alert"
                className="rounded-2xl border border-amber-400/50 bg-amber-950/75 p-4 text-base font-semibold text-amber-100"
              >
                {gameState.tfHint}
              </div>
            )}

            {!gameState.letterChallengeSolved ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={onCheckAnswers}
                  className="inline-flex items-center gap-3 rounded-2xl bg-emerald-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Válaszok ellenőrzése</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-emerald-400/70 bg-emerald-950/60 p-6 text-center space-y-4">
                <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Mindkét válasz helyes!</span>
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Kinyílt az első varázsajtó!
                </h3>
                <div className="flex flex-wrap justify-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onEnterDoor1();
                    }}
                    className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] shadow-lg hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    <DoorOpen className="w-6 h-6" />
                    <span>Belépés az 1. ajtóba</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onBackToDoors();
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <span>Vissza a kastélyhoz</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
