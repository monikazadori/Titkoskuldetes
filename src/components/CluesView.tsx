import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { FINAL_CONGRATULATIONS_LINES, FINAL_REWARD_IMAGE, MISSIONS } from '../data/missions';
import { GameProgress, TeacherSettings } from '../types/game';
import { canShowFinalSurprise } from '../utils/storage';
import { CsillagManoGuide } from './CsillagManoGuide';
import { GoldenSealBadge } from './GoldenSealBadge';

interface CluesViewProps {
  progress: GameProgress;
  settings: TeacherSettings;
}

export const CluesView: React.FC<CluesViewProps> = ({ progress, settings }) => {
  const showFinal = canShowFinalSurprise(settings, progress);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-[#122643]/90 p-6 sm:p-8">
        <p className="text-sm font-semibold text-amber-300">
          Titkos nyomfüzet · {progress.completedMissions.length} / 5 pecsét
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
          Az összegyűjtött nyomok
        </h1>
        <p className="mt-2 max-w-2xl text-base sm:text-lg text-slate-200">
          Minden megszerzett varázspecsét egy újabb mondatot tár fel a Titkok Őrzőjének
          rejtélyéből. Vajon mit jelenthetnek együtt?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MISSIONS.map((mission) => {
          const completed = progress.completedMissions.includes(mission.id);
          return (
            <div
              key={mission.id}
              className={`flex items-center gap-5 rounded-3xl border p-6 ${
                completed
                  ? 'border-amber-400/50 bg-[#162F52]'
                  : 'border-white/10 bg-[#0E1E36]/80'
              }`}
            >
              <GoldenSealBadge number={mission.dayNumber} unlocked={completed} size="md" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {mission.dayNumber}. nyom · {mission.dateLabel}
                </p>
                {completed ? (
                  <>
                    <h2 className="mt-1 font-display text-xl font-bold text-amber-100">
                      „{mission.clueText}”
                    </h2>
                    <p className="mt-1 text-sm text-emerald-300 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-4 h-4" />
                      <span>{mission.sealTitle} megszerezve</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 font-display text-xl font-bold text-slate-400">
                      Még titkos...
                    </h2>
                    <p className="mt-1 text-sm text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      <span>Teljesítsétek a(z) {mission.dayNumber}. küldetést a nyomért!</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* STRICT SECRECY: Final reveal image and message ONLY render when Mission 5 is genuinely unlocked & completed */}
      {showFinal ? (
        <section className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1B3358] to-[#11223B] p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-amber-300/40">
              <img
                src={FINAL_REWARD_IMAGE}
                alt="A Mikulás és a gyönyörű, ünnepi vonat a téli fenyőerdőben"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-amber-300">
                {FINAL_CONGRATULATIONS_LINES[0]}
              </h2>
              <p className="text-xl text-white font-bold">
                {FINAL_CONGRATULATIONS_LINES[1]}
              </p>
              <p className="text-lg text-amber-200 font-semibold">
                {FINAL_CONGRATULATIONS_LINES[2]}
              </p>
              <div className="rounded-2xl border border-amber-300/60 bg-red-700/90 p-5 text-white shadow-lg">
                <p className="font-display text-2xl sm:text-3xl font-bold tracking-wide">
                  {FINAL_CONGRATULATIONS_LINES[3]}
                </p>
              </div>
              <p className="font-display text-xl font-bold text-amber-200">
                {FINAL_CONGRATULATIONS_LINES[4]}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <CsillagManoGuide
          speakerLabel="A nagy titok őrzője"
          message="Amíg az ötödik varázspecsét a helyére nem kerül december 1-jén, a végső meglepetés szigorúan titkos marad! Gyűjtsétek tovább figyelmesen a nyomokat!"
        />
      )}
    </div>
  );
};
