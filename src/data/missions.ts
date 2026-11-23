import { DoorId, DoorMeta } from '../types/game';

export const ASSETS = {
  workshopHero: '/src/assets/images/winter_castle_five_doors_1795376721879.jpg',
  csillagMano: '/src/assets/images/csillag_mano_mascot_1795373842747.jpg',
  sealedScroll: '/src/assets/images/sealed_scroll_nov25_1795373843483.jpg',
  magicalDoorsHall: '/src/assets/images/magical_doors_hall_1795373843980.jpg',
} as const;

// STRICT SECRECY: Only displayed after all 5 seals are earned and the secret gift box is clicked
export const FINAL_TRAIN_PHOTO =
  '/assets/aistudio/ChatGPT-k_p_2026._nov._23._17_46_00_9a2386a1.png';
export const FINAL_FOREST_PHOTO =
  '/assets/aistudio/ChatGPT-k_p_2026._nov._23._17_46_09_b341633d.png';

export const DOORS: DoorMeta[] = [
  {
    id: 'door-1',
    doorNumber: 1,
    title: 'Az eltűnt tárgy',
    shortLabel: '1. ajtó',
    subtitle: 'Figyeljétek meg jól a hat téli tárgyat, mert az egyik varázsütésre eltűnik!',
    sealTitle: 'Első arany varázspecsét',
    doorColor: '#B91C1C',
  },
  {
    id: 'door-2',
    doorNumber: 2,
    title: 'A varázsszám',
    shortLabel: '2. ajtó',
    subtitle: 'Fedezzétek fel a titkos számsor szabályát, és találjátok meg a hiányzó számot!',
    sealTitle: 'Második arany varázspecsét',
    doorColor: '#15803D',
  },
  {
    id: 'door-3',
    doorNumber: 3,
    title: 'Az aranykulcs',
    shortLabel: '3. ajtó',
    subtitle: 'Következtessetek a nyomokból, melyik színes ládában rejtőzik az aranykulcs!',
    sealTitle: 'Harmadik arany varázspecsét',
    doorColor: '#1D4ED8',
  },
  {
    id: 'door-4',
    doorNumber: 4,
    title: 'A titkos üzenet',
    shortLabel: '4. ajtó',
    subtitle: 'Fejtsétek meg a három titkos jelképet a varázslatos kódtábla segítségével!',
    sealTitle: 'Negyedik arany varázspecsét',
    doorColor: '#7C3AED',
  },
  {
    id: 'door-5',
    doorNumber: 5,
    title: 'A csengők titka',
    shortLabel: '5. ajtó',
    subtitle: 'Jegyezzétek meg a négy színes csengő pontos sorrendjét, mielőtt eltűnnek!',
    sealTitle: 'Ötödik arany varázspecsét',
    doorColor: '#D97706',
  },
];

export const DOOR_ORDER: DoorId[] = ['door-1', 'door-2', 'door-3', 'door-4', 'door-5'];

export const DOOR_ORDINALS: Record<
  1 | 2 | 3 | 4 | 5,
  { lower: string; articleLower: string; articleCap: string }
> = {
  1: { lower: 'első', articleLower: 'az első', articleCap: 'Az első' },
  2: { lower: 'második', articleLower: 'a második', articleCap: 'A második' },
  3: { lower: 'harmadik', articleLower: 'a harmadik', articleCap: 'A harmadik' },
  4: { lower: 'negyedik', articleLower: 'a negyedik', articleCap: 'A negyedik' },
  5: { lower: 'ötödik', articleLower: 'az ötödik', articleCap: 'Az ötödik' },
};

export const LETTER_PARAGRAPHS = [
  'Egy különleges meglepetés előkészületei zajlanak, de egyelőre nem árulhatom el, mi vár rátok.',
  'Öt titkos pecsét őrzi a megfejtést. Csak azok tudhatják meg az igazságot, akik bizonyítják, hogy ügyesek, kitartóak, és képesek együtt gondolkodni.',
  'Ma öt különböző próbát kell teljesítenetek. Minden sikeres próba után egy újabb varázspecsét kerül a birtokotokba.',
];

export const FINAL_CONGRATULATIONS_LINES = [
  'GRATULÁLUNK, 3. B!',
  'MEGFEJTETTÉTEK A NAGY TITKOT!',
  'DECEMBER 1-JÉN MIKULÁSVONATOZNI INDULUNK!',
];

export const FINAL_SECOND_CAPTION =
  'A varázslat még csak most kezdődik! Különleges téli kaland vár rátok!';
