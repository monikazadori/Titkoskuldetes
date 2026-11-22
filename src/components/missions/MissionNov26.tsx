import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Coffee,
  Cookie,
  Lamp,
  Lock,
  RotateCcw,
  Sparkles,
  Trees,
  Hand,
} from 'lucide-react';
import { TEAMS } from '../../data/missions';
import { TeamId } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { loadMissionState, saveMissionState } from '../../utils/storage';
import { CsillagManoGuide } from '../CsillagManoGuide';
import { MissionCompleteBanner } from '../MissionCompleteBanner';

interface MissionNov26SavedState extends Record<string, unknown> {
  stage: 1 | 2 | 3 | 4;
  matchedPairs: string[];
  selectedPkgId: string | null;
  pkgToRoom: Record<string, string>;
  matchSolved: boolean;
  matchHint: string | null;
  teamChoices: Record<string, string>;
  teamStates: Record<string, { solved: boolean; hint: string | null }>;
  orderPick: string[];
  orderSolved: boolean;
  orderHint: string | null;
  isReplaying: boolean;
}

interface MissionNov26Props {
  alreadyCompleted: boolean;
  onComplete: () => void;
  onTeamSolved: (teamId: TeamId) => void;
  onBackToOverview: () => void;
  onGoToClues: () => void;
  onReplayMission?: () => void;
}

interface MemoryCard {
  uid: number;
  pairId: string;
  label: string;
}

const MEMORY_ITEMS = [
  { pairId: 'lampas', label: 'Csillaglámpás' },
  { pairId: 'mezes', label: 'Mézeskalács' },
  { pairId: 'kesztyu', label: 'Kötött kesztyű' },
  { pairId: 'csengo', label: 'Aranycsengő' },
  { pairId: 'fenyo', label: 'Fenyőág' },
  { pairId: 'bogre', label: 'Meleg kakaó' },
];

function renderCardIcon(pairId: string) {
  switch (pairId) {
    case 'lampas':
      return <Lamp className="w-10 h-10 text-amber-600" />;
    case 'mezes':
      return <Cookie className="w-10 h-10 text-orange-600" />;
    case 'kesztyu':
      return <Hand className="w-10 h-10 text-sky-600" />;
    case 'csengo':
      return <Bell className="w-10 h-10 text-yellow-600" />;
    case 'fenyo':
      return <Trees className="w-10 h-10 text-emerald-700" />;
    default:
      return <Coffee className="w-10 h-10 text-red-700" />;
  }
}

const MATCH_PACKAGES = [
  {
    id: 'piros',
    name: 'Piros masnis doboz',
    clue: 'Fűszeres fahéjillat száll ki belőle.',
    targetKeeper: 'Mézeskalács-sütő terem',
  },
  {
    id: 'kek',
    name: 'Kék csillagos csomag',
    clue: 'Puha gyapjúból van, melegíti a kezet a hóban.',
    targetKeeper: 'Téli ruhás kamra',
  },
  {
    id: 'zold',
    name: 'Zöld szalagos doboz',
    clue: 'Sötétben is barátságos fénnyel világít.',
    targetKeeper: 'Lámpásőr torony',
  },
  {
    id: 'arany',
    name: 'Arany papíros csomag',
    clue: 'Ha megmozdítod, vidáman csilingel.',
    targetKeeper: 'Hangok szobája',
  },
];

const ROOMS = [
  'Téli ruhás kamra',
  'Hangok szobája',
  'Mézeskalács-sütő terem',
  'Lámpásőr torony',
];

