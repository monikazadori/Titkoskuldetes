export type DoorId = 'door-1' | 'door-2' | 'door-3' | 'door-4' | 'door-5';

export interface DoorMeta {
  id: DoorId;
  doorNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  shortLabel: string;
  subtitle: string;
  sealTitle: string;
  doorColor: string;
}

export interface Door1State {
  phase: 'observe' | 'guess' | 'solved';
  selectedOption: string | null;
  errorHint: string | null;
}

export interface Door2State {
  selectedOption: string | null;
  solved: boolean;
  errorHint: string | null;
}

export interface Door3State {
  openedEmpty: ('piros' | 'kek')[];
  solved: boolean;
  errorHint: string | null;
}

export interface Door4State {
  selectedOption: string | null;
  solved: boolean;
  errorHint: string | null;
}

export interface Door5State {
  phase: 'observe' | 'guess' | 'solved';
  selectedOrder: string | null;
  errorHint: string | null;
}

export interface OneDayGameState {
  letterOpened: boolean;
  tf1Answer: boolean | null;
  tf2Answer: boolean | null;
  tfHint: string | null;
  letterChallengeSolved: boolean;
  completedDoors: DoorId[];
  door1: Door1State;
  door2: Door2State;
  door3: Door3State;
  door4: Door4State;
  door5: Door5State;
  giftBoxOpened: boolean;
  secondPhotoRevealed: boolean;
}

export interface TeacherSettings {
  manualUnlocks: Record<DoorId, boolean>;
}

export interface AudioPreferences {
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

export type AppView = 'home' | 'letter' | 'doors' | 'seals' | 'door';
