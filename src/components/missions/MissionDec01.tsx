import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MailOpen,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  FINAL_CONGRATULATIONS_LINES,
  FINAL_REWARD_IMAGE,
  MISSIONS,
  TEAMS,
} from '../../data/missions';
import { TeamId } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { loadMissionState, saveMissionState } from '../../utils/storage';
import { ConfettiCanvas } from '../ConfettiCanvas';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { GoldenSealBadge } from '../GoldenSealBadge';

interface MissionDec01SavedState extends Record<string, unknown> {
  stage: 1 | 2 | 3 | 4;
  senderSelections: Record<string, string>;
  senderTeamStates: Record<string, { solved: boolean; hint: string | null }>;
  senderWord: string;
  senderWordSolved: boolean;
  senderWordHint: string | null;
  envelopeOpened: boolean;
  part1Choice: string | null;
  part2Choice: string | null;
  finalWord: string;
  finalPuzzleHint: string | null;
  isReplaying: boolean;
}

interface MissionDec01Props {
  alreadyCompleted: boolean;
  onComplete: () => void;
  onTeamSolved: (teamId: TeamId) => void;
  onBackToOverview: () => void;
}

// Step 2: 5 teams solve 5 clues to reveal the sender's identity: M I K U L Á S
const SENDER_CLUES: {
  teamId: TeamId;
  question: string;
  options: string[];
  correct: string;
  hint: string;
  revealedLetters: string;
}[] = [
  {
    teamId: 'hopihe',
    question: 'Melyik betűvel kezdődik a „MÉZESKALÁCS” és a „MEGLEPETÉS” szó is?',
    options: ['K', 'M', 'S'],
    correct: 'M',
    hint: 'Ejtsétek ki hangosan: M-ézeskalács, M-eglepetés!',
    revealedLetters: '1. betű: M',
  },
  {
    teamId: 'csillagmanok',
    question:
      'Mennyi 48 : 8 − 4? A „TITOK” szó pontosan ennyiedik betűje a következő betű!',
    options: ['I', 'O', 'T'],
    correct: 'I',
    hint: 'Előbb számoljatok: 48 : 8 = 6, 6 − 4 = 2. Melyik a TITOK szó 2. betűje?',
    revealedLetters: '2. betű: I',
  },
  {
    teamId: 'mezeskalacs',
    question: 'Melyik két betű áll a „KULCS” szó elején?',
    options: ['K és U', 'L és C', 'C és S'],
    correct: 'K és U',
    hint: 'Nézzétek a szó első két betűjét: K-U-L-C-S!',
    revealedLetters: '3–4. betű: K U',
  },
  {
    teamId: 'renszarvas',
    question: 'Melyik két betű áll a téli „LÁMPÁS” szó elején?',
    options: ['L és Á', 'M és P', 'Á és S'],
    correct: 'L és Á',
    hint: 'Nézzétek a LÁMPÁS szó első két betűjét: L-Á-M-P-Á-S!',
    revealedLetters: '5–6. betű: L Á',
  },
  {
    teamId: 'aranycsengok',
    question: 'Melyik mássalhangzóra végződik az „ÉDES” és a „HAVAS” szó is?',
    options: ['S', 'T', 'Z'],
    correct: 'S',
    hint: 'Hallgassátok a szó végét: éde-S, hava-S!',
    revealedLetters: '7. betű: S',
  },
];

const SENDER_KEYPAD = ['M', 'I', 'K', 'U', 'L', 'Á', 'S', 'T', 'É', 'R'];
const FINAL_KEYPAD = ['M', 'I', 'K', 'U', 'L', 'Á', 'S', 'V', 'O', 'N', 'A', 'T', 'É', 'R'];

