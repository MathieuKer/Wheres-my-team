import { useState, useRef } from 'react';
import type { Team } from '../../types';
import { MapPin } from 'lucide-react';

interface TeamMarkerProps {
  team: Team;
  onDoubleClick: () => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
}

export function TeamMarker({ team, onDoubleClick, onMoveEnd }: TeamMarkerProps) {
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

  let innerClass = "transition-transform hover:scale-110 flex flex-col items-center group relative";
  let iconClass = "";
  let pinFill = team.color;
  let pinStroke = team.color;
  
  if (team.status === 'intervention') {
    innerClass += " animate-bounce";
    iconClass = "drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]";
    pinFill = '#ef4444'; 
    pinStroke = '#ffffff'; 
  } else if (team.status === 'pause') {
    iconClass = "opacity-80";
    pinStroke = '#475569'; 
  }

  // Génération de l'abréviation (ex: "Unité Alpha" -> "UA", "Médical" -> "MÉD")
  const getAbbrev = (name: string) => {
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Uniquement le clic gauche
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
    
    // Décalage pour eviter que le point "saute" vers le milieu de la souris si cliqué sur le bord.
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
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
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

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div 
      style={style} 
      onPointerDown={handlePointerDown}
      className="nodrag group/outer relative"
    >
      {team.status === 'intervention' && (
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-red-500 rounded-full animate-ping opacity-80 pointer-events-none z-[-1]" />
      )}

      <div
        className={innerClass}
      >
        {/* L'infobulle complète au hover (Reste au-dessus) */}
        <div 
          className="absolute bottom-[100%] mb-1 text-xs font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap opacity-0 group-hover/outer:opacity-100 transition-opacity drop-shadow-md border border-white/20 z-20 pointer-events-none"
          style={{ backgroundColor: team.status === 'intervention' ? '#ef4444' : team.color, color: '#fff' }}
        >
          {team.name}
        </div>
        
        <MapPin 
          className={`w-10 h-10 ${iconClass} transition-colors`} 
          style={{ fill: pinFill, color: pinStroke }} 
        />

        {/* L'abréviation permanente (S'affiche sous la pastille) */}
        <div className="absolute top-[90%] left-1/2 -translate-x-1/2 mt-0.5 text-[10px] font-black leading-none px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap bg-white text-slate-800 border border-slate-200 pointer-events-none z-10">
          {getAbbrev(team.name)}
        </div>
      </div>
    </div>
  );
}
