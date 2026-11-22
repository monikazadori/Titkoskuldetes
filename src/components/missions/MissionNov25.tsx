import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lock,
  MailOpen,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ASSETS, TEAMS } from '../../data/missions';
import { TeamId } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { loadMissionState, saveMissionState } from '../../utils/storage';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { MissionCompleteBanner } from '../MissionCompleteBanner';

interface MissionNov25SavedState extends Record<string, unknown> {
  stage: 1 | 2 | 3 | 4;
  letterOpened: boolean;
  showLetterRef: boolean;
  q1Selected: number[];
  q1Solved: boolean;
  q1Hint: string | null;
  tfValA: boolean | null;
  tfReasonA: number | null;
  tfValB: boolean | null;
  tfReasonB: number | null;
  q2Solved: boolean;
  q2Hint: string | null;
  orderIndices: number[];
  q3Solved: boolean;
  q3Hint: string | null;
  hintLevels: Partial<Record<TeamId, 0 | 1 | 2>>;
  solvedTeams: Partial<Record<TeamId, boolean>>;
  teamErrors: Partial<Record<TeamId, string | null>>;
  hopiheInput: string;
  csillagChoice: number | null;
  mezesInput: string;
  renszarvasWord: string;
  aranyChoice: string;
  codeSlots: (number | null)[];
  activeSlot: number;
  lockError: string | null;
  lockOpened: boolean;
  doorOpened: boolean;
  sealRevealed: boolean;
  isReplaying: boolean;
}

interface MissionNov25Props {
  alreadyCompleted: boolean;
  onComplete: () => void;
  onTeamSolved: (teamId: TeamId) => void;
  onBackToOverview: () => void;
  onGoToClues: () => void;
}

const ORDER_ITEMS_CORRECT = [
  'A 3. b osztály elolvassa a Titkok Őrzőjének pecsétes levelét.',
  'A csapatok öt napon keresztül közösen teljesítik a próbákat.',
  'Minden sikeres küldetés után egy újabb nyom kerül a birtokukba.',
  'Az ötödik pecsét megszerzése után kiderül a nagy meglepetés.',
];

// Initial scrambled order indices
const INITIAL_ORDER_INDICES = [1, 3, 0, 2];

const CIPHER_SYMBOLS: { symbol: string; letter: string }[] = [
  { symbol: '★', letter: 'T' },
  { symbol: '◆', letter: 'É' },
  { symbol: '●', letter: 'L' },
  { symbol: '▲', letter: 'A' },
  { symbol: '■', letter: 'K' },
  { symbol: '♥', letter: 'M' },
];

const ARANY_RULE_CORRECT = 'Növekvő sorrend (legkisebbtől a legnagyobbig)';

const TEAM_HINTS: Record<TeamId, [string, string]> = {
  hopihe: [
    'Nézzétek meg, mennyivel változik a szám egyikről a másikra (+4, −2), vagy figyeljétek külön az 1., 3., 5. és 7. helyen álló számokat!',
    'A szabály kétféleképpen is látható: +4, majd −2 váltakozik (8 − 2 = ?), és az 1., 3., 5., 7. számok kettesével nőnek: 2, 4, ?, 8.',
  ],
  csillagmanok: [
    'Zárjátok ki először az 5-nél nem kisebb számot, utána pedig minden páros számot!',
    'A 6 kiesik (nem kisebb 5-nél). A 2 és a 4 páros, így azok is kiesnek. Az 1 és a 3 közül melyik nagyobb 2-nél?',
  ],
  mezeskalacs: [
    'Ha a kétjegyű szám 20 és 30 között van, akkor az első számjegye biztosan a 2-es! Mennyi hiányzik a 2-höz, hogy az összeg 7 legyen?',
    'Az első számjegy 2, és 2 + ? = 7, tehát a kétjegyű szám a 25 (ami páratlan is!). A négyjegyű kódhoz ennek az egyes számjegye (a második számjegy) kell!',
  ],
  renszarvas: [
    'Keressétek ki a fenti titkos kódtáblából sorban a ★, a ◆ és a ● jelhez tartozó betűket!',
    'Az első jel a ★ (= T), a második a ◆ (= É), a harmadik a ● (= L). Válasszátok ki a négy lehetőség közül a TÉL szót!',
  ],
  aranycsengok: [
    'Nézzétek meg a számokat balról jobbra: 12, 15, 18, 21... Egyre nagyobbak vagy egyre kisebbek lesznek?',
    'Minden lépésben egyre nagyobb szám következik a legkisebbtől a legnagyobbig: ez a növekvő sorrend!',
  ],
};

const FOUR_DIGIT_TEAM_RESULTS: { teamId: TeamId; label: string; digit: number }[] = [
  { teamId: 'hopihe', label: 'Hópihe nyomozók', digit: 6 },
  { teamId: 'csillagmanok', label: 'Csillagmanók', digit: 3 },
  { teamId: 'mezeskalacs', label: 'Mézeskalács detektívek', digit: 5 },
  { teamId: 'renszarvas', label: 'Rénszarvas őrjárat', digit: 7 },
];

