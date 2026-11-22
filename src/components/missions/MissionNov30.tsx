import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { TEAMS } from '../../data/missions';
import { TeamId } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { loadMissionState, saveMissionState } from '../../utils/storage';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { MissionCompleteBanner } from '../MissionCompleteBanner';

interface MissionNov30SavedState extends Record<string, unknown> {
  stage: 1 | 2 | 3 | 4;
  soundChoices: Record<string, string>;
  soundStates: Record<string, { solved: boolean; hint: string | null }>;
  decodedLetters: string[];
  activeSlot: number;
  cipherSolved: boolean;
  cipherHint: string | null;
  teamChoices: Record<string, string>;
  teamStates: Record<string, { solved: boolean; hint: string | null }>;
  finalWordPick: string;
  finalWordSolved: boolean;
  finalWordHint: string | null;
  isReplaying: boolean;
}

interface MissionNov30Props {
  alreadyCompleted: boolean;
  onComplete: () => void;
  onTeamSolved: (teamId: TeamId) => void;
  onBackToOverview: () => void;
  onGoToClues: () => void;
  onReplayMission?: () => void;
}

// STRICT SECRECY: Strictly winter/nature sounds — zero train horns or train sounds
const SOUND_CHALLENGES: {
  id: 'csengo' | 'szel' | 'ho' | 'harang';
  title: string;
  options: string[];
  correct: string;
  hint: string;
}[] = [
  {
    id: 'csengo',
    title: '1. titkos hang',
    options: ['Csengőszó', 'Téli szél', 'Ropogó hó'],
    correct: 'Csengőszó',
    hint: 'Hallgassátok meg újra! Magas, csilingelő ünnepi hangot hallunk.',
  },
  {
    id: 'szel',
    title: '2. titkos hang',
    options: ['Toronyóra harangja', 'Téli szél süvítése', 'Csengőszó'],
    correct: 'Téli szél süvítése',
    hint: 'Ez egy lágyan hullámzó, suhogó természeti hang a téli erdőből.',
  },
  {
    id: 'ho',
    title: '3. titkos hang',
    options: ['Ropogó hó léptei', 'Toronyóra harangja', 'Téli szél'],
    correct: 'Ropogó hó léptei',
    hint: 'Négy ritmusos roppanást hallhattok, mintha valaki friss hóban sétálna.',
  },
  {
    id: 'harang',
    title: '4. titkos hang',
    options: ['Ropogó hó', 'Csengőszó', 'Toronyóra harangja'],
    correct: 'Toronyóra harangja',
    hint: 'Mélyebb, háromszor megkonduló kongást hallotok.',
  },
];

const CIPHER_MAP: { code: string; letter: string }[] = [
  { code: '❄️', letter: 'K' },
  { code: '🌟', letter: 'A' },
  { code: '🎄', letter: 'L' },
  { code: '🔔', letter: 'N' },
  { code: '🕯️', letter: 'D' },
];
const CIPHER_SEQUENCE = ['❄️', '🌟', '🎄', '🌟', '🔔', '🕯️']; // K A L A N D

// Stage 3: Each team decodes a word AND unlocks 1 letter of the final Nov 30 keyword "TITOK"
const TEAM_CIPHERS: {
  teamId: TeamId;
  coded: string;
  options: string[];
  correct: string;
  hint: string;
  earnedLetter: string;
  letterPos: number;
}[] = [
  {
    teamId: 'hopihe',
    coded: 'H Ó _ S É S',
    options: ['HÓESÉS', 'HÓEMBER', 'HÓVIRÁG'],
    correct: 'HÓESÉS',
    hint: 'Télen hull az égből, csendben betakarja a tájat.',
    earnedLetter: 'T',
    letterPos: 1,
  },
  {
    teamId: 'csillagmanok',
    coded: 'M E L E G  S _ L',
    options: ['MELEG SÁL', 'MELEG SAPKA', 'MELEG TEA'],
    correct: 'MELEG SÁL',
    hint: 'A nyakunk köré tekerjük, mielőtt kilépünk a hidegbe!',
    earnedLetter: 'I',
    letterPos: 2,
  },
  {
    teamId: 'mezeskalacs',
    coded: 'C S I L L _ G F É N Y',
    options: ['CSILLAGFÉNY', 'CSILLAGKÉP', 'CSILLAGPOR'],
    correct: 'CSILLAGFÉNY',
    hint: 'Az esti égboltról ragyog ránk decemberben.',
    earnedLetter: 'T',
    letterPos: 3,
  },
  {
    teamId: 'renszarvas',
    coded: 'J Ó  K _ D V',
    options: ['JÓ KEDV', 'JÓ BARÁT', 'JÓ ÚT'],
    correct: 'JÓ KEDV',
    hint: 'Ami mindig kell egy vidám közös programhoz!',
    earnedLetter: 'O',
    letterPos: 4,
  },
  {
    teamId: 'aranycsengok',
    coded: 'E G _ Ü T T',
    options: ['EGYÜTT', 'EGYEDÜL', 'EGYSZER'],
    correct: 'EGYÜTT',
    hint: 'Hogyan nyomoz a 3. b osztály minden napon?',
    earnedLetter: 'K',
    letterPos: 5,
  },
];

