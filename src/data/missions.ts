import { MissionId, MissionMeta, TeamInfo } from '../types/game';

export const ASSETS = {
  workshopHero: '/src/assets/images/winter_castle_five_doors_1795376721879.jpg',
  csillagMano: '/src/assets/images/csillag_mano_mascot_1795373842747.jpg',
  sealedScroll: '/src/assets/images/sealed_scroll_nov25_1795373843483.jpg',
  magicalDoorsHall: '/src/assets/images/magical_doors_hall_1795373843980.jpg',
} as const;

// STRICT SECRECY: Only imported and displayed after completing Mission 5 (Dec 1)
export const FINAL_REWARD_IMAGE = '/src/assets/images/santa_and_train_finale_1795375146793.jpg';

export const TEAMS: TeamInfo[] = [
  {
    id: 'hopihe',
    name: 'Hópihe nyomozók',
    motto: 'Éles szemmel minden apró nyomot észreveszünk!',
    accentHex: '#38BDF8',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-400/40',
    textClass: 'text-sky-200',
  },
  {
    id: 'csillagmanok',
    name: 'Csillagmanók',
    motto: 'Ragyogó ötletekkel világítjuk meg a sötét rejtélyeket!',
    accentHex: '#FBBF24',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-400/40',
    textClass: 'text-amber-200',
  },
  {
    id: 'mezeskalacs',
    name: 'Mézeskalács detektívek',
    motto: 'Türelemmel és összefogással minden kérdést megoldunk!',
    accentHex: '#FB923C',
    bgClass: 'bg-orange-500/15',
    borderClass: 'border-orange-400/40',
    textClass: 'text-orange-200',
  },
  {
    id: 'renszarvas',
    name: 'Rénszarvas őrjárat',
    motto: 'Bátran és biztos léptekkel haladunk a cél felé!',
    accentHex: '#F87171',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-400/40',
    textClass: 'text-rose-200',
  },
  {
    id: 'aranycsengok',
    name: 'Aranycsengők',
    motto: 'Figyelmesen hallgatunk minden titkos jelre!',
    accentHex: '#34D399',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-400/40',
    textClass: 'text-emerald-200',
  },
];

export const MISSIONS: MissionMeta[] = [
  {
    id: 'nov-25',
    dayNumber: 1,
    dateLabel: 'November 25.',
    shortDate: 'Nov. 25.',
    unlockMonth: 11,
    unlockDay: 25,
    title: 'A titokzatos levél',
    subtitle:
      'Szigorúan titkos üzenet érkezett a Titkok Őrzőjétől! Olvassuk el figyelmesen, és fejtsük meg együtt a rejtélyt!',
    sealTitle: 'Első arany varázspecsét',
    clueText: 'Valami különleges vár rátok!',
    doorColor: '#B91C1C',
  },
  {
    id: 'nov-26',
    dayNumber: 2,
    dateLabel: 'November 26.',
    shortDate: 'Nov. 26.',
    unlockMonth: 11,
    unlockDay: 26,
    title: 'A titokzatos csomagterem',
    subtitle:
      'A havas kastély egyik termében összekeveredtek a ládák és a címkék! Állítsuk helyre a rendet közösen!',
    sealTitle: 'Második arany varázspecsét',
    clueText: 'Ezen a napon nem minden úgy történik majd, mint máskor.',
    doorColor: '#15803D',
  },
  {
    id: 'nov-27',
    dayNumber: 3,
    dateLabel: 'November 27.',
    shortDate: 'Nov. 27.',
    unlockMonth: 11,
    unlockDay: 27,
    title: 'A varázslatos útvonal',
    subtitle:
      'Vezessük át Csillagot a havas fenyves útvesztőjén gondolkodtató rejtvények segítségével!',
    sealTitle: 'Harmadik arany varázspecsét',
    clueText: 'A kalandhoz kíváncsiságra és bátorságra is szükségetek lesz.',
    doorColor: '#1D4ED8',
  },
  {
    id: 'nov-30',
    dayNumber: 4,
    dateLabel: 'November 30.',
    shortDate: 'Nov. 30.',
    unlockMonth: 11,
    unlockDay: 30,
    title: 'A titkos hangok',
    subtitle:
      'Hallgassátok meg a téli erdő rejtélyes hangjait, és fejtsétek meg a csapatok titkosírását!',
    sealTitle: 'Negyedik arany varázspecsét',
    clueText: 'Egy különleges helyre vezet az utatok.',
    doorColor: '#7C3AED',
  },
  {
    id: 'dec-01',
    dayNumber: 5,
    dateLabel: 'December 1.',
    shortDate: 'Dec. 1.',
    unlockMonth: 12,
    unlockDay: 1,
    title: 'Az ötödik pecsét',
    subtitle:
      'Leplezzük le a Titkok Őrzőjét, és nyissuk fel együtt az utolsó titkos borítékot!',
    sealTitle: 'Ötödik arany varázspecsét',
    clueText: 'Az ötödik pecsét feltárta a nagy meglepetést!',
    doorColor: '#D97706',
  },
];

export const MISSION_ORDER: MissionId[] = ['nov-25', 'nov-26', 'nov-27', 'nov-30', 'dec-01'];

export const FINAL_CONGRATULATIONS_LINES = [
  'GRATULÁLUNK, 3. B!',
  'MEGFEJTETTÉTEK A NAGY TITKOT!',
  'MA, DECEMBER 1-JÉN',
  'MIKULÁSVONATOZNI INDULUNK!',
  'KÉSZÜLJETEK A VARÁZSLATOS KALANDRA!',
];