export const MissionNov25: React.FC<MissionNov25Props> = ({
  alreadyCompleted,
  onComplete,
  onTeamSolved,
  onBackToOverview,
  onGoToClues,
}) => {
  const [savedInitial] = useState<Partial<MissionNov25SavedState> | null>(() =>
    loadMissionState<MissionNov25SavedState>('nov-25')
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
  const [letterOpened, setLetterOpened] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.letterOpened)
  );
  const [showLetterRef, setShowLetterRef] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.showLetterRef)
  );

  // Stage 2: 3 diverse reading comprehension tasks
  // Task 1: Multi-select 2 correct inferences
  const [q1Selected, setQ1Selected] = useState<number[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.q1Selected)
      ? []
      : savedInitial.q1Selected
  );
  const [q1Solved, setQ1Solved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.q1Solved)
  );
  const [q1Hint, setQ1Hint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.q1Hint ?? null)
  );

  // Task 2: True / False + Justification
  const [tfValA, setTfValA] = useState<boolean | null>(() =>
    resumeCompletedView ? null : (savedInitial?.tfValA ?? null)
  );
  const [tfReasonA, setTfReasonA] = useState<number | null>(() =>
    resumeCompletedView ? null : (savedInitial?.tfReasonA ?? null)
  );
  const [tfValB, setTfValB] = useState<boolean | null>(() =>
    resumeCompletedView ? null : (savedInitial?.tfValB ?? null)
  );
  const [tfReasonB, setTfReasonB] = useState<number | null>(() =>
    resumeCompletedView ? null : (savedInitial?.tfReasonB ?? null)
  );
  const [q2Solved, setQ2Solved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.q2Solved)
  );
  const [q2Hint, setQ2Hint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.q2Hint ?? null)
  );

  // Task 3: Event ordering
  const [orderIndices, setOrderIndices] = useState<number[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.orderIndices)
      ? INITIAL_ORDER_INDICES
      : savedInitial.orderIndices
  );
  const [q3Solved, setQ3Solved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.q3Solved)
  );
  const [q3Hint, setQ3Hint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.q3Hint ?? null)
  );

  // Stage 3: 5 Team Trials with 2-level hints
  const [hintLevels, setHintLevels] = useState<Partial<Record<TeamId, 0 | 1 | 2>>>(() =>
    resumeCompletedView ? {} : (savedInitial?.hintLevels ?? {})
  );
  const [solvedTeams, setSolvedTeams] = useState<Partial<Record<TeamId, boolean>>>(() =>
    resumeCompletedView ? {} : (savedInitial?.solvedTeams ?? {})
  );
  const [teamErrors, setTeamErrors] = useState<Partial<Record<TeamId, string | null>>>(() =>
    resumeCompletedView ? {} : (savedInitial?.teamErrors ?? {})
  );

  // Individual team inputs
  const [hopiheInput, setHopiheInput] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.hopiheInput ?? '')
  );
  const [csillagChoice, setCsillagChoice] = useState<number | null>(() =>
    resumeCompletedView ? null : (savedInitial?.csillagChoice ?? null)
  );
  const [mezesInput, setMezesInput] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.mezesInput ?? '')
  );
  const [renszarvasWord, setRenszarvasWord] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.renszarvasWord ?? '')
  );
  const [aranyChoice, setAranyChoice] = useState<string>(() =>
    resumeCompletedView ? '' : (savedInitial?.aranyChoice ?? '')
  );

  // Stage 4: 4-digit Golden Padlock (3567) & Magic Door animation — never pre-filled
  const [codeSlots, setCodeSlots] = useState<(number | null)[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.codeSlots)
      ? [null, null, null, null]
      : savedInitial.codeSlots
  );
  const [activeSlot, setActiveSlot] = useState<number>(() =>
    resumeCompletedView || typeof savedInitial?.activeSlot !== 'number'
      ? 0
      : savedInitial.activeSlot
  );
  const [lockError, setLockError] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.lockError ?? null)
  );
  const [lockOpened, setLockOpened] = useState<boolean>(() =>
    resumeCompletedView ? true : Boolean(savedInitial?.lockOpened)
  );
  const [doorOpened, setDoorOpened] = useState<boolean>(() =>
    resumeCompletedView ? true : Boolean(savedInitial?.doorOpened)
  );
  const [sealRevealed, setSealRevealed] = useState<boolean>(() =>
    resumeCompletedView ? true : Boolean(savedInitial?.sealRevealed)
  );

  const timersRef = useRef<number[]>([]);

  const clearPendingTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearPendingTimers();
  }, []);

  // Ensure an interrupted unlock animation completes cleanly after reload
  useEffect(() => {
    if (lockOpened && (!doorOpened || !sealRevealed)) {
      setDoorOpened(true);
      setSealRevealed(true);
    }
  }, [lockOpened, doorOpened, sealRevealed]);

  // Persist mission progress in localStorage
  useEffect(() => {
    const stateToSave: MissionNov25SavedState = {
      stage,
      letterOpened,
      showLetterRef,
      q1Selected,
      q1Solved,
      q1Hint,
      tfValA,
      tfReasonA,
      tfValB,
      tfReasonB,
      q2Solved,
      q2Hint,
      orderIndices,
      q3Solved,
      q3Hint,
      hintLevels,
      solvedTeams,
      teamErrors,
      hopiheInput,
      csillagChoice,
      mezesInput,
      renszarvasWord,
      aranyChoice,
      codeSlots,
      activeSlot,
      lockError,
      lockOpened,
      doorOpened,
      sealRevealed,
      isReplaying,
    };
    saveMissionState('nov-25', stateToSave);
  }, [
    stage,
    letterOpened,
    showLetterRef,
    q1Selected,
    q1Solved,
    q1Hint,
    tfValA,
    tfReasonA,
    tfValB,
    tfReasonB,
    q2Solved,
    q2Hint,
    orderIndices,
    q3Solved,
    q3Hint,
    hintLevels,
    solvedTeams,
    teamErrors,
    hopiheInput,
    csillagChoice,
    mezesInput,
    renszarvasWord,
    aranyChoice,
    codeSlots,
    activeSlot,
    lockError,
    lockOpened,
    doorOpened,
    sealRevealed,
    isReplaying,
  ]);

  const handleReplay = () => {
    soundEngine.playClick();
    clearPendingTimers();
    const freshReplayState: MissionNov25SavedState = {
      stage: 1,
      letterOpened: false,
      showLetterRef: false,
      q1Selected: [],
      q1Solved: false,
      q1Hint: null,
      tfValA: null,
      tfReasonA: null,
      tfValB: null,
      tfReasonB: null,
      q2Solved: false,
      q2Hint: null,
      orderIndices: INITIAL_ORDER_INDICES,
      q3Solved: false,
      q3Hint: null,
      hintLevels: {},
      solvedTeams: {},
      teamErrors: {},
      hopiheInput: '',
      csillagChoice: null,
      mezesInput: '',
      renszarvasWord: '',
      aranyChoice: '',
      codeSlots: [null, null, null, null],
      activeSlot: 0,
      lockError: null,
      lockOpened: false,
      doorOpened: false,
      sealRevealed: false,
      isReplaying: true,
    };
    saveMissionState('nov-25', freshReplayState);
    setIsReplaying(true);
    setStage(1);
    setLetterOpened(false);
    setShowLetterRef(false);
    setQ1Selected([]);
    setQ1Solved(false);
    setQ1Hint(null);
    setTfValA(null);
    setTfReasonA(null);
    setTfValB(null);
    setTfReasonB(null);
    setQ2Solved(false);
    setQ2Hint(null);
    setOrderIndices(INITIAL_ORDER_INDICES);
    setQ3Solved(false);
    setQ3Hint(null);
    setHintLevels({});
    setSolvedTeams({});
    setTeamErrors({});
    setHopiheInput('');
    setCsillagChoice(null);
    setMezesInput('');
    setRenszarvasWord('');
    setAranyChoice('');
    setCodeSlots([null, null, null, null]);
    setActiveSlot(0);
    setLockError(null);
    setLockOpened(false);
    setDoorOpened(false);
    setSealRevealed(false);
  };

  // Stage 2 checks
  const toggleQ1Option = (idx: number) => {
    if (q1Solved) return;
    soundEngine.playClick();
    setQ1Selected((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  };

  const checkQ1 = () => {
    if (q1Selected.length !== 2) {
      soundEngine.playGentleHint();
      setQ1Hint('Pontosan KÉT állítást jelöljetek meg, amelyek a levélből következnek!');
      return;
    }
    if (q1Selected.includes(0) && q1Selected.includes(2)) {
      soundEngine.playSuccess();
      setQ1Solved(true);
      setQ1Hint(null);
    } else {
      soundEngine.playGentleHint();
      setQ1Hint(
        'Olvassátok el újra a 2. és 3. bekezdést! Együtt kell gondolkodni (nem versenyezve), és a levél figyelmeztet, hogy egy nyom elsőre másnak látszhat.'
      );
    }
  };

  const checkQ2 = () => {
    if (tfValA === null || tfReasonA === null || tfValB === null || tfReasonB === null) {
      soundEngine.playGentleHint();
      setQ2Hint('Mindkét állításnál válasszátok ki az Igaz/Hamis döntést ÉS az indoklást is!');
      return;
    }
    const okA = tfValA === false && tfReasonA === 0;
    const okB = tfValB === true && tfReasonB === 1;
    if (okA && okB) {
      soundEngine.playSuccess();
      setQ2Solved(true);
      setQ2Hint(null);
    } else {
      soundEngine.playGentleHint();
      setQ2Hint(
        'Ellenőrizzétek mindkét állítást és indoklást! Az A állítás hamis, mert az ügyesség, kitartás és közös gondolkodás is kell; a B igaz, mert minden nap csak egy-egy nyom kerül elő.'
      );
    }
  };

  const moveOrderItem = (pos: number, dir: -1 | 1) => {
    if (q3Solved) return;
    const target = pos + dir;
    if (target < 0 || target >= orderIndices.length) return;
    soundEngine.playClick();
    const next = [...orderIndices];
    const tmp = next[pos];
    next[pos] = next[target];
    next[target] = tmp;
    setOrderIndices(next);
  };

  const checkQ3 = () => {
    if (orderIndices.every((val, idx) => val === idx)) {
      soundEngine.playSuccess();
      setQ3Solved(true);
      setQ3Hint(null);
    } else {
      soundEngine.playGentleHint();
      setQ3Hint(
        'Gondoljátok végig időrendben: 1. a levél elolvasása → 2. öt napon át a próbák → 3. a nyomok összegyűjtése → 4. az ötödik pecsét után a nagy meglepetés!'
      );
    }
  };

  // Stage 3 helpers
  const requestHint = (teamId: TeamId) => {
    soundEngine.playClick();
    setHintLevels((prev) => {
      const current = prev[teamId] ?? 0;
      return { ...prev, [teamId]: current === 0 ? 1 : 2 };
    });
  };

  const markTeamSuccess = (teamId: TeamId) => {
    soundEngine.playSuccess();
    onTeamSolved(teamId);
    setSolvedTeams((prev) => ({ ...prev, [teamId]: true }));
    setTeamErrors((prev) => ({ ...prev, [teamId]: null }));
  };

  const markTeamError = (teamId: TeamId, msg: string) => {
    soundEngine.playGentleHint();
    setTeamErrors((prev) => ({ ...prev, [teamId]: msg }));
  };

  const checkHopihe = () => {
    if (hopiheInput.trim() === '6') {
      markTeamSuccess('hopihe');
    } else {
      markTeamError(
        'hopihe',
        'Ez még nem a helyes számjegy! Használjátok a Segítség gombot, ha elakadtatok.'
      );
    }
  };

  const checkCsillag = () => {
    if (csillagChoice === 3) {
      markTeamSuccess('csillagmanok');
    } else {
      markTeamError(
        'csillagmanok',
        'Ellenőrizzétek újra mindhárom kizárásos nyomot a táblán!'
      );
    }
  };

  const checkMezes = () => {
    if (mezesInput.trim() === '25') {
      markTeamSuccess('mezeskalacs');
    } else if (mezesInput.trim() === '') {
      markTeamError('mezeskalacs', 'Üssétek be előbb a kitalált kétjegyű számot!');
    } else {
      markTeamError(
        'mezeskalacs',
        'Ellenőrizzétek: 20 és 30 között van? Páratlan? És a két számjegy összege pontosan 7?'
      );
    }
  };

  const checkRenszarvas = () => {
    if (renszarvasWord.trim().toUpperCase() === 'TÉL') {
      markTeamSuccess('renszarvas');
    } else if (!renszarvasWord.trim()) {
      markTeamError(
        'renszarvas',
        'Válasszatok egyet a négy válaszlehetőség közül!'
      );
    } else {
      markTeamError(
        'renszarvas',
        'Ez még nem a helyes szó! Nézzétek meg újra a titkos kódtáblában, melyik betű tartozik sorban a ★, a ◆ és a ● jelekhez!'
      );
    }
  };

  const checkArany = () => {
    if (aranyChoice === ARANY_RULE_CORRECT) {
      markTeamSuccess('aranycsengok');
    } else {
      markTeamError(
        'aranycsengok',
        'Figyeljétek meg, merre haladnak a számok: egyre kisebbek vagy egyre nagyobbak lesznek?'
      );
    }
  };

  const allTeamsSolved = TEAMS.every((t) => solvedTeams[t.id]);

  // Stage 4: 4-digit code verification (3567) & animations
  const handleEnterLockDigit = (digit: number) => {
    if (lockOpened) return;
    soundEngine.playClick();
    setLockError(null);
    const next = [...codeSlots];
    next[activeSlot] = digit;
    setCodeSlots(next);
    const nextEmpty = next.findIndex((val, i) => i > activeSlot && val === null);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    } else if (activeSlot < 3) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const checkPadlockCode = () => {
    if (codeSlots.some((d) => d === null)) {
      soundEngine.playGentleHint();
      setLockError('A lakat még zárva maradt! Ellenőrizzétek közösen a nyomokat!');
      return;
    }
    const expected = [3, 5, 6, 7];
    const isMatch = codeSlots.every((d, i) => d === expected[i]);
    if (isMatch) {
      soundEngine.playSealUnlock();
      setLockError(null);
      setLockOpened(true);
      setIsReplaying(false);
      onComplete();
      // Smoothly open the magic door after padlock clicks open
      const t1 = window.setTimeout(() => {
        setDoorOpened(true);
      }, 650);
      const t2 = window.setTimeout(() => {
        soundEngine.playGrandVictory();
        setSealRevealed(true);
      }, 1550);
      timersRef.current.push(t1, t2);
    } else {
      soundEngine.playGentleHint();
      setLockError('A lakat még zárva maradt! Ellenőrizzétek közösen a nyomokat!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & 4-part stepper */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            1. küldetés · November 25.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            A titokzatos levél
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {[
            { num: 1, label: 'Titkos levél' },
            { num: 2, label: 'Közös feladatok' },
            { num: 3, label: 'Csapatpróbák' },
            { num: 4, label: 'Négyjegyű kód és ajtó' },
          ].map((s) => {
            const unlockedStep = s.num <= stage || (alreadyCompleted && !isReplaying);
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (unlockedStep) {
                    setStage(s.num as 1 | 2 | 3 | 4);
                  }
                }}
                className={`rounded-xl px-3.5 py-2 transition-colors ${
                  stage === s.num
                    ? 'bg-amber-400 text-[#0B192C] font-bold'
                    : unlockedStep
                    ? 'bg-emerald-500/20 text-emerald-200 cursor-pointer hover:bg-emerald-500/30'
                    : 'bg-white/5 text-slate-400 cursor-default'
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

      {/* PART 1: Reading the mysterious letter */}
      {stage === 1 && (
        <div className="space-y-6">
          {!letterOpened ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-amber-300/30 bg-[#122643]/95 p-6 sm:p-10 shadow-xl">
              <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-amber-300/30">
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
                  Csillag egy arany csillagpecséttel lezárt tekercset talált az első varázsajtó
                  előtt. Nyissátok ki együtt, és figyeljetek minden egyes mondatára!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSealUnlock();
                    setLetterOpened(true);
                  }}
                  className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-8 py-4 text-xl font-bold text-white shadow-lg hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <MailOpen className="w-6 h-6" />
                  <span>Levél kinyitása</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto max-w-3xl rounded-3xl border-2 border-amber-400/60 bg-[#FFF8EB] p-8 sm:p-12 text-[#1E1B18] shadow-2xl">
                <div className="flex items-center justify-between border-b border-amber-900/15 pb-4 mb-6">
                  <span className="font-display text-xl font-bold tracking-wide text-red-800">
                    SZIGORÚAN TITKOS!
                  </span>
                  <span className="text-sm font-semibold text-amber-800">November 25.</span>
                </div>

                <div className="space-y-4 text-lg sm:text-xl leading-relaxed font-medium">
                  <p className="font-display text-2xl font-bold text-red-800">
                    Kedves 3. b osztály!
                  </p>
                  <p>
                    Egy különleges meglepetés előkészületei zajlanak, de egyelőre nem árulhatom
                    el, mi vár rátok.
                  </p>
                  <p>
                    Öt titkos pecsét őrzi a megfejtést. Csak azok tudhatják meg az igazságot,
                    akik bizonyítják, hogy ügyesek, kitartóak, és képesek együtt gondolkodni.
                  </p>
                  <p>
                    Öt napon keresztül különböző próbákat kell teljesítenetek. Minden sikeres
                    küldetés után egy újabb nyom kerül a birtokotokba.
                  </p>
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

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setStage(2);
                  }}
                  className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] shadow-lg hover:bg-amber-300 cursor-pointer"
                >
                  <span>Tovább a közös szövegértési feladatokhoz</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PART 2: 3 Diverse Common Comprehension & Deduction Tasks */}
      {stage === 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[260px]">
              <CsillagManoGuide message="Három különböző típusú közös feladat következik! Ha bármikor ellenőrizni szeretnétek egy mondatot, nyissátok le a levelet!" />
            </div>
            <button
              type="button"
              onClick={() => setShowLetterRef((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-[#142B4C] px-5 py-3.5 text-base font-bold text-amber-200 hover:bg-[#1B3A66] cursor-pointer shrink-0"
            >
              <BookOpen className="w-5 h-5" />
              <span>{showLetterRef ? 'Levél elrejtése' : 'Levél újraolvasása'}</span>
            </button>
          </div>

          {showLetterRef && (
            <div className="rounded-2xl border border-amber-300/40 bg-[#FFF8EB] p-6 text-[#1E1B18] space-y-2 text-base sm:text-lg">
              <p className="font-bold text-red-800">SZIGORÚAN TITKOS! – A levél szövege:</p>
              <p>
                Egy különleges meglepetés előkészületei zajlanak, de egyelőre nem árulhatom el,
                mi vár rátok. Öt titkos pecsét őrzi a megfejtést. Csak azok tudhatják meg az
                igazságot, akik bizonyítják, hogy ügyesek, kitartóak, és képesek együtt
                gondolkodni. Öt napon keresztül különböző próbákat kell teljesítenetek. Minden
                sikeres küldetés után egy újabb nyom kerül a birtokotokba. De vigyázzatok! Nem
                minden nyom jelenti azt, aminek első pillantásra látszik!
              </p>
            </div>
          )}

          {/* Task 1: Multi-sentence inference (select TWO conclusions) */}
          <div className="rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18] shadow-lg space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-wider text-red-700">
                1. feladat · Következtetés a levél több mondatából (jelöljetek be KETTŐT!)
              </p>
              {q1Solved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" /> Helyes következtetés!
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold">
              Melyik KÉT állítás igaz egyszerre a levél 2., 3. és 4. bekezdése alapján?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'A titok kiderítéséhez nem elég egyetlen próba, hanem öt napon át, öt pecsétet kell megszerezni.',
                'A feladatokat egyedül, egymással versenyezve érdemes megoldani.',
                'Az összegyűjtött nyomok első pillantásra néha félrevezetőek is lehetnek, ezért alaposan át kell gondolni őket.',
                'A Titkok Őrzője már a levél végén pontosan leírta, hová mennek decemberben.',
              ].map((opt, idx) => {
                const checked = q1Selected.includes(idx);
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={q1Solved}
                    onClick={() => toggleQ1Option(idx)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left text-base sm:text-lg font-bold transition-all cursor-pointer ${
                      checked
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-amber-900/20 bg-white hover:border-amber-600 text-[#1E1B18]'
                    }`}
                  >
                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm ${
                        checked
                          ? 'border-white bg-white text-red-700'
                          : 'border-amber-900/40 bg-amber-50'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {q1Hint && (
              <p className="rounded-xl border border-amber-500/40 bg-amber-100 p-4 text-base font-semibold text-amber-950">
                Csillag súg: {q1Hint}
              </p>
            )}

            {!q1Solved && (
              <button
                type="button"
                onClick={checkQ1}
                className="rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white hover:bg-emerald-600 cursor-pointer"
              >
                Két állítás ellenőrzése
              </button>
            )}
          </div>

          {/* Task 2: True / False WITH Justification */}
          <div className="rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18] shadow-lg space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-wider text-red-700">
                2. feladat · Igaz–Hamis indoklással
              </p>
              {q2Solved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" /> Döntés és indoklás is helyes!
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold">
              Döntsétek el az állításokról, hogy igazak vagy hamisak, és válasszátok ki, MIÉRT!
            </h2>

            {/* Statement A */}
            <div className="rounded-2xl border border-amber-900/15 bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-lg font-bold flex-1">
                  A) „Ha valaki nagyon gyorsan dolgozik, de nem figyel a társaira, akkor is biztosan
                  megtudja az igazságot.”
                </p>
                <div className="flex gap-2 shrink-0">
                  {[
                    { label: 'Igaz', val: true },
                    { label: 'Hamis', val: false },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      disabled={q2Solved}
                      onClick={() => {
                        soundEngine.playClick();
                        setTfValA(btn.val);
                      }}
                      className={`min-w-[90px] rounded-xl border-2 px-4 py-2.5 text-base font-bold cursor-pointer ${
                        tfValA === btn.val
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-slate-300 bg-slate-50 text-slate-800 hover:border-amber-600'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-sm font-bold text-red-800">Indoklás – Miért így döntöttetek?</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Mert a levél szerint ügyesség, kitartás és közös gondolkodás is szükséges.',
                    'Mert a levélben egyáltalán nincsenek pecsétek.',
                    'Mert a játék csak egyetlen órát tart.',
                  ].map((reason, idx) => (
                    <button
                      key={reason}
                      type="button"
                      disabled={q2Solved}
                      onClick={() => {
                        soundEngine.playClick();
                        setTfReasonA(idx);
                      }}
                      className={`rounded-xl border-2 px-4 py-3 text-left text-base font-semibold cursor-pointer ${
                        tfReasonA === idx
                          ? 'border-amber-700 bg-amber-100 text-amber-950'
                          : 'border-slate-200 bg-slate-50 hover:border-amber-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Statement B */}
            <div className="rounded-2xl border border-amber-900/15 bg-white p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-lg font-bold flex-1">
                  B) „A mai napon megszerzett nyom még nem árulja el a teljes titkot, csak az út
                  elején segít tovább.”
                </p>
                <div className="flex gap-2 shrink-0">
                  {[
                    { label: 'Igaz', val: true },
                    { label: 'Hamis', val: false },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      disabled={q2Solved}
                      onClick={() => {
                        soundEngine.playClick();
                        setTfValB(btn.val);
                      }}
                      className={`min-w-[90px] rounded-xl border-2 px-4 py-2.5 text-base font-bold cursor-pointer ${
                        tfValB === btn.val
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-slate-300 bg-slate-50 text-slate-800 hover:border-amber-600'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-sm font-bold text-red-800">Indoklás – Miért így döntöttetek?</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Mert a Titkok Őrzője már elárulta a megfejtést a levél első sorában.',
                    'Mert öt napon át tartanak a próbák, és minden sikeres küldetés után csak egy újabb nyom kerül elő.',
                    'Mert csak az első napon kapunk nyomot.',
                  ].map((reason, idx) => (
                    <button
                      key={reason}
                      type="button"
                      disabled={q2Solved}
                      onClick={() => {
                        soundEngine.playClick();
                        setTfReasonB(idx);
                      }}
                      className={`rounded-xl border-2 px-4 py-3 text-left text-base font-semibold cursor-pointer ${
                        tfReasonB === idx
                          ? 'border-amber-700 bg-amber-100 text-amber-950'
                          : 'border-slate-200 bg-slate-50 hover:border-amber-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {q2Hint && (
              <p className="rounded-xl border border-amber-500/40 bg-amber-100 p-4 text-base font-semibold text-amber-950">
                Csillag súg: {q2Hint}
              </p>
            )}

            {!q2Solved && (
              <button
                type="button"
                onClick={checkQ2}
                className="rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white hover:bg-emerald-600 cursor-pointer"
              >
                Igaz–Hamis és indoklás ellenőrzése
              </button>
            )}
          </div>

          {/* Task 3: Interactive Event Ordering */}
          <div className="rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18] shadow-lg space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-wider text-red-700">
                3. feladat · Interaktív eseménysorrend
              </p>
              {q3Solved && (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" /> Tökéletes időrend!
                </span>
              )}
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold">
                Állítsátok helyes sorrendbe a nyomozás eseményeit a nyilak segítségével!
              </h2>
              <p className="text-base text-slate-700 mt-1">
                Kattintsatok a <strong>Fel ↑</strong> vagy <strong>Le ↓</strong> gombokra, hogy a
                4 mondat 1-től 4-ig pontos időrendbe kerüljön!
              </p>
            </div>

            <div className="space-y-3">
              {orderIndices.map((itemIdx, pos) => (
                <div
                  key={itemIdx}
                  className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-4 ${
                    q3Solved
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-amber-900/20 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B192C] font-display text-xl font-bold text-amber-300">
                      {pos + 1}.
                    </span>
                    <p className="text-base sm:text-lg font-bold">
                      {ORDER_ITEMS_CORRECT[itemIdx]}
                    </p>
                  </div>

                  {!q3Solved && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={pos === 0}
                        onClick={() => moveOrderItem(pos, -1)}
                        aria-label="Feljebb"
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-900/25 bg-amber-100 text-amber-950 hover:bg-amber-200 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        disabled={pos === orderIndices.length - 1}
                        onClick={() => moveOrderItem(pos, 1)}
                        aria-label="Lejjebb"
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-900/25 bg-amber-100 text-amber-950 hover:bg-amber-200 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowDown className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {q3Hint && (
              <p className="rounded-xl border border-amber-500/40 bg-amber-100 p-4 text-base font-semibold text-amber-950">
                Csillag súg: {q3Hint}
              </p>
            )}

            {!q3Solved && (
              <button
                type="button"
                onClick={checkQ3}
                className="rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white hover:bg-emerald-600 cursor-pointer"
              >
                Eseménysorrend ellenőrzése
              </button>
            )}
          </div>

          {q1Solved && q2Solved && q3Solved && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  setStage(3);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] shadow-lg hover:bg-amber-300 cursor-pointer"
              >
                <span>Kiváló munka! Irány az öt csapatpróba!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* PART 3: 5 Distinct Team Challenges (4 digits + 1 sorting rule) */}
      {stage === 3 && (
        <div className="space-y-6">
          <CsillagManoGuide
            message={`Négy csapat egy-egy 0 és 9 közötti számjegyet szerez, az ötödik csapat (Aranycsengők) pedig a rendezési szabályt fejti meg a négyjegyű zárkódhoz! (${
              TEAMS.filter((t) => solvedTeams[t.id]).length
            } / 5 csapat kész)`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Hópihe nyomozók: Complex Number Sequence -> 6 */}
            <div
              className={`rounded-3xl border-2 p-6 space-y-4 ${
                solvedTeams.hopihe
                  ? 'border-emerald-400 bg-[#12352C] text-white'
                  : 'border-sky-300/40 bg-[#FFF8EB] text-[#1E1B18]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      solvedTeams.hopihe ? 'text-emerald-300' : 'text-sky-800'
                    }`}
                  >
                    1. csapat · Hópihe nyomozók · Összetett számsor
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">
                    Figyeljétek meg a kettős szabályt! Melyik számjegy kerül a kérdőjel helyére?
                  </h3>
                </div>
                {solvedTeams.hopihe && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                )}
              </div>

              <div className="rounded-2xl border border-amber-900/15 bg-white p-4 text-center font-display text-2xl font-bold tracking-wide text-[#1E1B18] tabular-nums">
                2, &nbsp;6, &nbsp;4, &nbsp;8, &nbsp;
                <span className="inline-block rounded-lg bg-red-600 px-3 py-0.5 text-white">
                  {solvedTeams.hopihe ? '6' : hopiheInput || '?'}
                </span>
                , &nbsp;10, &nbsp;8, &nbsp;12
              </div>

              {!solvedTeams.hopihe ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setHopiheInput(String(d));
                        }}
                        className={`h-12 w-11 rounded-xl border-2 text-lg font-bold cursor-pointer ${
                          hopiheInput === String(d)
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-amber-900/20 bg-white text-[#1E1B18] hover:border-amber-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={checkHopihe}
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      Ellenőrzés
                    </button>
                    <button
                      type="button"
                      onClick={() => requestHint('hopihe')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-200 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {(hintLevels.hopihe ?? 0) === 0
                          ? 'Segítség (1. szint)'
                          : (hintLevels.hopihe ?? 0) === 1
                          ? 'Részletesebb segítség (2. szint)'
                          : 'Segítség megnyitva'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-300/60 bg-[#0B241E] p-4 text-amber-100">
                  ❄️ A Hópihe nyomozók megszerzett számjegye:{' '}
                  <span className="font-display text-2xl font-bold text-amber-300">6</span>
                </div>
              )}

              {(hintLevels.hopihe ?? 0) >= 1 && !solvedTeams.hopihe && (
                <div className="rounded-xl bg-amber-100 p-3.5 text-sm font-semibold text-amber-950 space-y-1">
                  <p>1. segítség: {TEAM_HINTS.hopihe[0]}</p>
                  {(hintLevels.hopihe ?? 0) >= 2 && (
                    <p className="pt-1 border-t border-amber-400/40">
                      2. segítség: {TEAM_HINTS.hopihe[1]}
                    </p>
                  )}
                </div>
              )}

              {teamErrors.hopihe && !solvedTeams.hopihe && (
                <p className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-900">
                  {teamErrors.hopihe}
                </p>
              )}
            </div>

            {/* 2. Csillagmanók: Exclusion Logic -> 3 */}
            <div
              className={`rounded-3xl border-2 p-6 space-y-4 ${
                solvedTeams.csillagmanok
                  ? 'border-emerald-400 bg-[#12352C] text-white'
                  : 'border-amber-300/40 bg-[#FFF8EB] text-[#1E1B18]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      solvedTeams.csillagmanok ? 'text-emerald-300' : 'text-amber-800'
                    }`}
                  >
                    2. csapat · Csillagmanók · Kizárásos logikai rejtvény
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">
                    Öt lámpás lóg a kastély falán: 1, 2, 3, 4 és 6. Melyik az igazi?
                  </h3>
                </div>
                {solvedTeams.csillagmanok && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                )}
              </div>

              <ul
                className={`space-y-1.5 rounded-2xl border p-4 text-base font-semibold ${
                  solvedTeams.csillagmanok
                    ? 'border-white/15 bg-white/5 text-slate-100'
                    : 'border-amber-900/15 bg-white text-[#1E1B18]'
                }`}
              >
                <li>1. A keresett számjegy kisebb 5-nél.</li>
                <li>2. A számjegy páratlan (nem osztható 2-vel).</li>
                <li>3. A számjegy nagyobb 2-nél.</li>
              </ul>

              {!solvedTeams.csillagmanok ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setCsillagChoice(n);
                        }}
                        className={`h-13 w-14 rounded-xl border-2 text-xl font-bold cursor-pointer ${
                          csillagChoice === n
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-amber-900/20 bg-white text-[#1E1B18] hover:border-amber-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={checkCsillag}
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      Ellenőrzés
                    </button>
                    <button
                      type="button"
                      onClick={() => requestHint('csillagmanok')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-200 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {(hintLevels.csillagmanok ?? 0) === 0
                          ? 'Segítség (1. szint)'
                          : (hintLevels.csillagmanok ?? 0) === 1
                          ? 'Részletesebb segítség (2. szint)'
                          : 'Segítség megnyitva'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-300/60 bg-[#0B241E] p-4 text-amber-100">
                  ⭐ A Csillagmanók megszerzett számjegye:{' '}
                  <span className="font-display text-2xl font-bold text-amber-300">3</span>
                </div>
              )}

              {(hintLevels.csillagmanok ?? 0) >= 1 && !solvedTeams.csillagmanok && (
                <div className="rounded-xl bg-amber-100 p-3.5 text-sm font-semibold text-amber-950 space-y-1">
                  <p>1. segítség: {TEAM_HINTS.csillagmanok[0]}</p>
                  {(hintLevels.csillagmanok ?? 0) >= 2 && (
                    <p className="pt-1 border-t border-amber-400/40">
                      2. segítség: {TEAM_HINTS.csillagmanok[1]}
                    </p>
                  )}
                </div>
              )}

              {teamErrors.csillagmanok && !solvedTeams.csillagmanok && (
                <p className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-900">
                  {teamErrors.csillagmanok}
                </p>
              )}
            </div>

            {/* 3. Mézeskalács detektívek: Two-digit number riddle -> 25 -> digit 5 */}
            <div
              className={`rounded-3xl border-2 p-6 space-y-4 ${
                solvedTeams.mezeskalacs
                  ? 'border-emerald-400 bg-[#12352C] text-white'
                  : 'border-orange-300/40 bg-[#FFF8EB] text-[#1E1B18]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      solvedTeams.mezeskalacs ? 'text-emerald-300' : 'text-orange-800'
                    }`}
                  >
                    3. csapat · Mézeskalács detektívek · Kétjegyű szám kitalálása
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">
                    Találjátok ki a titkos kétjegyű számot!
                  </h3>
                </div>
                {solvedTeams.mezeskalacs && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                )}
              </div>

              <ul
                className={`space-y-1.5 rounded-2xl border p-4 text-base font-semibold ${
                  solvedTeams.mezeskalacs
                    ? 'border-white/15 bg-white/5 text-slate-100'
                    : 'border-amber-900/15 bg-white text-[#1E1B18]'
                }`}
              >
                <li>• A kétjegyű szám 20 és 30 között van.</li>
                <li>• Páratlan szám.</li>
                <li>• Ha összeadjuk a két számjegyét, pontosan 7-et kapunk.</li>
                <li>• A négyjegyű kódhoz a szám egyes helyiértékű (második) számjegye kell!</li>
              </ul>

              {!solvedTeams.mezeskalacs ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 min-w-[100px] items-center justify-center rounded-xl border-2 border-red-700 bg-white px-4 font-display text-2xl font-bold text-red-800">
                      {mezesInput || '__'}
                    </div>
                    {mezesInput.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMezesInput((prev) => prev.slice(0, -1))}
                        className="rounded-xl border border-slate-300 bg-white p-3 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        aria-label="Törlés"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (mezesInput.length >= 2) return;
                          soundEngine.playClick();
                          setMezesInput((prev) => prev + String(d));
                        }}
                        className="h-11 w-11 rounded-xl border border-amber-900/25 bg-white text-lg font-bold text-[#1E1B18] hover:bg-amber-100 cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={checkMezes}
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      Ellenőrzés
                    </button>
                    <button
                      type="button"
                      onClick={() => requestHint('mezeskalacs')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-200 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {(hintLevels.mezeskalacs ?? 0) === 0
                          ? 'Segítség (1. szint)'
                          : (hintLevels.mezeskalacs ?? 0) === 1
                          ? 'Részletesebb segítség (2. szint)'
                          : 'Segítség megnyitva'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-300/60 bg-[#0B241E] p-4 text-amber-100">
                  🍪 A titkos kétjegyű szám a <strong>25</strong>! A Mézeskalács detektívek
                  számjegye:{' '}
                  <span className="font-display text-2xl font-bold text-amber-300">5</span>
                </div>
              )}

              {(hintLevels.mezeskalacs ?? 0) >= 1 && !solvedTeams.mezeskalacs && (
                <div className="rounded-xl bg-amber-100 p-3.5 text-sm font-semibold text-amber-950 space-y-1">
                  <p>1. segítség: {TEAM_HINTS.mezeskalacs[0]}</p>
                  {(hintLevels.mezeskalacs ?? 0) >= 2 && (
                    <p className="pt-1 border-t border-amber-400/40">
                      2. segítség: {TEAM_HINTS.mezeskalacs[1]}
                    </p>
                  )}
                </div>
              )}

              {teamErrors.mezeskalacs && !solvedTeams.mezeskalacs && (
                <p className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-900">
                  {teamErrors.mezeskalacs}
                </p>
              )}
            </div>

            {/* 4. Rénszarvas őrjárat: Symbol Cipher (★ ◆ ● -> TÉL) -> digit 7 */}
            <div
              className={`rounded-3xl border-2 p-6 space-y-4 ${
                solvedTeams.renszarvas
                  ? 'border-emerald-400 bg-[#12352C] text-white'
                  : 'border-rose-300/40 bg-[#FFF8EB] text-[#1E1B18]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      solvedTeams.renszarvas ? 'text-emerald-300' : 'text-red-800'
                    }`}
                  >
                    4. csapat · RÉNSZARVAS ŐRJÁRAT – TITKOS JELKÉPEK
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">
                    „A Titkok Őrzője különleges jelképekkel írt egy hárombetűs téli szót. Fejtsétek
                    meg az üzenetet a titkos kódtábla segítségével!”
                  </h3>
                </div>
                {solvedTeams.renszarvas && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                )}
              </div>

              <div className="rounded-2xl border border-amber-900/15 bg-white p-4 space-y-3 text-[#1E1B18]">
                <p className="text-xs font-bold uppercase tracking-wider text-red-800">
                  Titkos kódtábla:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {CIPHER_SYMBOLS.map((item) => (
                    <div
                      key={item.symbol}
                      className="rounded-xl bg-amber-50 border border-amber-300 py-2 text-lg font-bold"
                    >
                      <span className="text-red-800">{item.symbol}</span> = {item.letter}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-900/15 bg-white p-3.5 text-center text-[#1E1B18]">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Titkos üzenet:
                </span>
                <span className="font-display text-3xl font-bold tracking-[0.45em] text-red-800">
                  ★ ◆ ●
                </span>
              </div>

              {!solvedTeams.renszarvas ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-700">Válaszlehetőségek:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {['TÉL', 'TŰZ', 'KÉK', 'LÉP'].map((wordOption) => (
                        <button
                          key={wordOption}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setRenszarvasWord(wordOption);
                          }}
                          className={`rounded-2xl border-2 px-4 py-3 text-xl font-bold transition-all cursor-pointer ${
                            renszarvasWord === wordOption
                              ? 'border-red-600 bg-red-600 text-white shadow-md'
                              : 'border-amber-900/20 bg-white text-[#1E1B18] hover:border-amber-600'
                          }`}
                        >
                          {wordOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={checkRenszarvas}
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      Ellenőrzés
                    </button>
                    <button
                      type="button"
                      onClick={() => requestHint('renszarvas')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-200 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {(hintLevels.renszarvas ?? 0) === 0
                          ? 'Segítség (1. szint)'
                          : (hintLevels.renszarvas ?? 0) === 1
                          ? 'Részletesebb segítség (2. szint)'
                          : 'Segítség megnyitva'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-300/60 bg-[#0B241E] p-4 text-amber-100 space-y-1.5">
                  <p className="font-bold text-emerald-300">
                    „Ügyes nyomozók! Megfejtettétek a Titkok Őrzőjének üzenetét!”
                  </p>
                  <p>
                    🧭 Megfejtés: <strong>TÉL</strong> · A Rénszarvas őrjárat kódszáma:{' '}
                    <span className="font-display text-2xl font-bold text-amber-300">7</span>
                  </p>
                </div>
              )}

              {(hintLevels.renszarvas ?? 0) >= 1 && !solvedTeams.renszarvas && (
                <div className="rounded-xl bg-amber-100 p-3.5 text-sm font-semibold text-amber-950 space-y-1">
                  <p>1. segítség: {TEAM_HINTS.renszarvas[0]}</p>
                  {(hintLevels.renszarvas ?? 0) >= 2 && (
                    <p className="pt-1 border-t border-amber-400/40">
                      2. segítség: {TEAM_HINTS.renszarvas[1]}
                    </p>
                  )}
                </div>
              )}

              {teamErrors.renszarvas && !solvedTeams.renszarvas && (
                <p className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-900">
                  {teamErrors.renszarvas}
                </p>
              )}
            </div>

            {/* 5. Aranycsengők: Pattern Recognition -> Sorting Rule ("Növekvő sorrend") */}
            <div
              className={`lg:col-span-2 rounded-3xl border-2 p-6 space-y-4 ${
                solvedTeams.aranycsengok
                  ? 'border-emerald-400 bg-[#12352C] text-white'
                  : 'border-emerald-300/40 bg-[#FFF8EB] text-[#1E1B18]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      solvedTeams.aranycsengok ? 'text-emerald-300' : 'text-emerald-800'
                    }`}
                  >
                    5. csapat · Aranycsengők · Mintázatfelismerés és rendezési szabály
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">
                    Figyeljétek meg az alábbi mintázatot! Milyen rendezési szabály alapján követik
                    egymást a csengők és a számok?
                  </h3>
                </div>
                {solvedTeams.aranycsengok && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                )}
              </div>

              <div className="rounded-2xl border border-amber-900/15 bg-white p-4 text-center space-y-2 text-[#1E1B18]">
                <p className="text-xl sm:text-2xl font-bold">
                  🔔 (2) &nbsp;→&nbsp; 🔔🔔 (4) &nbsp;→&nbsp; 🔔🔔🔔 (6) &nbsp;→&nbsp; 🔔🔔🔔🔔 (8)
                </p>
                <p className="font-display text-xl font-bold text-emerald-800">
                  12 &nbsp;→&nbsp; 15 &nbsp;→&nbsp; 18 &nbsp;→&nbsp; 21 &nbsp;→&nbsp; ...
                </p>
              </div>
              <p className="text-lg font-bold">
                Milyen sorrendbe kell állítani a négy számjegyet a zár kinyitásához?
              </p>

              {!solvedTeams.aranycsengok ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      'Csökkenő sorrend (legnagyobbtól a legkisebbig)',
                      ARANY_RULE_CORRECT,
                      'Véletlenszerű sorrend',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setAranyChoice(opt);
                        }}
                        className={`rounded-2xl border-2 px-4 py-3.5 text-left text-base font-bold cursor-pointer ${
                          aranyChoice === opt
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-amber-900/20 bg-white text-[#1E1B18] hover:border-amber-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={checkArany}
                      className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      Ellenőrzés
                    </button>
                    <button
                      type="button"
                      onClick={() => requestHint('aranycsengok')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-600/40 bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-200 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {(hintLevels.aranycsengok ?? 0) === 0
                          ? 'Segítség (1. szint)'
                          : (hintLevels.aranycsengok ?? 0) === 1
                          ? 'Részletesebb segítség (2. szint)'
                          : 'Segítség megnyitva'}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-300/60 bg-[#0B241E] p-4 text-amber-100">
                  🔔 Az Aranycsengők megszerzett rendezési szabálya:{' '}
                  <span className="font-display text-xl font-bold text-amber-300">
                    Növekvő sorrend (legkisebbtől a legnagyobbig)
                  </span>
                </div>
              )}

              {(hintLevels.aranycsengok ?? 0) >= 1 && !solvedTeams.aranycsengok && (
                <div className="rounded-xl bg-amber-100 p-3.5 text-sm font-semibold text-amber-950 space-y-1">
                  <p>1. segítség: {TEAM_HINTS.aranycsengok[0]}</p>
                  {(hintLevels.aranycsengok ?? 0) >= 2 && (
                    <p className="pt-1 border-t border-amber-400/40">
                      2. segítség: {TEAM_HINTS.aranycsengok[1]}
                    </p>
                  )}
                </div>
              )}

              {teamErrors.aranycsengok && !solvedTeams.aranycsengok && (
                <p className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-900">
                  {teamErrors.aranycsengok}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            {allTeamsSolved ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSealUnlock();
                  setStage(4);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] shadow-xl hover:bg-amber-300 cursor-pointer"
              >
                <Sparkles className="w-6 h-6" />
                <span>Minden nyom megvan! Irány a négyjegyű zár!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            ) : (
              <p className="rounded-2xl border border-white/15 bg-[#122643] px-6 py-4 text-base font-semibold text-slate-200">
                Az ajtó csak akkor nyitható, ha mind az öt csapat megfejtette a saját próbáját!
              </p>
            )}
          </div>
        </div>
      )}

      {/* PART 4: 4-Digit Golden Padlock (3567) & Animated Magic Door Opening */}
      {stage === 4 && (
        <div className="space-y-8">
          {!sealRevealed ? (
            <div className="rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-[#132949] to-[#0B192C] p-6 sm:p-10 shadow-2xl space-y-8">
              <div className="text-center space-y-2">
                <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
                  4. rész · Közös négyjegyű kód és az első varázsajtó
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                  Nyissátok ki együtt a nagy arany lakatot!
                </h2>
                <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto">
                  Állítsátok össze és írjátok be önállóan a négyjegyű kódot a megszerzett
                  számjegyekből az Aranycsengők rendezési szabálya alapján!
                </p>
              </div>

              {/* Animated Magic Door + Large Golden Padlock */}
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border-2 border-amber-400/50 bg-[#0A1626] p-6 sm:p-8 shadow-inner min-h-[340px] flex flex-col items-center justify-center">
                {/* Golden glow behind door */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 bg-gradient-to-t from-amber-500/40 via-amber-300/30 to-yellow-100/20 transition-opacity duration-1000 ${
                    doorOpened ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Left & Right Magic Door Leaves */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1/2 border-r-2 border-amber-500/60 bg-gradient-to-r from-[#5C1414] to-[#7F1D1D] transition-transform duration-1000 ease-out ${
                    doorOpened ? '-translate-x-full' : 'translate-x-0'
                  }`}
                />
                <div
                  aria-hidden="true"
                  className={`absolute inset-y-0 right-0 w-1/2 border-l-2 border-amber-500/60 bg-gradient-to-l from-[#5C1414] to-[#7F1D1D] transition-transform duration-1000 ease-out ${
                    doorOpened ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />

                {/* Large Golden Padlock SVG */}
                <div className="relative z-10 flex flex-col items-center">
                  <svg
                    viewBox="0 0 140 160"
                    className={`w-36 h-40 drop-shadow-[0_10px_25px_rgba(251,191,36,0.45)] transition-transform duration-700 ${
                      lockOpened ? 'scale-110' : ''
                    }`}
                  >
                    <defs>
                      <linearGradient id="goldPadlock" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FEF08A" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                    </defs>
                    {/* Shackle animates up when unlocked */}
                    <path
                      d="M42 66 V42 C42 22 98 22 98 42 V66"
                      fill="none"
                      stroke="url(#goldPadlock)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      style={{
                        transform: lockOpened ? 'translateY(-18px)' : 'translateY(0)',
                        transition: 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                    {/* Padlock body */}
                    <rect
                      x="22"
                      y="64"
                      width="96"
                      height="78"
                      rx="16"
                      fill="url(#goldPadlock)"
                      stroke="#FFFBEB"
                      strokeWidth="3"
                    />
                    <circle cx="70" cy="96" r="10" fill="#78350F" />
                    <path d="M65 102 L75 102 L78 124 L62 124 Z" fill="#78350F" />
                  </svg>

                  {doorOpened && (
                    <p className="mt-4 font-display text-2xl font-bold text-amber-200 animate-pulse">
                      Az első varázsajtó feltárul...
                    </p>
                  )}
                </div>
              </div>

              {/* 4 Empty Digit Slots — students enter the digits themselves */}
              {!lockOpened && (
                <div className="space-y-6">
                  {allTeamsSolved && (
                    <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-amber-200">
                      {FOUR_DIGIT_TEAM_RESULTS.map((t) => (
                        <span
                          key={t.teamId}
                          className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold"
                        >
                          {t.label}: <strong className="text-amber-300">{t.digit}</strong>
                        </span>
                      ))}
                      <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 font-semibold text-emerald-200">
                        Aranycsengők szabálya: <strong>Növekvő sorrend</strong>
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                    {[0, 1, 2, 3].map((idx) => {
                      const isActive = activeSlot === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setActiveSlot(idx);
                          }}
                          className={`flex flex-col items-center rounded-2xl border-2 p-3 transition-all cursor-pointer ${
                            isActive
                              ? 'border-amber-300 bg-amber-400/20 scale-105'
                              : 'border-white/20 bg-[#152D50] hover:border-amber-300/50'
                          }`}
                        >
                          <span className="text-xs font-bold text-amber-200 text-center leading-tight">
                            {idx + 1}. hely
                          </span>
                          <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-amber-400 bg-[#FFF8EB] font-display text-3xl font-bold text-[#1E1B18]">
                            {codeSlots[idx] !== null ? codeSlots[idx] : '_'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 0-9 keypad */}
                  <div className="flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleEnterLockDigit(num)}
                        className="h-14 w-14 rounded-2xl border border-amber-300/40 bg-white/10 text-2xl font-bold text-amber-100 hover:bg-amber-400 hover:text-[#0B192C] transition-colors cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setCodeSlots([null, null, null, null]);
                        setActiveSlot(0);
                        setLockError(null);
                      }}
                      className="h-14 px-4 rounded-2xl border border-white/20 bg-white/5 text-sm font-bold text-slate-200 hover:bg-white/15 cursor-pointer"
                    >
                      Törlés
                    </button>
                  </div>

                  {lockError && (
                    <div className="mx-auto max-w-xl rounded-2xl border-2 border-rose-400/60 bg-rose-950/75 p-4 text-center text-lg font-bold text-rose-100">
                      {lockError}
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={checkPadlockCode}
                      className="inline-flex items-center gap-3 rounded-2xl bg-red-600 px-9 py-4 text-xl font-bold text-white shadow-xl hover:bg-red-500 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Lock className="w-6 h-6" />
                      <span>Lakat kinyitása!</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <MissionCompleteBanner
              missionId="nov-25"
              onBackToOverview={onBackToOverview}
              onGoToClues={onGoToClues}
              onReplay={handleReplay}
            />
          )}
        </div>
      )}
    </div>
  );
};
