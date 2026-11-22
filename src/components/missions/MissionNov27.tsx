import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  Star,
  Trees,
} from 'lucide-react';
import { TEAMS } from '../../data/missions';
import { TeamId } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { loadMissionState, saveMissionState } from '../../utils/storage';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { MissionCompleteBanner } from '../MissionCompleteBanner';

interface MissionNov27SavedState extends Record<string, unknown> {
  stage: 1 | 2 | 3 | 4;
  pos: { r: number; c: number };
  visited: string[];
  starsCollected: string[];
  mazeNotice: string | null;
  mazeDone: boolean;
  mathChoices: Record<string, string>;
  mathStates: Record<string, { solved: boolean; hint: string | null }>;
  teamChoices: Record<string, string>;
  teamStates: Record<string, { solved: boolean; hint: string | null }>;
  compassPick: number[];
  compassSolved: boolean;
  compassHint: string | null;
  isReplaying: boolean;
}

interface MissionNov27Props {
  alreadyCompleted: boolean;
  onComplete: () => void;
  onTeamSolved: (teamId: TeamId) => void;
  onBackToOverview: () => void;
  onGoToClues: () => void;
}

const MAZE_GRID = [
  [0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0],
  [1, 0, 0, 0, 0, 0],
];

const STAR_COORDS = ['2,1', '2,3', '3,5'];
const GOAL_COORD = '5,5';

const MATH_RIDDLES = [
  {
    id: 'm1',
    question:
      'A kastély őrei 6 kosárba pakoltak fenyőtobozt. Minden kosárba 7 toboz került, de 4 toboz kigurult a hóba. Hány toboz maradt a kosarakban?',
    options: ['38', '42', '46'],
    correct: '38',
    hint: 'Előbb szorozzatok: 6 × 7 = 42, majd vegyétek el a kigurult 4 tobozt!',
  },
  {
    id: 'm2',
    question:
      '36 mézeskalácsot osztanak szét egyenlően 4 tálcára, majd az egyik tálcáról elvesznek 3 darabot. Hány darab maradt azon a tálcán?',
    options: ['6', '9', '12'],
    correct: '6',
    hint: '36 : 4 = 9 darab jut egy tálcára. Ha elveszünk 3-at: 9 − 3 = ?',
  },
  {
    id: 'm3',
    question:
      'Csillag 120 lépést tervezett az ösvényen. Megtett már 45-öt, majd még 35-öt. Hány lépése van még hátra?',
    options: ['30', '40', '50'],
    correct: '40',
    hint: 'Előbb adjátok össze a megtett lépéseket: 45 + 35 = 80. Mennyi hiányzik 120-ig?',
  },
];

const TEAM_ROUTE_TASKS: {
  teamId: TeamId;
  question: string;
  options: string[];
  correct: string;
  hint: string;
  rewardClue: string;
}[] = [
  {
    teamId: 'hopihe',
    question: 'Az ösvény első szakasza 18 lépés, a második 27 lépés. Hány lépés ez együtt?',
    options: ['43 lépés', '45 lépés', '47 lépés'],
    correct: '45 lépés',
    hint: '18 + 20 = 38, és még 7 = 45!',
    rewardClue: '1. irányszám: 45 − 33 = 12',
  },
  {
    teamId: 'csillagmanok',
    question: 'A jelzőtáblán ez áll: 8 × 4 − 6 = ? Hány lámpás világít az út mentén?',
    options: ['24', '26', '32'],
    correct: '26',
    hint: 'Előbb a szorzás: 8 × 4 = 32, utána a kivonás: 32 − 6 = ?',
    rewardClue: '2. irányszám: 26 − 18 = 8',
  },
  {
    teamId: 'mezeskalacs',
    question: 'Ha 24 fenyőfát ültetnek 3 egyforma sorba, hány fa lesz egy sorban?',
    options: ['6', '8', '9'],
    correct: '8',
    hint: 'Osszátok el: 24 : 3 = ?',
    rewardClue: '3. irányszám: 8 : 2 = 4',
  },
  {
    teamId: 'renszarvas',
    question:
      'Ha kelet felé nézel, majd jobbra fordulsz egy negyed fordulatot, melyik égtáj felé nézel?',
    options: ['Észak', 'Dél', 'Nyugat'],
    correct: 'Dél',
    hint: 'Az óramutató járásával megegyező irányban: Észak → Kelet → Dél → Nyugat.',
    rewardClue: '4. irányszám: 9',
  },
  {
    teamId: 'aranycsengok',
    question: 'Az útvonal 9 szakaszból áll, minden szakasz 5 perc séta. Hány perc az egész út?',
    options: ['40 perc', '45 perc', '50 perc'],
    correct: '45 perc',
    hint: '9 × 5 = ?',
    rewardClue: 'Kódolási szabály: a 4 irányszámot FORDÍTOTT sorrendben írjátok be (4., 3., 2., 1.)!',
  },
];

