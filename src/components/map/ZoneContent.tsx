import { memo } from 'react';
import type { Zone } from '../../types';
import { parseZoneType } from '../../lib/utils';
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
  const { baseType, format } = parseZoneType(zone.type);
  const color = zone.color || '#3b82f6';

  if (baseType === 'text') {
    return (
      <div 
        className="w-full h-full flex items-center justify-center p-2 text-center select-none overflow-hidden"
        style={{ 
          color,
          fontSize: `${zone.font_size ?? 14}px`
        }}
      >
        <span className="font-bold leading-tight break-words uppercase tracking-wide">
          {zone.name || 'Saisir le texte...'}
        </span>
      </div>
    );
  }

  if (baseType.startsWith('infra_')) {
    let IconComponent = HelpCircle;
    let fallbackLabel = '';

    switch (baseType) {
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

    const isClean = format === 'clean';
    let iconSizeClass = "w-[45%] h-[45%] min-w-[18px] min-h-[18px]";
    if (isClean) {
      iconSizeClass = "w-[55%] h-[55%] min-w-[20px] min-h-[20px]";
    } else if (format === 'solid' || format === 'circle') {
      iconSizeClass = "w-[50%] h-[50%] min-w-[18px] min-h-[18px]";
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1 select-none text-white relative">
        {/* Glow effect - only on non-clean styles */}
        {!isClean && (
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-lg"
            style={{ backgroundColor: color }}
          />
        )}
        <IconComponent 
          className={`${iconSizeClass} transition-transform`} 
          style={{ color }} 
          aria-hidden="true" 
        />
        <span className="text-[9px] font-extrabold mt-1.5 bg-slate-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/5 uppercase max-w-[90%] truncate text-slate-200 shadow-md">
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
