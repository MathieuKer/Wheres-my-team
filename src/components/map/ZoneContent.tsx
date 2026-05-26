import { memo } from 'react';
import type { Zone } from '../../types';
import { 
  BriefcaseMedical, 
  Hospital, 
  LogIn, 
  Music, 
  Shield, 
  Utensils, 
  HelpCircle 
} from 'lucide-react';

interface ZoneContentProps {
  zone: Zone;
}

export const ZoneContent = memo(function ZoneContent({ zone }: Readonly<ZoneContentProps>) {
  const type = zone.type || 'zone';
  const color = zone.color || '#3b82f6';

  if (type === 'text') {
    return (
      <div 
        className="w-full h-full flex items-center justify-center p-2 text-center select-none overflow-hidden"
        style={{ color }}
      >
        <span className="font-bold text-xs sm:text-sm leading-tight break-words uppercase tracking-wide">
          {zone.name || 'Saisir le texte...'}
        </span>
      </div>
    );
  }

  if (type.startsWith('infra_')) {
    let IconComponent = HelpCircle;
    let fallbackLabel = '';

    switch (type) {
      case 'infra_first_aid':
        IconComponent = BriefcaseMedical;
        fallbackLabel = 'Soin';
        break;
      case 'infra_hospital':
        IconComponent = Hospital;
        fallbackLabel = 'Clinique';
        break;
      case 'infra_entrance':
        IconComponent = LogIn;
        fallbackLabel = 'Entrée';
        break;
      case 'infra_stage':
        IconComponent = Music;
        fallbackLabel = 'Scène';
        break;
      case 'infra_security':
        IconComponent = Shield;
        fallbackLabel = 'Sécurité';
        break;
      case 'infra_catering':
        IconComponent = Utensils;
        fallbackLabel = 'Resto';
        break;
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1 select-none text-white relative">
        {/* Glow effect matching the icon color */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-lg"
          style={{ backgroundColor: color }}
        />
        <IconComponent 
          className="w-[45%] h-[45%] min-w-[18px] min-h-[18px] transition-transform" 
          style={{ color }} 
          aria-hidden="true" 
        />
        <span className="text-[9px] font-extrabold mt-1.5 bg-slate-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/5 uppercase max-w-[90%] truncate text-slate-200">
          {zone.name || fallbackLabel}
        </span>
      </div>
    );
  }

  // Standard zone
  return (
    <div 
      className="absolute top-0 left-0 backdrop-blur px-2 py-1 text-xs text-white font-bold rounded-br uppercase pointer-events-none shadow-lg"
      style={{ backgroundColor: `${color}cc` }}
    >
      {zone.name}
    </div>
  );
});