export const MissionNov27: React.FC<MissionNov27Props> = ({
  alreadyCompleted,
  onComplete,
  onTeamSolved,
  onBackToOverview,
  onGoToClues,
}) => {
  const [savedInitial] = useState<Partial<MissionNov27SavedState> | null>(() =>
    loadMissionState<MissionNov27SavedState>('nov-27')
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

  const [pos, setPos] = useState<{ r: number; c: number }>(() =>
    resumeCompletedView || !savedInitial?.pos ? { r: 0, c: 0 } : savedInitial.pos
  );
  const [visited, setVisited] = useState<string[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.visited)
      ? ['0,0']
      : savedInitial.visited
  );
  const [starsCollected, setStarsCollected] = useState<string[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.starsCollected)
      ? []
      : savedInitial.starsCollected
  );
  const [mazeNotice, setMazeNotice] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.mazeNotice ?? null)
  );
  const [mazeDone, setMazeDone] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.mazeDone)
  );

  const [mathChoices, setMathChoices] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.mathChoices ?? {})
  );
  const [mathStates, setMathStates] = useState<
    Record<string, { solved: boolean; hint: string | null }>
  >(() => (resumeCompletedView ? {} : (savedInitial?.mathStates ?? {})));

  const [teamChoices, setTeamChoices] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.teamChoices ?? {})
  );
  const [teamStates, setTeamStates] = useState<
    Record<string, { solved: boolean; hint: string | null }>
  >(() => (resumeCompletedView ? {} : (savedInitial?.teamStates ?? {})));

  const [compassPick, setCompassPick] = useState<number[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.compassPick)
      ? []
      : savedInitial.compassPick
  );
  const [compassSolved, setCompassSolved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.compassSolved)
  );
  const [compassHint, setCompassHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.compassHint ?? null)
  );

  useEffect(() => {
    saveMissionState<MissionNov27SavedState>('nov-27', {
      stage,
      pos,
      visited,
      starsCollected,
      mazeNotice,
      mazeDone,
      mathChoices,
      mathStates,
      teamChoices,
      teamStates,
      compassPick,
      compassSolved,
      compassHint,
      isReplaying,
    });
  }, [
    stage,
    pos,
    visited,
    starsCollected,
    mazeNotice,
    mazeDone,
    mathChoices,
    mathStates,
    teamChoices,
    teamStates,
    compassPick,
    compassSolved,
    compassHint,
    isReplaying,
  ]);

  const handleReplay = () => {
    soundEngine.playClick();
    saveMissionState<MissionNov27SavedState>('nov-27', {
      stage: 1,
      pos: { r: 0, c: 0 },
      visited: ['0,0'],
      starsCollected: [],
      mazeNotice: null,
      mazeDone: false,
      mathChoices: {},
      mathStates: {},
      teamChoices: {},
      teamStates: {},
      compassPick: [],
      compassSolved: false,
      compassHint: null,
      isReplaying: true,
    });
    setIsReplaying(true);
    setStage(1);
    setPos({ r: 0, c: 0 });
    setVisited(['0,0']);
    setStarsCollected([]);
    setMazeNotice(null);
    setMazeDone(false);
    setMathChoices({});
    setMathStates({});
    setTeamChoices({});
    setTeamStates({});
    setCompassPick([]);
    setCompassSolved(false);
    setCompassHint(null);
  };

  const movePlayer = (nr: number, nc: number) => {
    if (mazeDone) return;
    if (nr < 0 || nr > 5 || nc < 0 || nc > 5) return;
    if (MAZE_GRID[nr][nc] === 1) {
      soundEngine.playGentleHint();
      setMazeNotice('Hoppá, ott mély hóakadály és sűrű fenyőerdő áll! Keressetek másik utat!');
      return;
    }
    const key = `${nr},${nc}`;
    soundEngine.playClick();
    setMazeNotice(null);
    setPos({ r: nr, c: nc });
    if (!visited.includes(key)) {
      setVisited((prev) => [...prev, key]);
    }
    let nextStars = starsCollected;
    if (STAR_COORDS.includes(key) && !starsCollected.includes(key)) {
      soundEngine.playSuccess();
      nextStars = [...starsCollected, key];
      setStarsCollected(nextStars);
    }
    if (key === GOAL_COORD) {
      if (nextStars.length === 3) {
        soundEngine.playSealUnlock();
        setMazeDone(true);
      } else {
        soundEngine.playGentleHint();
        setMazeNotice(
          `Elértétek a Fénykaput, de még csak ${nextStars.length} csillagot gyűjtöttetek össze a 3-ból! Lépjetek vissza vagy kezdjétek újra, és szedjétek össze mind a 3 csillagot!`
        );
      }
    }
  };

  const resetMaze = () => {
    soundEngine.playClick();
    setPos({ r: 0, c: 0 });
    setVisited(['0,0']);
    setStarsCollected([]);
    setMazeNotice(null);
    setMazeDone(false);
  };

  const checkMath = () => {
    const next: Record<string, { solved: boolean; hint: string | null }> = {};
    for (const r of MATH_RIDDLES) {
      const picked = mathChoices[r.id];
      if (picked === r.correct) {
        next[r.id] = { solved: true, hint: null };
      } else {
        next[r.id] = {
          solved: false,
          hint: picked ? r.hint : 'Válasszatok egy megoldást ennél a feladatnál!',
        };
      }
    }
    setMathStates(next);
    if (MATH_RIDDLES.every((r) => next[r.id]?.solved)) {
      soundEngine.playSuccess();
    } else {
      soundEngine.playGentleHint();
    }
  };

  const allMathSolved = MATH_RIDDLES.every((r) => mathStates[r.id]?.solved);

  const checkAllTeams = () => {
    let allOk = true;
    const next: Record<string, { solved: boolean; hint: string | null }> = {};
    for (const t of TEAM_ROUTE_TASKS) {
      const picked = teamChoices[t.teamId];
      if (picked === t.correct) {
        next[t.teamId] = { solved: true, hint: null };
        onTeamSolved(t.teamId);
      } else {
        allOk = false;
        next[t.teamId] = {
          solved: false,
          hint: picked ? t.hint : 'Ennél a csapatnál még nincs kiválasztva válasz!',
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

  const allTeamsSolved = TEAM_ROUTE_TASKS.every((t) => teamStates[t.teamId]?.solved);

  const handleToggleCompassNum = (n: number) => {
    if (compassSolved) return;
    soundEngine.playClick();
    if (compassPick.includes(n)) {
      setCompassPick((prev) => prev.filter((x) => x !== n));
    } else {
      setCompassPick((prev) => [...prev, n]);
    }
  };

  const checkCompassCode = () => {
    if (compassPick.length < 4) {
      soundEngine.playGentleHint();
      setCompassHint('Válasszátok ki sorban mind a négy irányszámot!');
      return;
    }
    if (compassPick.join('-') === '9-4-8-12') {
      soundEngine.playSealUnlock();
      setCompassSolved(true);
      setCompassHint(null);
    } else {
      soundEngine.playGentleHint();
      setCompassHint(
        'Nézzétek az 5. csapat szabályát: fordított sorrendben kell beírni (4., 3., 2., 1. irányszám: 9, 4, 8, 12)!'
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            3. küldetés · November 27.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            A varázslatos útvonal
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {[
            { num: 1, label: 'Labirintus' },
            { num: 2, label: 'Matek rejtvények' },
            { num: 3, label: 'Útvonaltervezés és közös kód' },
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

      {/* Stage 1: Interactive Maze */}
      {stage === 1 && (
        <div className="space-y-6">
          <CsillagManoGuide
            message={`Vezessétek el Csillagot a Fénykapuhoz úgy, hogy közben összegyűjtitek mind a 3 aranycsillagot! (${starsCollected.length} / 3 csillag) Kattinthattok a szomszédos mezőkre vagy a nyilakra!`}
            tone={mazeDone ? 'success' : 'info'}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-white/15 bg-[#122643]/95 p-6 sm:p-8">
            <div className="lg:col-span-7 flex justify-center">
              <div className="grid grid-cols-6 gap-2 bg-[#0B192C] p-3 rounded-2xl border border-amber-300/30">
                {MAZE_GRID.map((row, r) =>
                  row.map((cell, c) => {
                    const key = `${r},${c}`;
                    const isPlayer = pos.r === r && pos.c === c;
                    const isGoal = key === GOAL_COORD;
                    const hasStar = STAR_COORDS.includes(key) && !starsCollected.includes(key);
                    const isVisited = visited.includes(key);
                    const isAdjacent =
                      Math.abs(pos.r - r) + Math.abs(pos.c - c) === 1 && cell === 0;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (isAdjacent) movePlayer(r, c);
                        }}
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-bold transition-all ${
                          cell === 1
                            ? 'bg-[#1D3557] text-emerald-400/70 cursor-not-allowed'
                            : isPlayer
                            ? 'bg-red-600 text-white ring-4 ring-amber-300 scale-105'
                            : isGoal
                            ? 'bg-amber-400 text-[#0B192C] cursor-pointer'
                            : isAdjacent
                            ? 'bg-sky-500/35 border-2 border-amber-300/70 hover:bg-sky-500/50 cursor-pointer'
                            : isVisited
                            ? 'bg-emerald-500/25 text-emerald-200'
                            : 'bg-[#1A3860] text-slate-300'
                        }`}
                      >
                        {cell === 1 ? (
                          <Trees className="w-6 h-6" />
                        ) : isPlayer ? (
                          <span className="text-lg font-extrabold">CS</span>
                        ) : isGoal ? (
                          <span className="text-xs font-extrabold uppercase">Kapu</span>
                        ) : hasStar ? (
                          <Star className="w-7 h-7 text-amber-300 fill-amber-300" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center space-y-5">
              <p className="text-base font-semibold text-amber-200 text-center">
                Irányító gombok az interaktív táblához:
              </p>

              <div className="grid grid-cols-3 gap-3 w-48">
                <div />
                <button
                  type="button"
                  onClick={() => movePlayer(pos.r - 1, pos.c)}
                  aria-label="Fel"
                  className="h-14 rounded-2xl bg-amber-400 text-[#0B192C] flex items-center justify-center hover:bg-amber-300 cursor-pointer"
                >
                  <ArrowUp className="w-7 h-7" />
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => movePlayer(pos.r, pos.c - 1)}
                  aria-label="Balra"
                  className="h-14 rounded-2xl bg-amber-400 text-[#0B192C] flex items-center justify-center hover:bg-amber-300 cursor-pointer"
                >
                  <ArrowLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={() => movePlayer(pos.r + 1, pos.c)}
                  aria-label="Le"
                  className="h-14 rounded-2xl bg-amber-400 text-[#0B192C] flex items-center justify-center hover:bg-amber-300 cursor-pointer"
                >
                  <ArrowDown className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={() => movePlayer(pos.r, pos.c + 1)}
                  aria-label="Jobbra"
                  className="h-14 rounded-2xl bg-amber-400 text-[#0B192C] flex items-center justify-center hover:bg-amber-300 cursor-pointer"
                >
                  <ArrowRight className="w-7 h-7" />
                </button>
              </div>

              <button
                type="button"
                onClick={resetMaze}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Újrakezdés elölről</span>
              </button>
            </div>
          </div>

          {mazeNotice && (
            <CsillagManoGuide speakerLabel="Útbaigazítás" message={mazeNotice} tone="hint" />
          )}

          {mazeDone && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage(2);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] hover:bg-amber-300 cursor-pointer"
              >
                <span>Átjutottatok a Fénykapun! Irány a matek rejtvények!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage 2: 3rd grade Math Riddles */}
      {stage === 2 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Oldjátok meg együtt a többlépéses 3. osztályos számolós rejtvényeket!" />

          <div className="space-y-5">
            {MATH_RIDDLES.map((r, idx) => {
              const state = mathStates[r.id];
              const solved = state?.solved ?? false;
              return (
                <div
                  key={r.id}
                  className={`rounded-3xl border-2 p-6 sm:p-8 ${
                    solved
                      ? 'border-emerald-400 bg-[#12352C] text-white'
                      : 'border-amber-300/25 bg-[#FFF8EB] text-[#1E1B18]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p
                      className={`text-sm font-bold uppercase tracking-wider ${
                        solved ? 'text-emerald-300' : 'text-red-700'
                      }`}
                    >
                      {idx + 1}. matematikai rejtvény
                    </p>
                    {solved && <CheckCircle2 className="w-7 h-7 text-emerald-300" />}
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold mb-4">
                    {r.question}
                  </h2>

                  <div className="flex flex-wrap gap-3">
                    {r.options.map((opt) => {
                      const active = mathChoices[r.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={solved}
                          onClick={() => {
                            soundEngine.playClick();
                            setMathChoices((prev) => ({ ...prev, [r.id]: opt }));
                          }}
                          className={`min-w-[110px] rounded-2xl border-2 px-6 py-3.5 text-xl font-bold cursor-pointer ${
                            solved && opt === r.correct
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
                    <p className="mt-4 rounded-xl bg-amber-100 p-3.5 text-base font-semibold text-amber-950">
                      Segítség: {state.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            {!allMathSolved ? (
              <button
                type="button"
                onClick={checkMath}
                className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Rejtvények ellenőrzése
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
                <span>Tovább a közös útvonaltervezéshez!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stage 3: Team Route Planning + Common Compass Code */}
      {stage === 3 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Minden csapat megfejt egy szakaszt, és szerez egy irányszámot vagy szabályt. A végén az öt csapat információjából nyílik a harmadik pecsét!" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {TEAM_ROUTE_TASKS.map((t) => {
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

                  <h3 className="mt-2 font-display text-xl font-bold">{t.question}</h3>

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
                          className={`rounded-xl border-2 px-5 py-3 text-base font-bold cursor-pointer ${
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
                      🧭 Csapatnyom: {t.rewardClue}
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

          {/* Common Compass Code */}
          <div className="rounded-3xl border-2 border-amber-400/50 bg-[#142B4C] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Közös zárófeladat · Iránytű-kód
                </p>
                <h3 className="font-display text-2xl font-bold text-white mt-1">
                  Állítsátok be a 4 számjegyű útvonalkódot az 5 csapat nyomaiból!
                </h3>
              </div>
              {!allTeamsSolved && <Lock className="w-7 h-7 text-slate-400" />}
            </div>

            {!allTeamsSolved ? (
              <p className="text-base text-slate-300">
                Előbb minden csapat fejtse meg a saját útvonalszakaszát!
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="w-20 h-16 rounded-xl border-2 border-amber-400 bg-[#FFF8EB] flex items-center justify-center font-display text-2xl font-bold text-[#1E1B18]"
                    >
                      {compassPick[idx] ?? '_'}
                    </div>
                  ))}
                </div>

                {!compassSolved && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {[12, 8, 4, 9].map((n) => {
                      const picked = compassPick.includes(n);
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleToggleCompassNum(n)}
                          className={`min-w-[80px] rounded-xl px-6 py-3 text-xl font-bold cursor-pointer ${
                            picked
                              ? 'bg-red-600 text-white'
                              : 'bg-white/10 text-amber-100 hover:bg-white/20'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                )}

                {compassHint && (
                  <p className="rounded-xl bg-amber-950/70 border border-amber-400/50 p-3.5 text-center text-base font-semibold text-amber-200">
                    {compassHint}
                  </p>
                )}

                <div className="flex justify-center">
                  {!compassSolved ? (
                    <button
                      type="button"
                      onClick={checkCompassCode}
                      className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      Útvonalkód ellenőrzése
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
                      <span>Harmadik arany varázspecsét megszerzése!</span>
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
          missionId="nov-27"
          onBackToOverview={onBackToOverview}
          onGoToClues={onGoToClues}
          onReplay={handleReplay}
        />
      )}
    </div>
  );
};
