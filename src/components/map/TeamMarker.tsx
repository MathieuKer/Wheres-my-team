import { useState, useRef, memo } from 'react';
import type { Team } from '../../types';
import { AlertTriangle, MapPin } from 'lucide-react';

interface TeamMarkerProps {
  team: Team;
  onDoubleClick: () => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
}

export const TeamMarker = memo(function TeamMarker({ team, onDoubleClick, onMoveEnd }: Readonly<TeamMarkerProps>) {
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${localPos ? localPos.x : team.pos_x}%`,
    top: `${localPos ? localPos.y : team.pos_y}%`,
    transform: 'translate(-50%, -100%)',
    zIndex: localPos ? 999 : 10,
    cursor: localPos ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  let innerClass = "transition-all duration-300 hover:scale-110 flex flex-col items-center group relative";
  let iconClass = "transition-all duration-300";
  let pinFill = team.color;
  let pinStroke = '#ffffff'; 
  
  if (team.status === 'intervention') {
    innerClass += " animate-bounce";
    iconClass = `drop-shadow-[0_0_15px_${team.color}cc]`;
    pinFill = team.color; 
  } else if (team.status === 'pause') {
    iconClass = "opacity-60 grayscale-[0.5]";
    pinStroke = '#94a3b8'; 
  }

  const getAbbrev = (name: string) => {
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; 
    e.stopPropagation();

    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      onDoubleClick();
      lastClickTimeRef.current = 0;
      return;
    }
    lastClickTimeRef.current = now;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const container = document.getElementById('map-bounds-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentX = localPos ? localPos.x : team.pos_x;
    const currentY = localPos ? localPos.y : team.pos_y;
    
    const pinScreenX = rect.left + (currentX / 100) * rect.width;
    const pinScreenY = rect.top + (currentY / 100) * rect.height;
    
    const offsetX = e.clientX - pinScreenX;
    const offsetY = e.clientY - pinScreenY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentRect = container.getBoundingClientRect();
      const targetPinX = moveEvent.clientX - offsetX;
      const targetPinY = moveEvent.clientY - offsetY;

      let percentX = ((targetPinX - currentRect.left) / currentRect.width) * 100;
      let percentY = ((targetPinY - currentRect.top) / currentRect.height) * 100;

      percentX = Math.max(0, Math.min(100, percentX));
      percentY = Math.max(0, Math.min(100, percentY));

      setLocalPos({ x: percentX, y: percentY });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      globalThis.removeEventListener('pointermove', onPointerMove);
      globalThis.removeEventListener('pointerup', onPointerUp);
      
      const currentRect = container.getBoundingClientRect();
      const targetPinX = upEvent.clientX - offsetX;
      const targetPinY = upEvent.clientY - offsetY;

      let percentX = ((targetPinX - currentRect.left) / currentRect.width) * 100;
      let percentY = ((targetPinY - currentRect.top) / currentRect.height) * 100;

      percentX = Math.max(0, Math.min(100, percentX));
      percentY = Math.max(0, Math.min(100, percentY));

      setLocalPos(null);
      onMoveEnd(team.id, percentX, percentY);
    };

    globalThis.addEventListener('pointermove', onPointerMove);
    globalThis.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div 
      style={style} 
      onPointerDown={handlePointerDown}
      className="nodrag group/outer relative"
    >
      <div className={innerClass}>
        {/* Effet d'intervention: Ping et Badge */}
        {team.status === 'intervention' ? (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] w-12 h-12 pointer-events-none">
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-30" 
                style={{ backgroundColor: team.color }}
              />
              <div 
                className="absolute inset-0 rounded-full animate-pulse opacity-15" 
                style={{ backgroundColor: team.color }}
              />
            </div>
            
            {/* Badge de notification inversé */}
            <div 
              className="absolute top-0 right-0 translate-x-[20%] -translate-y-[20%] z-30 flex items-center justify-center w-[22px] h-[22px] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-white"
              style={{ backgroundColor: team.color }}
            >
              <AlertTriangle className="w-3 h-3 text-white fill-white animate-pulse" />
            </div>
          </>
        ) : null}

        <div 
          className={`absolute bottom-[110%] mb-1 text-[11px] px-3 py-1.5 rounded-2xl shadow-2xl opacity-0 group-hover/outer:opacity-100 transition-all duration-300 translate-y-2 group-hover/outer:translate-y-0 border border-white/20 z-20 pointer-events-none font-display backdrop-blur-md flex flex-col gap-0.5 ${
            team.description ? 'w-48 whitespace-normal text-left' : 'whitespace-nowrap'
          }`}
          style={{ 
            backgroundColor: `${team.color}f0`, 
            color: '#fff',
            boxShadow: `0 10px 15px -3px ${team.color}44`
          }}
        >
          <span className="font-bold">{team.name}</span>
          {team.description ? (
            <span className="text-[10px] text-white/90 border-t border-white/10 pt-0.5 mt-0.5 font-normal block leading-tight break-words">
              {team.description}
            </span>
          ) : null}
        </div>
        
        <MapPin 
          className={`w-11 h-11 ${iconClass} filter drop-shadow-lg relative z-10`} 
          style={{ fill: pinFill, color: pinStroke, strokeWidth: 2.5 }} 
          aria-hidden="true"
        />

        {/* L'abréviation permanente */}
        <div 
          className="absolute top-[85%] left-1/2 -translate-x-1/2 mt-0.5 text-[9px] font-black leading-none px-2 py-1 rounded-full shadow-lg whitespace-nowrap bg-white text-slate-900 border border-slate-200 pointer-events-none z-10 font-display transition-transform group-hover/outer:scale-90"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
        >
          {getAbbrev(team.name)}
        </div>
      </div>
    </div>
  );
});
