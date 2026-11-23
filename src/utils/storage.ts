import { DOORS } from '../data/missions';
import {
  AppView,
  AudioPreferences,
  DoorId,
  NavigationState,
  OneDayGameState,
  TeacherSettings,
} from '../types/game';

const GAME_STATE_KEY = 'titkos_teli_oneday_state_v1';
const TEACHER_KEY = 'titkos_teli_oneday_teacher_v1';
const NAV_STATE_KEY = 'titkos_teli_oneday_nav_v1';
const AUDIO_KEY = 'mikulas_3b_audio_v1';

export function createDefaultGameState(): OneDayGameState {
  return {
    letterOpened: false,
    tf1Answer: null,
    tf2Answer: null,
    tfHint: null,
    letterChallengeSolved: false,
    completedDoors: [],
    door1: {
      phase: 'observe',
      selectedOption: null,
      errorHint: null,
    },
    door2: {
      selectedOption: null,
      solved: false,
      errorHint: null,
    },
    door3: {
      openedEmpty: [],
      solved: false,
      errorHint: null,
    },
    door4: {
      selectedOption: null,
      solved: false,
      errorHint: null,
    },
    door5: {
      phase: 'observe',
      selectedOrder: null,
      errorHint: null,
    },
    giftBoxOpened: false,
    secondPhotoRevealed: false,
  };
}

export function createDefaultTeacherSettings(): TeacherSettings {
  return {
    manualUnlocks: {
      'door-1': false,
      'door-2': false,
      'door-3': false,
      'door-4': false,
      'door-5': false,
    },
  };
}

export const DEFAULT_AUDIO_PREFS: AudioPreferences = {
  sfxEnabled: true,
  musicEnabled: false,
};

export function loadGameState(): OneDayGameState {
  const def = createDefaultGameState();
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<OneDayGameState>;
    const completedDoors = Array.isArray(parsed.completedDoors)
      ? Array.from(
          new Set(
            parsed.completedDoors.filter((id): id is DoorId =>
              DOORS.some((d) => d.id === id)
            )
          )
        )
      : [];
    const allFiveCompleted = DOORS.every((d) => completedDoors.includes(d.id));

    return {
      letterOpened: Boolean(parsed.letterOpened),
      tf1Answer: typeof parsed.tf1Answer === 'boolean' ? parsed.tf1Answer : null,
      tf2Answer: typeof parsed.tf2Answer === 'boolean' ? parsed.tf2Answer : null,
      tfHint: typeof parsed.tfHint === 'string' ? parsed.tfHint : null,
      letterChallengeSolved: Boolean(parsed.letterChallengeSolved),
      completedDoors,
      door1: {
        phase:
          parsed.door1?.phase === 'guess' || parsed.door1?.phase === 'solved'
            ? parsed.door1.phase
            : 'observe',
        selectedOption:
          typeof parsed.door1?.selectedOption === 'string'
            ? parsed.door1.selectedOption
            : null,
        errorHint:
          typeof parsed.door1?.errorHint === 'string' ? parsed.door1.errorHint : null,
      },
      door2: {
        selectedOption:
          typeof parsed.door2?.selectedOption === 'string'
            ? parsed.door2.selectedOption
            : null,
        solved: Boolean(parsed.door2?.solved),
        errorHint:
          typeof parsed.door2?.errorHint === 'string' ? parsed.door2.errorHint : null,
      },
      door3: {
        openedEmpty: Array.isArray(parsed.door3?.openedEmpty)
          ? parsed.door3.openedEmpty.filter(
              (c): c is 'piros' | 'kek' => c === 'piros' || c === 'kek'
            )
          : [],
        solved: Boolean(parsed.door3?.solved),
        errorHint:
          typeof parsed.door3?.errorHint === 'string' ? parsed.door3.errorHint : null,
      },
      door4: {
        selectedOption:
          typeof parsed.door4?.selectedOption === 'string'
            ? parsed.door4.selectedOption
            : null,
        solved: Boolean(parsed.door4?.solved),
        errorHint:
          typeof parsed.door4?.errorHint === 'string' ? parsed.door4.errorHint : null,
      },
      door5: {
        phase:
          parsed.door5?.phase === 'guess' || parsed.door5?.phase === 'solved'
            ? parsed.door5.phase
            : 'observe',
        selectedOrder:
          typeof parsed.door5?.selectedOrder === 'string'
            ? parsed.door5.selectedOrder
            : null,
        errorHint:
          typeof parsed.door5?.errorHint === 'string' ? parsed.door5.errorHint : null,
      },
      giftBoxOpened: allFiveCompleted && Boolean(parsed.giftBoxOpened),
      secondPhotoRevealed:
        allFiveCompleted && Boolean(parsed.giftBoxOpened) && Boolean(parsed.secondPhotoRevealed),
    };
  } catch {
    return def;
  }
}

