import { MISSIONS } from '../data/missions';
import { AudioPreferences, GameProgress, MissionId, MissionMeta, TeacherSettings } from '../types/game';

const PROGRESS_KEY = 'mikulas_3b_progress_v1';
const TEACHER_KEY = 'mikulas_3b_teacher_v1';
const AUDIO_KEY = 'mikulas_3b_audio_v1';
const MISSION_STATES_KEY = 'mikulas_3b_mission_states_v1';

export const DEFAULT_PROGRESS: GameProgress = {
  completedMissions: [],
  missionStepProgress: {},
  teamCheckpoints: {},
  finalRevealUnlocked: false,
};

export const DEFAULT_TEACHER_SETTINGS: TeacherSettings = {
  strictDay1DateLock: false,
  simulatedDate: null,
  manualUnlocks: {
    'nov-25': false,
    'nov-26': false,
    'nov-27': false,
    'nov-30': false,
    'dec-01': false,
  },
};

export const DEFAULT_AUDIO_PREFS: AudioPreferences = {
  sfxEnabled: true,
  musicEnabled: false,
};

export function createDefaultProgress(): GameProgress {
  return {
    completedMissions: [],
    missionStepProgress: {},
    teamCheckpoints: {},
    finalRevealUnlocked: false,
  };
}

export function loadProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [],
      missionStepProgress: parsed.missionStepProgress ?? {},
      teamCheckpoints: parsed.teamCheckpoints ?? {},
      finalRevealUnlocked: Boolean(parsed.finalRevealUnlocked),
    };
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: GameProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadAllMissionStates(): Partial<Record<MissionId, Record<string, unknown>>> {
  try {
    const raw = localStorage.getItem(MISSION_STATES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Partial<Record<MissionId, Record<string, unknown>>>;
  } catch {
    return {};
  }
}

export function loadMissionState<T extends Record<string, unknown>>(
  missionId: MissionId
): Partial<T> | null {
  const all = loadAllMissionStates();
  const entry = all[missionId];
  if (!entry || typeof entry !== 'object') return null;
  return entry as Partial<T>;
}

export function saveMissionState<T extends Record<string, unknown>>(
  missionId: MissionId,
  state: T
): void {
  try {
    const all = loadAllMissionStates();
    all[missionId] = state;
    localStorage.setItem(MISSION_STATES_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearMissionState(missionId: MissionId): void {
  try {
    const all = loadAllMissionStates();
    delete all[missionId];
    localStorage.setItem(MISSION_STATES_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function markMissionReplayRequested(missionId: MissionId): void {
  try {
    const all = loadAllMissionStates();
    all[missionId] = { isReplaying: true };
    localStorage.setItem(MISSION_STATES_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearAllMissionStates(): void {
  try {
    localStorage.removeItem(MISSION_STATES_KEY);
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadTeacherSettings(): TeacherSettings {
  try {
    const raw = localStorage.getItem(TEACHER_KEY);
    if (!raw) {
      return {
        ...DEFAULT_TEACHER_SETTINGS,
        manualUnlocks: { ...DEFAULT_TEACHER_SETTINGS.manualUnlocks },
      };
    }
    const parsed = JSON.parse(raw) as Partial<TeacherSettings>;
    return {
      strictDay1DateLock: Boolean(parsed.strictDay1DateLock),
      simulatedDate: typeof parsed.simulatedDate === 'string' ? parsed.simulatedDate : null,
      manualUnlocks: {
        ...DEFAULT_TEACHER_SETTINGS.manualUnlocks,
        ...(parsed.manualUnlocks ?? {}),
      },
    };
  } catch {
    return {
      ...DEFAULT_TEACHER_SETTINGS,
      manualUnlocks: { ...DEFAULT_TEACHER_SETTINGS.manualUnlocks },
    };
  }
}

export function saveTeacherSettings(settings: TeacherSettings): void {
  try {
    localStorage.setItem(TEACHER_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors cleanly
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

export function getEffectiveDate(settings: TeacherSettings): Date {
  if (settings.simulatedDate) {
    const [y, m, d] = settings.simulatedDate.split('-').map(Number);
    if (y && m && d) {
      return new Date(y, m - 1, d, 12, 0, 0);
    }
  }
  return new Date();
}

export function isMissionDateReached(mission: MissionMeta, effectiveDate: Date): boolean {
  const month = effectiveDate.getMonth() + 1; // 1-12
  const day = effectiveDate.getDate();

  if (mission.unlockMonth === 11) {
    return (month === 11 && day >= mission.unlockDay) || month === 12;
  }
  if (mission.unlockMonth === 12) {
    return month === 12 && day >= mission.unlockDay;
  }
  return false;
}

export function isMissionUnlocked(
  missionId: MissionId,
  settings: TeacherSettings,
  progress: GameProgress
): boolean {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return false;

  // Already completed missions always remain accessible
  if (progress.completedMissions.includes(missionId)) {
    return true;
  }

  // Teacher manual unlock
  if (settings.manualUnlocks[missionId]) {
    return true;
  }

  const effectiveDate = getEffectiveDate(settings);

  // Day 1 is ready for immediate classroom exploration unless strict Day 1 calendar lock is turned on
  if (missionId === 'nov-25' && !settings.strictDay1DateLock) {
    return true;
  }

  return isMissionDateReached(mission, effectiveDate);
}

// STRICT SECRECY GUARD:
// Even if Mission 5 is unlocked, the final surprise ONLY unlocks after Mission 5 itself is completed
// AND Mission 5 is genuinely unlocked (on Dec 1 or explicitly unlocked by the teacher).
export function canShowFinalSurprise(
  settings: TeacherSettings,
  progress: GameProgress
): boolean {
  const dec1Unlocked = isMissionUnlocked('dec-01', settings, progress);
  const dec1Completed = progress.completedMissions.includes('dec-01');
  return dec1Unlocked && dec1Completed && progress.finalRevealUnlocked;
}
