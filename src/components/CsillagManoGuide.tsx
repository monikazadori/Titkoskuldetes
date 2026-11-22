import React from 'react';
import { ASSETS } from '../data/missions';

interface CsillagManoGuideProps {
  speakerLabel?: string;
  message: string;
  tone?: 'info' | 'success' | 'hint';
}

export const CsillagManoGuide: React.FC<CsillagManoGuideProps> = ({
  speakerLabel = 'Csillag üzeni',
  message,
  tone = 'info',
}) => {
  const toneStyles =
    tone === 'success'
      ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-50'
      : tone === 'hint'
      ? 'bg-amber-950/90 border-amber-400/50 text-amber-50'
      : 'bg-[#132A4A]/90 border-sky-300/30 text-slate-100';

  const labelColor =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'hint'
      ? 'text-amber-300'
      : 'text-amber-200';

  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-5 rounded-2xl border p-5 shadow-lg transition-colors ${toneStyles}`}
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden border border-amber-300/40 bg-[#0B192C] animate-gentle-float">
        <img
          src={ASSETS.csillagMano}
          alt="Csillag, a Titkok Őrzőjének segítője"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className={`text-sm font-bold tracking-wide uppercase mb-1.5 ${labelColor}`}>
          {speakerLabel}
        </p>
        <p className="text-lg sm:text-xl leading-relaxed font-medium">{message}</p>
      </div>
    </div>
  );
};