export const MissionDec01: React.FC<MissionDec01Props> = ({
  alreadyCompleted,
  onComplete,
  onTeamSolved,
  onBackToOverview,
}) => {
  const [savedInitial] = useState<Partial<MissionDec01SavedState> | null>(() =>
    loadMissionState<MissionDec01SavedState>('dec-01')
  );
  const resumeCompletedView = alreadyCompleted && !savedInitial?.isReplaying;

  const [isReplaying, setIsReplaying] = useState<boolean>(() =>
    Boolean(savedInitial?.isReplaying)
  );
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(() => {
    if (resumeCompletedView) return 4;
    if (savedInitial?.stage && [1, 2, 3, 4].includes(savedInitial.stage)) {
      return savedInitial.stage;
    }
    return 1;
  });

  // Stage 2: Discover sender = MIKULÁS
  const [senderSelections, setSenderSelections] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.senderSelections ?? {})
  );
  const [senderTeamStates, setSenderTeamStates] = useState<
    Record<string, { solved: boolean; hint: string | null }>
  >(() => (resumeCompletedView ? {} : (savedInitial?.senderTeamStates ?? {})));
  const [senderWord, setSenderWord] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.senderWord ?? '')
  );
  const [senderWordSolved, setSenderWordSolved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.senderWordSolved)
  );
  const [senderWordHint, setSenderWordHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.senderWordHint ?? null)
  );

  // Stage 3: Second sealed envelope ("Már csak egyetlen titok maradt!") -> MIKULÁSVONAT
  const [envelopeOpened, setEnvelopeOpened] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.envelopeOpened)
  );
  const [part1Choice, setPart1Choice] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.part1Choice ?? null)
  );
  const [part2Choice, setPart2Choice] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.part2Choice ?? null)
  );
  const [finalWord, setFinalWord] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.finalWord ?? '')
  );
  const [finalPuzzleHint, setFinalPuzzleHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.finalPuzzleHint ?? null)
  );

  const previousClues = MISSIONS.slice(0, 4);

  useEffect(() => {
    saveMissionState<MissionDec01SavedState>('dec-01', {
      stage,
      senderSelections,
      senderTeamStates,
      senderWord,
      senderWordSolved,
      senderWordHint,
      envelopeOpened,
      part1Choice,
      part2Choice,
      finalWord,
      finalPuzzleHint,
      isReplaying,
    });
  }, [
    stage,
    senderSelections,
    senderTeamStates,
    senderWord,
    senderWordSolved,
    senderWordHint,
    envelopeOpened,
    part1Choice,
    part2Choice,
    finalWord,
    finalPuzzleHint,
    isReplaying,
  ]);

  const handleReplay = () => {
    soundEngine.playClick();
    saveMissionState<MissionDec01SavedState>('dec-01', {
      stage: 1,
      senderSelections: {},
      senderTeamStates: {},
      senderWord: '',
      senderWordSolved: false,
      senderWordHint: null,
      envelopeOpened: false,
      part1Choice: null,
      part2Choice: null,
      finalWord: '',
      finalPuzzleHint: null,
      isReplaying: true,
    });
    setIsReplaying(true);
    setStage(1);
    setSenderSelections({});
    setSenderTeamStates({});
    setSenderWord('');
    setSenderWordSolved(false);
    setSenderWordHint(null);
    setEnvelopeOpened(false);
    setPart1Choice(null);
    setPart2Choice(null);
    setFinalWord('');
    setFinalPuzzleHint(null);
  };

  const checkAllSenderTeams = () => {
    let allOk = true;
    const next: Record<string, { solved: boolean; hint: string | null }> = {};
    for (const c of SENDER_CLUES) {
      const picked = senderSelections[c.teamId];
      if (picked === c.correct) {
        next[c.teamId] = { solved: true, hint: null };
        onTeamSolved(c.teamId);
      } else {
        allOk = false;
        next[c.teamId] = {
          solved: false,
          hint: picked ? c.hint : 'Válasszatok egy megoldást ennél a csapatnál is!',
        };
      }
    }
    setSenderTeamStates(next);
    if (allOk) {
      soundEngine.playSuccess();
    } else {
      soundEngine.playGentleHint();
    }
  };

  const allSenderTeamsSolved = SENDER_CLUES.every((c) => senderTeamStates[c.teamId]?.solved);

  const checkSenderName = () => {
    if (senderWord.trim().toUpperCase() === 'MIKULÁS') {
      soundEngine.playSealUnlock();
      setSenderWordSolved(true);
      setSenderWordHint(null);
    } else {
      soundEngine.playGentleHint();
      setSenderWordHint(
        'Rakjátok sorba az öt csapat betűit 1-től 7-ig: M – I – K – U – L – Á – S!'
      );
    }
  };

  const checkFinalMystery = () => {
    if (part1Choice !== '27') {
      soundEngine.playGentleHint();
      setFinalPuzzleHint(
        'Az első részfeladatnál számoljátok újra: a 3. b 25 tanulója + 2 kísérő = 27 fő!'
      );
      return;
    }
    if (part2Choice !== 'Síneken haladó ünnepi jármű') {
      soundEngine.playGentleHint();
      setFinalPuzzleHint(
        'A második részfeladatnál zárjátok ki a szánt és a kerékpárt: 27 fő kényelmesen, együtt utazhat rajta!'
      );
      return;
    }
    if (finalWord.trim().toUpperCase() !== 'MIKULÁSVONAT') {
      soundEngine.playGentleHint();
      setFinalPuzzleHint(
        'A harmadik résznél kapcsoljátok össze a feladó nevét (MIKULÁS) és a különleges járművet (VONAT) egybeírva!'
      );
      return;
    }

    soundEngine.playGrandVictory();
    setIsReplaying(false);
    onComplete();
    setStage(4);
  };

  return (
    <div className="space-y-8">
      <ConfettiCanvas active={stage === 4} />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            5. küldetés · December 1.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Az ötödik pecsét
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {[
            { num: 1, label: 'Nyomok áttekintése' },
            { num: 2, label: 'A feladó kiléte' },
            { num: 3, label: 'Az utolsó boríték' },
            { num: 4, label: 'A nagy leleplezés' },
          ].map((s) => {
            const unlockedStep = s.num <= stage || (alreadyCompleted && !isReplaying);
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (unlockedStep) setStage(s.num as 1 | 2 | 3 | 4);
                }}
                className={`rounded-xl px-3.5 py-2 transition-colors ${
                  stage === s.num
                    ? 'bg-amber-400 text-[#0B192C] font-bold'
                    : unlockedStep
                    ? 'bg-emerald-500/20 text-emerald-200 cursor-pointer'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {s.num}. {s.label}
              </button>
            );
          })}

          {alreadyCompleted && (
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/45 bg-amber-500/15 px-3.5 py-2 text-amber-100 hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Küldetés újrajátszása</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage 1: Review the 4 gathered clues */}
      {stage === 1 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Elérkezett december 1-je! Nézzük át az elmúlt négy nap megszerzett nyomait, aztán fejtsük meg együtt, ki is valójában a Titkok Őrzője!" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousClues.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border border-amber-400/40 bg-[#142B4C] p-5"
              >
                <GoldenSealBadge number={m.dayNumber} unlocked size="sm" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    {m.dateLabel} · {m.dayNumber}. nyom
                  </p>
                  <p className="font-display text-xl font-bold text-white mt-1">
                    „{m.clueText}”
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStage(2);
              }}
              className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
            >
              <span>Fejtsük meg a Titkok Őrzőjének nevét!</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Reveal sender identity = MIKULÁS */}
      {stage === 2 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Minden csapat szerez egy betűnyomot! Ha mind az öt csapat kész, rakjátok ki együtt a titokzatos feladó valódi nevét!" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {SENDER_CLUES.map((c) => {
              const team = TEAMS.find((t) => t.id === c.teamId)!;
              const state = senderTeamStates[c.teamId];
              const solved = state?.solved ?? false;

              return (
                <div
                  key={c.teamId}
                  className={`rounded-3xl border-2 p-6 ${
                    solved
                      ? 'border-emerald-400 bg-[#12352C] text-white'
                      : 'border-amber-300/25 bg-[#FFF8EB] text-[#1E1B18]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${
                        solved ? 'text-emerald-300' : 'text-red-700'
                      }`}
                    >
                      {team.name}
                    </p>
                    {solved && <CheckCircle2 className="w-7 h-7 text-emerald-300" />}
                  </div>

                  <h3 className="mt-2 font-display text-xl font-bold">{c.question}</h3>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {c.options.map((opt) => {
                      const active = senderSelections[c.teamId] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={solved}
                          onClick={() => {
                            soundEngine.playClick();
                            setSenderSelections((prev) => ({ ...prev, [c.teamId]: opt }));
                          }}
                          className={`rounded-xl border-2 px-5 py-3 text-base font-bold cursor-pointer ${
                            solved && opt === c.correct
                              ? 'border-emerald-300 bg-emerald-500 text-white'
                              : active
                              ? 'border-red-600 bg-red-600 text-white'
                              : solved
                              ? 'border-white/15 bg-white/5 text-slate-300'
                              : 'border-amber-900/20 bg-white text-[#1E1B18] hover:border-amber-600'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {solved && (
                    <div className="mt-4 rounded-xl border border-amber-300/50 bg-[#0B241E] p-3.5 text-sm font-semibold text-amber-100">
                      ✨ Betűnyom: <span className="font-bold text-amber-300">{c.revealedLetters}</span>
                    </div>
                  )}

                  {state?.hint && !solved && (
                    <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">
                      Segítség: {state.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!allSenderTeamsSolved ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={checkAllSenderTeams}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>Csapatnyomok ellenőrzése</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-amber-400 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18] space-y-5">
              <h3 className="font-display text-2xl font-bold text-center text-red-800">
                Ki a Titkok Őrzője? Írjátok be a 7 betűs megfejtést!
              </h3>

              <div className="flex flex-wrap justify-center gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-xl border-2 border-red-700 bg-white font-display text-2xl sm:text-3xl font-bold text-red-800"
                  >
                    {senderWord[idx] ?? '_'}
                  </div>
                ))}
                {!senderWordSolved && senderWord.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSenderWord((prev) => prev.slice(0, -1))}
                    className="rounded-xl border border-slate-300 bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    aria-label="Utolsó betű törlése"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!senderWordSolved && (
                <div className="flex flex-wrap justify-center gap-2">
                  {SENDER_KEYPAD.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => {
                        if (senderWord.length >= 7) return;
                        soundEngine.playClick();
                        setSenderWord((prev) => prev + letter);
                      }}
                      className="h-12 min-w-[48px] rounded-xl bg-[#0B192C] px-3 text-lg font-bold text-amber-200 hover:bg-[#19355A] cursor-pointer"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}

              {senderWordHint && (
                <p className="rounded-xl bg-amber-100 p-4 text-center text-base font-semibold text-amber-950">
                  Segítség: {senderWordHint}
                </p>
              )}

              <div className="flex justify-center">
                {!senderWordSolved ? (
                  <button
                    type="button"
                    onClick={checkSenderName}
                    className="rounded-2xl bg-emerald-700 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-600 cursor-pointer"
                  >
                    Feladó ellenőrzése
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSealUnlock();
                      setStage(3);
                    }}
                    className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-red-500 cursor-pointer"
                  >
                    <span>A Titkok Őrzője a MIKULÁS! Tovább az utolsó borítékhoz!</span>
                    <ArrowRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 3: Second Sealed Envelope ("Már csak egyetlen titok maradt!") -> MIKULÁSVONAT */}
      {stage === 3 && (
        <div className="space-y-6">
          {!envelopeOpened ? (
            <div className="mx-auto max-w-2xl rounded-3xl border-2 border-amber-400 bg-[#FFF8EB] p-8 sm:p-12 text-center text-[#1E1B18] shadow-2xl space-y-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-700 text-amber-300 shadow-lg">
                <MailOpen className="w-12 h-12" />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-red-700">
                Újabb lezárt boríték érkezett!
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1E1B18]">
                „Már csak egyetlen titok maradt!”
              </h2>
              <p className="text-lg text-slate-700">
                Most már tudjátok, hogy a Mikulás küldte a próbákat! Nyissátok ki ezt az
                utolsó, többrészes rejtvényt rejtő borítékot!
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSealUnlock();
                  setEnvelopeOpened(true);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-red-500 cursor-pointer"
              >
                <MailOpen className="w-6 h-6" />
                <span>Utolsó boríték kinyitása</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <CsillagManoGuide message="Oldjátok meg az utolsó boríték mindhárom részfeladatát, és rakjátok ki a nagy meglepetés pontos szavát!" />

              {/* Part 1 */}
              <div className="rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 text-[#1E1B18] space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                  1. részfeladat · Osztálylét­szám
                </p>
                <h3 className="font-display text-xl font-bold">
                  A 3. b osztály 25 tanulója és 2 felnőtt kísérője együtt indul útnak ma. Hányan
                  lesztek összesen?
                </h3>
                <div className="flex flex-wrap gap-3">
                  {['25', '26', '27', '28'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setPart1Choice(opt);
                      }}
                      className={`min-w-[80px] rounded-xl border-2 px-5 py-3 text-lg font-bold cursor-pointer ${
                        part1Choice === opt
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-amber-900/20 bg-white hover:border-amber-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Part 2 */}
              <div className="rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 text-[#1E1B18] space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                  2. részfeladat · Kizárásos következtetés
                </p>
                <h3 className="font-display text-xl font-bold">
                  27 ember télen együtt, melegben, kényelmesen utazik el egy varázslatos helyre.
                  Mivel? (Nem szán, nem kerékpár, nem repülő!)
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    'Egyszemélyes szánkóval',
                    'Síneken haladó ünnepi jármű',
                    'Téli hőlégballonnal',
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setPart2Choice(opt);
                      }}
                      className={`rounded-xl border-2 px-5 py-3 text-base font-bold cursor-pointer ${
                        part2Choice === opt
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-amber-900/20 bg-white hover:border-amber-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Part 3: Final word assembly -> MIKULÁSVONAT */}
              <div className="rounded-3xl border-2 border-amber-400 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18] space-y-5">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                  3. részfeladat · A végső szó összeállítása (12 betű)
                </p>
                <h3 className="font-display text-2xl font-bold">
                  Mi a nagy meglepetés neve? (A feladó neve + a jármű neve egybeírva!)
                </h3>

                <div className="flex flex-wrap justify-center gap-1.5">
                  {Array.from({ length: 12 }, (_, idx) => (
                    <div
                      key={idx}
                      className="flex h-12 w-10 sm:h-14 sm:w-12 items-center justify-center rounded-xl border-2 border-red-700 bg-white font-display text-xl sm:text-2xl font-bold text-red-800"
                    >
                      {finalWord[idx] ?? '_'}
                    </div>
                  ))}
                  {finalWord.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFinalWord((prev) => prev.slice(0, -1))}
                      className="rounded-xl border border-slate-300 bg-slate-100 px-3 text-slate-700 hover:bg-slate-200 cursor-pointer"
                      aria-label="Utolsó betű törlése"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {FINAL_KEYPAD.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => {
                        if (finalWord.length >= 12) return;
                        soundEngine.playClick();
                        setFinalWord((prev) => prev + letter);
                      }}
                      className="h-12 min-w-[46px] rounded-xl bg-[#0B192C] px-3 text-lg font-bold text-amber-200 hover:bg-[#19355A] cursor-pointer"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {finalPuzzleHint && (
                <CsillagManoGuide
                  speakerLabel="Segítség"
                  message={finalPuzzleHint}
                  tone="hint"
                />
              )}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={checkFinalMystery}
                  className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-10 py-5 text-2xl font-bold text-white shadow-2xl hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Sparkles className="w-7 h-7" />
                  <span>Meglepetés feloldása!</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 4: Grand Reveal — Santa + Train + Exact Required Text */}
      {stage === 4 && (
        <div className="space-y-8">
          <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1A355B] to-[#0E2038] p-6 sm:p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex flex-wrap justify-center gap-3 mb-5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <GoldenSealBadge key={num} number={num} unlocked size="sm" />
                ))}
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-amber-300">
                {FINAL_CONGRATULATIONS_LINES[0]}
              </h2>
              <p className="mt-3 text-xl sm:text-3xl font-bold text-white">
                {FINAL_CONGRATULATIONS_LINES[1]}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 overflow-hidden rounded-3xl border-2 border-amber-300/50 shadow-2xl">
                <img
                  src={FINAL_REWARD_IMAGE}
                  alt="A Mikulás és egy gyönyörű ünnepi vonat a téli erdőben"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
                <p className="text-xl font-bold uppercase tracking-wider text-amber-300">
                  {FINAL_CONGRATULATIONS_LINES[2]}
                </p>

                <div className="rounded-3xl border-2 border-amber-300 bg-red-700 p-6 text-white shadow-xl">
                  <p className="font-display text-2xl sm:text-3xl font-bold leading-snug">
                    {FINAL_CONGRATULATIONS_LINES[3]}
                  </p>
                </div>

                <p className="font-display text-2xl font-bold text-amber-200 pt-2">
                  {FINAL_CONGRATULATIONS_LINES[4]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-500/15 px-7 py-4 text-lg font-semibold text-amber-100 hover:bg-amber-500/25 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Küldetés újrajátszása</span>
            </button>

            <button
              type="button"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-lg font-semibold text-white hover:bg-white/15 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Vissza az öt varázsajtóhoz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
