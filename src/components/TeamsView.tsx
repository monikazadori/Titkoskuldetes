import React from 'react';
import { Shield, Snowflake, Star, Cookie, Bell, Compass } from 'lucide-react';
import { TEAMS } from '../data/missions';
import { GameProgress, TeamId } from '../types/game';
import { CsillagManoGuide } from './CsillagManoGuide';

interface TeamsViewProps {
  progress: GameProgress;
}

const TEAM_ICONS: Record<TeamId, React.ReactNode> = {
  hopihe: <Snowflake className="w-8 h-8 text-sky-300" />,
  csillagmanok: <Star className="w-8 h-8 text-amber-300" />,
  mezeskalacs: <Cookie className="w-8 h-8 text-orange-300" />,
  renszarvas: <Compass className="w-8 h-8 text-rose-300" />,
  aranycsengok: <Bell className="w-8 h-8 text-emerald-300" />,
};

export const TeamsView: React.FC<TeamsViewProps> = ({ progress }) => {
  const earnedSeals = progress.completedMissions.length;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-[#122643]/90 p-6 sm:p-8">
        <p className="text-sm font-semibold text-amber-300">
          Együttműködés · 25 tanuló · 5 nyomozócsapat
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
          A 3. b osztály csapatai
        </h1>
        <p className="mt-2 max-w-3xl text-base sm:text-lg text-slate-200 leading-relaxed">
          Ebben a nyomozásban senki nem versenyez senkivel! Mind az öt csapat ugyanazért a közös
          célért dolgozik: hogy az osztály együtt megszerezze az öt arany varázspecsétet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TEAMS.map((team) => {
          const teamSolvedCount = Object.values(progress.teamCheckpoints).filter((arr) =>
            arr?.includes(team.id)
          ).length;

          return (
            <div
              key={team.id}
              className={`rounded-3xl border p-6 ${team.bgClass} ${team.borderClass} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B192C]/80 border border-white/15 shrink-0">
                    {TEAM_ICONS[team.id]}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">
                      {team.name}
                    </h2>
                    <p className={`text-sm font-semibold ${team.textClass}`}>
                      Közös csapatpróbák: {teamSolvedCount} teljesítve
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-base leading-relaxed text-slate-100">
                  „{team.motto}”
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-slate-200">
                <Shield className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Közös osztálycél: {earnedSeals} / 5 pecsét</span>
              </div>
            </div>
          );
        })}
      </div>

      <CsillagManoGuide
        speakerLabel="Csillag emlékeztetője"
        message="Ha valamelyik csapat elakad egy nehezebb feladványnál, bátran segítsetek egymásnak az osztályban – egyetlen csapat eredménye nélkül sem lehet feltörni a közös zárat!"
      />
    </div>
  );
};