const TEAM_CHALLENGES_26: {
  teamId: TeamId;
  level: string;
  question: string;
  options: string[];
  correct: string;
  hint: string;
  rewardSymbol: string;
  rewardClue: string;
}[] = [
  {
    teamId: 'hopihe',
    level: 'Többlépéses összeadás',
    question:
      'Az első polcon 24 piros és 18 zöld láda áll, majd elvisznek közülük 7-et. Hány láda maradt?',
    options: ['33', '35', '37', '42'],
    correct: '35',
    hint: 'Előbb adjátok össze: 24 + 18 = 42, utána vegyetek el 7-et: 42 − 7 = ?',
    rewardSymbol: '❄️',
    rewardClue: 'A Kék láda NEM az első és NEM az utolsó helyre kerül.',
  },
  {
    teamId: 'csillagmanok',
    level: 'Kizárásos súlymérés',
    question:
      'Ha 1 nagy láda ugyanannyit nyom, mint 3 közepes, és 1 közepes annyi, mint 2 kicsi, hány kicsi láda ér fel 2 nagy ládával?',
    options: ['6 kicsi', '10 kicsi', '12 kicsi'],
    correct: '12 kicsi',
    hint: '1 nagy = 3 közepes = 6 kicsi. Akkor 2 nagy láda = 6 + 6!',
    rewardSymbol: '⭐',
    rewardClue: 'Az Arany láda közvetlenül a Piros UTÁN áll.',
  },
  {
    teamId: 'mezeskalacs',
    level: 'Szimmetria és szórejtvény',
    question:
      'Melyik szó olvasható ugyanúgy elölről és hátulról is, és közepén egy magánhangzó áll?',
    options: ['KEREK', 'GÖRÖG', 'CSILLAG'],
    correct: 'GÖRÖG',
    hint: 'Mindkettő tükörszó lehet, de nézzétek a középső betűt: a KEREK közepén R van, a GÖRÖG közepén Ö!',
    rewardSymbol: '🍪',
    rewardClue: 'A Piros láda áll legelöl (1. helyen)!',
  },
  {
    teamId: 'renszarvas',
    level: 'Összetett sorrend',
    question:
      'Három kulcs közül a Kék nehezebb a Zöldnél, a Piros könnyebb a Zöldnél, a Fehér pedig a Kék és a Zöld között van. Melyik a második legnehezebb?',
    options: ['Fehér', 'Zöld', 'Kék'],
    correct: 'Fehér',
    hint: 'Sorrend könnyűtől nehézig: Piros < Zöld < Fehér < Kék.',
    rewardSymbol: '🧭',
    rewardClue: 'A Zöld láda áll a legvégén (4. helyen)!',
  },
  {
    teamId: 'aranycsengok',
    level: 'Osztás és maradék',
    question:
      '45 díszszalagot 7 egyforma csokorba kötnek úgy, hogy mindegyikbe ugyanannyi jut. Hány szalag marad ki a végén?',
    options: ['2 szalag', '3 szalag', '4 szalag'],
    correct: '3 szalag',
    hint: '7 × 6 = 42. Mennyi marad 45-ből, ha elhasználtuk a 42-t?',
    rewardSymbol: '🔔',
    rewardClue: 'Megerősítés: a 4 láda sorrendje csak az előző 4 nyom együttese alapján biztos!',
  },
];

const BOX_COLORS = ['Piros', 'Arany', 'Kék', 'Zöld'];