export function saveGameState(state: OneDayGameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function createDefaultNavigationState(): NavigationState {
  return {
    view: 'home',
    activeDoorId: 'door-1',
  };
}

export function loadNavigationState(): NavigationState {
  const def = createDefaultNavigationState();
  try {
    const raw = localStorage.getItem(NAV_STATE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<NavigationState>;
    const validViews: AppView[] = ['home', 'letter', 'doors', 'seals', 'door'];
    const view =
      parsed.view && validViews.includes(parsed.view) ? parsed.view : def.view;
    const activeDoorId =
      parsed.activeDoorId && DOORS.some((d) => d.id === parsed.activeDoorId)
        ? parsed.activeDoorId
        : def.activeDoorId;
    return { view, activeDoorId };
  } catch {
    return def;
  }
}

export function saveNavigationState(nav: NavigationState): void {
  try {
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify(nav));
  } catch {
    // Ignore quota errors
  }
}

export function resetAllGameStorage(): OneDayGameState {
  const fresh = createDefaultGameState();
  const freshNav = createDefaultNavigationState();
  try {
    localStorage.removeItem(GAME_STATE_KEY);
    localStorage.removeItem(TEACHER_KEY);
    localStorage.removeItem(NAV_STATE_KEY);
  } catch {
    // Ignore storage errors
  }
  saveGameState(fresh);
  saveTeacherSettings(createDefaultTeacherSettings());
  saveNavigationState(freshNav);
  return fresh;
}

export function loadTeacherSettings(): TeacherSettings {
  const def = createDefaultTeacherSettings();
  try {
    const raw = localStorage.getItem(TEACHER_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<TeacherSettings>;
    return {
      manualUnlocks: {
        ...def.manualUnlocks,
        ...(parsed.manualUnlocks ?? {}),
      },
    };
  } catch {
    return def;
  }
}

export function saveTeacherSettings(settings: TeacherSettings): void {
  try {
    localStorage.setItem(TEACHER_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadAudioPreferences(): AudioPreferences {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (!raw) return DEFAULT_AUDIO_PREFS;
    const parsed = JSON.parse(raw) as Partial<AudioPreferences>;
    return {
      sfxEnabled: parsed.sfxEnabled !== undefined ? Boolean(parsed.sfxEnabled) : true,
      musicEnabled: Boolean(parsed.musicEnabled),
    };
  } catch {
    return DEFAULT_AUDIO_PREFS;
  }
}

export function saveAudioPreferences(prefs: AudioPreferences): void {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

export function isDoorUnlocked(
  doorId: DoorId,
  state: OneDayGameState,
  settings: TeacherSettings
): boolean {
  if (state.completedDoors.includes(doorId)) {
    return true;
  }
  if (settings.manualUnlocks[doorId]) {
    return true;
  }
  switch (doorId) {
    case 'door-1':
      return state.letterChallengeSolved;
    case 'door-2':
      return state.completedDoors.includes('door-1');
    case 'door-3':
      return state.completedDoors.includes('door-2');
    case 'door-4':
      return state.completedDoors.includes('door-3');
    case 'door-5':
      return state.completedDoors.includes('door-4');
  }
}

export function canShowGiftBox(state: OneDayGameState): boolean {
  return DOORS.every((d) => state.completedDoors.includes(d.id));
}

export function canShowFinalSurprise(state: OneDayGameState): boolean {
  return canShowGiftBox(state) && state.giftBoxOpened;
}
