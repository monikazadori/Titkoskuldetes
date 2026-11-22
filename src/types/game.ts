export type MissionId = 'nov-25' | 'nov-26' | 'nov-27' | 'nov-30' | 'dec-01';

export type TeamId =
  | 'hopihe'
  | 'csillagmanok'
  | 'mezeskalacs'
  | 'renszarvas'
  | 'aranycsengok';

export interface TeamInfo {
  id: TeamId;
  name: string;
  motto: string;
  accentHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export interface MissionMeta {
  id: MissionId;
  dayNumber: number;
  dateLabel: string;
  shortDate: string;
  unlockMonth: number; // 11 for November, 12 for December
  unlockDay: number;
  title: string;
  subtitle: string;
  sealTitle: string;
  clueText: string;
  doorColor: string;
}

export interface TeacherSettings {
  strictDay1DateLock: boolean;
  simulatedDate: string | null; // YYYY-MM-DD or null for real date
  manualUnlocks: Record<MissionId, boolean>;
}

export interface GameProgress {
  completedMissions: MissionId[];
  missionStepProgress: Partial<Record<MissionId, number>>;
  teamCheckpoints: Partial<Record<MissionId, TeamId[]>>;
  finalRevealUnlocked: boolean;
}

export interface AudioPreferences {
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

export type AppView = 'home' | 'overview' | 'teams' | 'clues' | 'mission';