export const MissionNov26: React.FC<MissionNov26Props> = ({
  alreadyCompleted,
  onComplete,
  onTeamSolved,
  onBackToOverview,
  onGoToClues,
  onReplayMission,
}) => {
  const [savedInitial] = useState<Partial<MissionNov26SavedState> | null>(() =>
    loadMissionState<MissionNov26SavedState>('nov-26')
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

  const cards = useMemo<MemoryCard[]>(() => {
    const doubled = [...MEMORY_ITEMS, ...MEMORY_ITEMS].map((item, idx) => ({
      uid: idx,
      pairId: item.pairId,
      label: item.label,
    }));
    const order = [0, 7, 3, 10, 1, 8, 5, 11, 2, 6, 4, 9];
    return order.map((idx) => doubled[idx]);
  }, []);

  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.matchedPairs)
      ? []
      : savedInitial.matchedPairs
  );
  const [lockBoard, setLockBoard] = useState(false);

  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.selectedPkgId ?? null)
  );
  const [pkgToRoom, setPkgToRoom] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.pkgToRoom ?? {})
  );
  const [matchSolved, setMatchSolved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.matchSolved)
  );
  const [matchHint, setMatchHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.matchHint ?? null)
  );

  const [teamChoices, setTeamChoices] = useState<Record<string, string>>(() =>
    resumeCompletedView ? {} : (savedInitial?.teamChoices ?? {})
  );
  const [teamStates, setTeamStates] = useState<
    Record<string, { solved: boolean; hint: string | null }>
  >(() => (resumeCompletedView ? {} : (savedInitial?.teamStates ?? {})));

  // Common final order lock: Piros, Arany, Kék, Zöld
  const [orderPick, setOrderPick] = useState<string[]>(() =>
    resumeCompletedView || !Array.isArray(savedInitial?.orderPick)
      ? []
      : savedInitial.orderPick
  );
  const [orderSolved, setOrderSolved] = useState<boolean>(() =>
    resumeCompletedView ? false : Boolean(savedInitial?.orderSolved)
  );
  const [orderHint, setOrderHint] = useState<string | null>(() =>
    resumeCompletedView ? null : (savedInitial?.orderHint ?? null)
  );

  useEffect(() => {
    saveMissionState<MissionNov26SavedState>('nov-26', {
      stage,
      matchedPairs,
      selectedPkgId,
      pkgToRoom,
      matchSolved,
      matchHint,
      teamChoices,
      teamStates,
      orderPick,
      orderSolved,
      orderHint,
      isReplaying,
    });
  }, [
    stage,
    matchedPairs,
    selectedPkgId,
    pkgToRoom,
    matchSolved,
    matchHint,
    teamChoices,
    teamStates,
    orderPick,
    orderSolved,
    orderHint,
    isReplaying,
  ]);

  const handleReplay = () => {
    soundEngine.playClick();
    saveMissionState<MissionNov26SavedState>('nov-26', {
      stage: 1,
      matchedPairs: [],
      selectedPkgId: null,
      pkgToRoom: {},
      matchSolved: false,
      matchHint: null,
      teamChoices: {},
      teamStates: {},
      orderPick: [],
      orderSolved: false,
      orderHint: null,
      isReplaying: true,
    });
    setIsReplaying(true);
    setStage(1);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setLockBoard(false);
    setSelectedPkgId(null);
    setPkgToRoom({});
    setMatchSolved(false);
    setMatchHint(null);
    setTeamChoices({});
    setTeamStates({});
    setOrderPick([]);
    setOrderSolved(false);
    setOrderHint(null);
    onReplayMission?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardFlip = (cardIdx: number) => {
    if (lockBoard) return;
    if (flippedIndices.includes(cardIdx)) return;
    const card = cards[cardIdx];
    if (matchedPairs.includes(card.pairId)) return;

    soundEngine.playClick();
    const nextFlipped = [...flippedIndices, cardIdx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setLockBoard(true);
      const first = cards[nextFlipped[0]];
      const second = cards[nextFlipped[1]];
      if (first.pairId === second.pairId) {
        soundEngine.playSuccess();
        setTimeout(() => {
          setMatchedPairs((prev) => [...prev, first.pairId]);
          setFlippedIndices([]);
          setLockBoard(false);
        }, 420);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setLockBoard(false);
        }, 850);
      }
    }
  };

  const handleRoomTap = (roomName: string) => {
    if (!selectedPkgId || matchSolved) return;
    soundEngine.playClick();
    setPkgToRoom((prev) => ({ ...prev, [selectedPkgId]: roomName }));
    setSelectedPkgId(null);
  };

  const checkMatching = () => {
    if (Object.keys(pkgToRoom).length < MATCH_PACKAGES.length) {
      soundEngine.playGentleHint();
      setMatchHint('Párosítsátok mind a négy csomagot egy-egy kastélyteremhez!');
      return;
    }
    const allCorrect = MATCH_PACKAGES.every((p) => pkgToRoom[p.id] === p.targetKeeper);
    if (allCorrect) {
      soundEngine.playSuccess();
      setMatchSolved(true);
      setMatchHint(null);
    } else {
      soundEngine.playGentleHint();
      setMatchHint(
        'Figyeljetek a nyomokra: a fahéjillat a Mézeskalács-sütő terembe, a gyapjú a Téli ruhás kamrába, a fény a Lámpásőr toronyba, a csilingelés a Hangok szobájába való!'
      );
    }
  };

  const checkAllTeams = () => {
    let allOk = true;
    const next: Record<string, { solved: boolean; hint: string | null }> = {};
    for (const c of TEAM_CHALLENGES_26) {
      const picked = teamChoices[c.teamId];
      if (picked === c.correct) {
        next[c.teamId] = { solved: true, hint: null };
        onTeamSolved(c.teamId);
      } else {
        allOk = false;
        next[c.teamId] = {
          solved: false,
          hint: picked ? c.hint : 'Válasszatok megoldást ennél a csapatnál is!',
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

  const allTeamsSolved = TEAM_CHALLENGES_26.every((c) => teamStates[c.teamId]?.solved);

  const handleToggleBoxOrder = (color: string) => {
    if (orderSolved) return;
    soundEngine.playClick();
    if (orderPick.includes(color)) {
      setOrderPick((prev) => prev.filter((c) => c !== color));
    } else {
      setOrderPick((prev) => [...prev, color]);
    }
  };

  const checkCommonOrder = () => {
    if (orderPick.length < 4) {
      soundEngine.playGentleHint();
      setOrderHint('Válasszátok ki sorban mind a négy láda színét!');
      return;
    }
    if (orderPick.join('-') === 'Piros-Arany-Kék-Zöld') {
      soundEngine.playSealUnlock();
      setOrderSolved(true);
      setOrderHint(null);
    } else {
      soundEngine.playGentleHint();
      setOrderHint(
        'Olvassátok el újra a csapatnyomokat: az 1. a Piros, utána az Arany, középen a Kék, és a 4. helyen a Zöld áll!'
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#122643]/90 px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            2. küldetés · November 26.
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            A titokzatos csomagterem
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {[
            { num: 1, label: 'Memóriajáték' },
            { num: 2, label: 'Terem-párosítás' },
            { num: 3, label: 'Csapatpróbák és közös sorrend' },
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

      {/* Stage 1: Memory Game */}
      {stage === 1 && (
        <div className="space-y-6">
          <CsillagManoGuide
            message={`Találjátok meg az egyforma téli tárgyakat a kártyák alatt! Időkorlát nincs, figyeljétek együtt a helyeket! (${matchedPairs.length} / 6 pár megtalálva)`}
            tone={matchedPairs.length === 6 ? 'success' : 'info'}
          />

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {cards.map((card, idx) => {
              const isFlipped =
                flippedIndices.includes(idx) || matchedPairs.includes(card.pairId);
              const isMatched = matchedPairs.includes(card.pairId);
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardFlip(idx)}
                  className={`h-32 sm:h-36 rounded-2xl border-2 p-3 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isMatched
                      ? 'border-emerald-400 bg-[#FFF8EB] text-[#1E1B18] shadow-md'
                      : isFlipped
                      ? 'border-amber-400 bg-[#FFF8EB] text-[#1E1B18] scale-[1.02]'
                      : 'border-amber-300/35 bg-[#163056] hover:bg-[#1E3F70] text-amber-200'
                  }`}
                >
                  {isFlipped ? (
                    <>
                      {renderCardIcon(card.pairId)}
                      <span className="mt-2 text-sm sm:text-base font-bold text-center leading-tight">
                        {card.label}
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-3xl font-bold text-amber-300">★</span>
                  )}
                </button>
              );
            })}
          </div>

          {matchedPairs.length === 6 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setStage(2);
                }}
                className="inline-flex items-center gap-3 rounded-2xl bg-amber-400 px-8 py-4 text-xl font-bold text-[#0B192C] shadow-lg hover:bg-amber-300 cursor-pointer"
              >
                <span>Ügyesek voltatok! Irány a párosítás!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage 2: Logic Matching */}
      {stage === 2 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Kattintsatok egy elveszett csomagra bal oldalon, majd arra a kastélyteremre jobb oldalon, ahová tartozik!" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-3xl border border-amber-300/30 bg-[#FFF8EB] p-6 sm:p-8 text-[#1E1B18]">
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-red-800 mb-3">
                1. Válassz csomagot!
              </h2>
              {MATCH_PACKAGES.map((pkg) => {
                const selected = selectedPkgId === pkg.id;
                const pairedRoom = pkgToRoom[pkg.id];
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    disabled={matchSolved}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedPkgId(pkg.id);
                    }}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                      selected
                        ? 'border-red-600 bg-red-50 shadow-md'
                        : pairedRoom
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-amber-900/20 bg-white hover:border-amber-600'
                    }`}
                  >
                    <p className="font-bold text-lg">{pkg.name}</p>
                    <p className="text-sm text-slate-700 mt-1">{pkg.clue}</p>
                    {pairedRoom && (
                      <p className="mt-2 text-sm font-bold text-emerald-800">
                        Párosítva: → {pairedRoom}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-red-800 mb-3">
                2. Melyik terembe való?
              </h2>
              {ROOMS.map((room) => (
                <button
                  key={room}
                  type="button"
                  disabled={!selectedPkgId || matchSolved}
                  onClick={() => handleRoomTap(room)}
                  className={`w-full text-left rounded-2xl border-2 p-5 text-lg font-bold transition-all cursor-pointer ${
                    selectedPkgId
                      ? 'border-amber-500 bg-amber-50 hover:bg-amber-100'
                      : 'border-amber-900/15 bg-white text-slate-700'
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          {matchHint && (
            <CsillagManoGuide speakerLabel="Segítség" message={matchHint} tone="hint" />
          )}

          <div className="flex justify-center">
            {!matchSolved ? (
              <button
                type="button"
                onClick={checkMatching}
                className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Párosítás ellenőrzése
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
                <span>Szuper! Következnek a csapatpróbák!</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stage 3: 5 Team Challenges + Interdependent Order Lock */}
      {stage === 3 && (
        <div className="space-y-6">
          <CsillagManoGuide message="Minden csapat szerez egy sorrend-nyomot a saját próbája után! Ötötök nyomaiból áll össze a négy láda pontos sorrendje." />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {TEAM_CHALLENGES_26.map((c) => {
              const team = TEAMS.find((t) => t.id === c.teamId)!;
              const state = teamStates[c.teamId];
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
                      {team.name} · {c.level}
                    </p>
                    {solved && <CheckCircle2 className="w-7 h-7 text-emerald-300" />}
                  </div>

                  <h3 className="mt-2 font-display text-xl font-bold">{c.question}</h3>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {c.options.map((opt) => {
                      const active = teamChoices[c.teamId] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={solved}
                          onClick={() => {
                            soundEngine.playClick();
                            setTeamChoices((prev) => ({ ...prev, [c.teamId]: opt }));
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
                      {c.rewardSymbol} Csapatnyom: {c.rewardClue}
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

          {/* Common 4-box sorting lock */}
          <div className="rounded-3xl border-2 border-amber-400/50 bg-[#142B4C] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Közös zárófeladat · A négy láda pontos sorrendje
                </p>
                <h3 className="font-display text-2xl font-bold text-white mt-1">
                  Állítsátok sorba a négy színes ládát az 5 csapat nyomaiból!
                </h3>
              </div>
              {!allTeamsSolved && <Lock className="w-7 h-7 text-slate-400" />}
            </div>

            {!allTeamsSolved ? (
              <p className="text-base text-slate-300">
                Előbb mind az 5 csapatnak meg kell szereznie a saját nyomát!
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="min-w-[110px] rounded-xl border-2 border-amber-400 bg-[#FFF8EB] px-4 py-3 text-center font-bold text-[#1E1B18]"
                    >
                      {idx + 1}. {orderPick[idx] ?? '___'}
                    </div>
                  ))}
                </div>

                {!orderSolved && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {BOX_COLORS.map((color) => {
                      const picked = orderPick.includes(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleToggleBoxOrder(color)}
                          className={`rounded-xl px-6 py-3 text-base font-bold cursor-pointer ${
                            picked
                              ? 'bg-red-600 text-white'
                              : 'bg-white/10 text-amber-100 hover:bg-white/20'
                          }`}
                        >
                          {color} láda
                        </button>
                      );
                    })}
                  </div>
                )}

                {orderHint && (
                  <p className="rounded-xl bg-amber-950/70 border border-amber-400/50 p-3.5 text-center text-base font-semibold text-amber-200">
                    {orderHint}
                  </p>
                )}

                <div className="flex justify-center">
                  {!orderSolved ? (
                    <button
                      type="button"
                      onClick={checkCommonOrder}
                      className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      Sorrend ellenőrzése
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
                      <span>Második arany varázspecsét megszerzése!</span>
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
          missionId="nov-26"
          onBackToOverview={onBackToOverview}
          onGoToClues={onGoToClues}
          onReplay={handleReplay}
        />
      )}
    </div>
  );
};