export const MissionNov30: React.FC<MissionNov30Props> = ({
  alreadyCompleted,
  onComplete,
  onTeamSolved,
  onBackToOverview,
  onGoToClues,
  onReplayMission,
}) => {
  const [savedInitial] = useState<Partial<MissionNov30SavedState> | null>(() =>
    loadMissionState<MissionNov30SavedState>('nov-30')
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

  const [soundChoices, setSoundChoices] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.soundChoices ?? {})
  );
  const [soundStates, setSoundStates] = useState<
    Record<string, { solved: boolean; hint: string | null }>
  >(() => (resumeCompletedView ? {} : (savedInitial?.soundStates ?? {})));

  const [decodedLetters, setDecodedLetters] = useState<string[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.decodedLetters)
      ? ['', '', '', '', '', '']
      : savedInitial.decodedLetters
  );
  const [activeSlot, setActiveSlot] = useState<number>(() =>
    resumeCompletedView || typeof savedInitial?.activeSlot !== 'number'
      ? 0
      : savedInitial.activeSlot
  );
  const [cipherSolved, setCipherSolved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.cipherSolved)
  );
  const [cipherHint, setCipherHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.cipherHint ?? null)
  );

  const [teamChoices, setTeamChoices] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.teamChoices ?? {})
  );
  const [teamStates, setTeamStates] = useState<
    Record<string, { solved: boolean; hint: string | null }>
  >(() => (resumeCompletedView ? {} : (savedInitial?.teamStates ?? {})));

  const [finalWordPick, setFinalWordPick] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.finalWordPick ?? '')
  );
  const [finalWordSolved, setFinalWordSolved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.finalWordSolved)
  );
  const [finalWordHint, setFinalWordHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.finalWordHint ?? null)
  );

  useEffect(() => {
    saveMissionState<MissionNov30SavedState>('nov-30', {
      stage,
      soundChoices,
      soundStates,
      decodedLetters,
      activeSlot,
      cipherSolved,
      cipherHint,
      teamChoices,
      teamStates,
      finalWordPick,
      finalWordSolved,
      finalWordHint,
      isReplaying,
    });
  }, [
    stage,
    soundChoices,
    soundStates,
    decodedLetters,
    activeSlot,
    cipherSolved,
    cipherHint,
    teamChoices,
    teamStates,
    finalWordPick,
    finalWordSolved,
    finalWordHint,
    isReplaying,
  ]);

  const handleReplay = () => {
    soundEngine.playClick();
    saveMissionState<MissionNov30SavedState>('nov-30', {
      stage: 1,
      soundChoices: {},
      soundStates: {},
      decodedLetters: ['', '', '', '', '', ''],
      activeSlot: 0,
      cipherSolved: false,
      cipherHint: null,
      teamChoices: {},
      teamStates: {},
      finalWordPick: '',
      finalWordSolved: false,
      finalWordHint: null,
      isReplaying: true,
    });
    setIsReplaying(true);
    setStage(1);
    setSoundChoices({});
    setSoundStates({});
    setDecodedLetters(['', '', '', '', '', '']);
    setActiveSlot(0);
    setCipherSolved(false);
    setCipherHint(null);
    setTeamChoices({});
    setTeamStates({});
    setFinalWordPick('');
    setFinalWordSolved(false);
    setFinalWordHint(null);
    onReplayMission?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkSounds = () => {
    const next: Record<string, { solved: boolean; hint: string | null }> = {};
    for (const s of SOUND_CHALLENGES) {
      const picked = soundChoices[s.id];
      if (picked === s.correct) {
        next[s.id] = { solved: true, hint: null };
      } else {
        next[s.id] = {
          solved: false,
          hint: picked ? s.hint : 'Hallgassátok meg és válasszatok egy hangot!',
        };
      }
    }
    setSoundStates(next);
    if (SOUND_CHALLENGES.every((s) => next[s.id]?.solved)) {
      soundEngine.playSuccess();
    } else {
      soundEngine.playGentleHint();
    }
  };

  const allSoundsSolved = SOUND_CHALLENGES.every((s) => soundStates[s.id]?.solved);

  const handlePickLetter = (letter: string) => {
    if (cipherSolved) return;
    soundEngine.playClick();
    const next = [...decodedLetters];
    next[activeSlot] = letter;
    setDecodedLetters(next);
    const nextEmpty = next.findIndex((l, i) => i > activeSlot && !l);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    } else if (activeSlot < 5) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const checkCipher = () => {
    const word = decodedLetters.join('');
    if (word === 'KALAND') {
      soundEngine.playSuccess();
      setCipherSolved(true);
      setCipherHint(null);
    } else {
      soundEngine.playGentleHint();
      setCipherHint(
        'Nézzétek meg alaposan a kódtáblát! ❄️=K, 🌟=A, 🎄=L, 🌟=A, 🔔=N, 🕯️=D.'
      );
    }
  };

  const checkAllTeams = () => {
    let allOk = true;
    const next: Record<string, { solved: boolean; hint: string | null }> = {};
    for (const t of TEAM_CIPHERS) {
      const picked = teamChoices[t.teamId];
      if (picked === t.correct) {
        next[t.teamId] = { solved: true, hint: null };
        onTeamSolved(t.teamId);
      } else {
        allOk = false;
        next[t.teamId] = {
          solved: false,
          hint: picked ? t.hint : 'Válasszátok ki a csapat titkos üzenetét!',
        };
      }
    }
    setTeamStates(next);
    if (allOk) {
      soundEngine.playSealUnlock();
    } else {
      soundEngine.playGentleHint();
    }
  };

  const allTeamsSolved = TEAM_CIPHERS.every((t) => teamStates[t.teamId]?.solved);

  const checkFinalWord = () => {
    if (finalWordPick === 'TITOK') {
      soundEngine.playSealUnlock();
      setFinalWordSolved(true);
      setFinalWordHint(null);
    } else {
      soundEngine.playGentleHint();
      setFinalWordHint(
        'Rakjátok össze az 5 csapat megszerzett betűit 1-től 5-ig: T – I – T – O – K!'
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            4. küldetés · November 30.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            A titkos hangok
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {[
            { num: 1, label: 'Hangfelismerés' },
            { num: 2, label: 'Betűkódfejtés' },
            { num: 3, label: 'Csapatok jelszava' },
            { num: 4, label: 'Varázspecsét' },
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

      {/* Stage 1: Sound Recognition */}
      {stage === 1 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Kapcsoljátok be a tábla hangszóróját! Hallgassátok meg mind a négy téli hangot, és találjátok ki, melyik micsoda!" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SOUND_CHALLENGES.map((s) => {
              const state = soundStates[s.id];
              const solved = state?.solved ?? false;
              return (
                <div
                  key={s.id}
                  className={`rounded-3xl border-2 p-6 ${
                    solved
                      ? 'border-emerald-400 bg-[#12352C] text-white'
                      : 'border-amber-300/25 bg-[#FFF8EB] text-[#1E1B18]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="font-display text-xl font-bold">{s.title}</h2>
                    <button
                      type="button"
                      onClick={() => soundEngine.playWinterMysterySound(s.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>Hang lejátszása</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {s.options.map((opt) => {
                      const active = soundChoices[s.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={solved}
                          onClick={() => {
                            soundEngine.playClick();
                            setSoundChoices((prev) => ({ ...prev, [s.id]: opt }));
                          }}
                          className={`rounded-xl border-2 px-4 py-3 text-left text-base font-bold cursor-pointer ${
                            solved && opt === s.correct
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

                  {state?.hint && !solved && (
                    <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">
                      Segítség: {state.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            {!allSoundsSolved ? (
              <button
                type="button"
                onClick={checkSounds}
                className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Hangok ellenőrzése
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage(2);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
              >
                <span>Remek fületek van! Irány a betűkódfejtés!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stage 2: Letter Cipher */}
      {stage === 2 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Használjátok a téli kódtáblát, és fejtsétek meg, melyik titkos szó rejtőzik a jelek mögött!" />

          <div className="rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18] space-y-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-red-700 mb-3">
                Titkos kódtábla
              </p>
              <div className="flex flex-wrap gap-3">
                {CIPHER_MAP.map((item) => (
                  <div
                    key={item.code}
                    className="flex items-center gap-3 rounded-2xl border border-amber-900/20 bg-white px-5 py-3 text-xl font-bold"
                  >
                    <span>{item.code}</span>
                    <span>=</span>
                    <span className="text-red-700">{item.letter}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                Kattints egy üres helyre, majd válaszd ki a betűt alul!
              </p>
              <div className="flex flex-wrap gap-3 justify-center py-2">
                {CIPHER_SEQUENCE.map((symbol, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={cipherSolved}
                    onClick={() => setActiveSlot(idx)}
                    className={`flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all cursor-pointer ${
                      activeSlot === idx && !cipherSolved
                        ? 'border-red-600 bg-red-50 scale-105'
                        : decodedLetters[idx]
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-amber-900/25 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{symbol}</span>
                    <span className="mt-1 font-display text-2xl font-bold text-[#1E1B18]">
                      {decodedLetters[idx] || '_'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {!cipherSolved && (
              <div className="flex flex-wrap justify-center gap-3">
                {['K', 'A', 'L', 'N', 'D'].map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handlePickLetter(letter)}
                    className="w-16 h-16 rounded-2xl bg-[#0B192C] text-2xl font-bold text-amber-200 hover:bg-[#193357] cursor-pointer"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}

            {cipherHint && (
              <p className="rounded-xl bg-amber-100 p-4 text-base font-semibold text-amber-950">
                Segítség: {cipherHint}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            {!cipherSolved ? (
              <button
                type="button"
                onClick={checkCipher}
                className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Titkos szó ellenőrzése
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage(3);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
              >
                <span>KALAND! Irány a csapatok betűvadászata!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stage 3: Team Secret Messages + Combined Keyword */}
      {stage === 3 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Minden csapat szerez egy-egy betűt a saját üzenete után! Ötötök betűiből áll össze a negyedik pecsét közös jelszava!" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {TEAM_CIPHERS.map((t) => {
              const team = TEAMS.find((tm) => tm.id === t.teamId)!;
              const state = teamStates[t.teamId];
              const solved = state?.solved ?? false;

              return (
                <div
                  key={t.teamId}
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

                  <p className="mt-2 font-mono text-2xl font-extrabold tracking-widest">
                    {t.coded}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {t.options.map((opt) => {
                      const active = teamChoices[t.teamId] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={solved}
                          onClick={() => {
                            soundEngine.playClick();
                            setTeamChoices((prev) => ({ ...prev, [t.teamId]: opt }));
                          }}
                          className={`rounded-xl border-2 px-4 py-3 text-base font-bold cursor-pointer ${
                            solved && opt === t.correct
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
                      🔑 Megszerzett betű ({t.letterPos}. hely): <span className="text-lg font-extrabold text-amber-300">{t.earnedLetter}</span>
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

          {!allTeamsSolved && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={checkAllTeams}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>Osztály együttes ellenőrzése</span>
              </button>
            </div>
          )}

          {/* Common password from 5 team letters */}
          <div className="rounded-3xl border-2 border-amber-400/50 bg-[#142B4C] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Közös zárófeladat · Az öt csapat betűi
                </p>
                <h3 className="font-display text-2xl font-bold text-white mt-1">
                  Melyik közös jelszó áll össze a csapatok megszerzett 5 betűjéből?
                </h3>
              </div>
              {!allTeamsSolved && <Lock className="w-7 h-7 text-slate-400" />}
            </div>

            {!allTeamsSolved ? (
              <p className="text-base text-slate-300">
                Előbb mind az 5 csapat szerezze meg a saját betűjét!
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-2.5">
                  {['TÁBOR', 'TITOK', 'TISZTA'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={finalWordSolved}
                      onClick={() => {
                        soundEngine.playClick();
                        setFinalWordPick(opt);
                      }}
                      className={`rounded-2xl border-2 px-7 py-3.5 text-xl font-bold cursor-pointer ${
                        finalWordSolved && opt === 'TITOK'
                          ? 'border-emerald-300 bg-emerald-500 text-white'
                          : finalWordPick === opt
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-amber-300/40 bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {finalWordHint && (
                  <p className="rounded-xl bg-amber-950/70 border border-amber-400/50 p-3.5 text-center text-base font-semibold text-amber-200">
                    {finalWordHint}
                  </p>
                )}

                <div className="flex justify-center">
                  {!finalWordSolved ? (
                    <button
                      type="button"
                      onClick={checkFinalWord}
                      className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      Jelszó ellenőrzése
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSealUnlock();
                        setIsReplaying(false);
                        onComplete();
                        setStage(4);
                      }}
                      className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
                    >
                      <Sparkles className="w-6 h-6" />
                      <span>Negyedik arany varázspecsét megszerzése!</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {stage === 4 && (
        <MissionCompleteBanner
          missionId="nov-30"
          onBackToOverview={onBackToOverview}
          onGoToClues={onGoToClues}
          onReplay={handleReplay}
        />
      )}
    </div>
  );
};
