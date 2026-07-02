import { memo, useEffect, useState } from 'react';
import type { Intervention, Team } from '../../types';
import { Clock } from 'lucide-react';

interface InterventionMarkerProps {
  intervention: Intervention;
  teams: Team[];
  onDragStart: (id: string) => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, dx: number, dy: number) => void;
  isDraggable?: boolean;
  zoomScale?: number;
  mode?: 'reader' | 'deployment' | 'edition';
  onConfigure: () => void;
  isSelected?: boolean;
  isDropTarget?: boolean;
}

const calculateElapsed = (createdAtStr: string) => {
  const start = new Date(createdAtStr).getTime();
  const diffMs = Date.now() - start;
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `${hours}h${remainingMins.toString().padStart(2, '0')}`;
};

export const InterventionMarker = memo(function InterventionMarker({
  intervention,
  teams,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDraggable = true,
  zoomScale = 1,
  mode = 'reader',
  onConfigure,
  isSelected = false,
  isDropTarget = false
}: Readonly<InterventionMarkerProps>) {
  const [elapsed, setElapsed] = useState(() => calculateElapsed(intervention.created_at));

  // Compute active elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(intervention.created_at));
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, [intervention.created_at]);

  const assignedTeam = teams.find(t => t.id === intervention.assigned_team_id);

  // Style positioning
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${intervention.pos_x}%`,
    top: `${intervention.pos_y}%`,
    transform: `translate(-50%, -50%) scale(${1 / zoomScale})`,
    transformOrigin: 'center center',
    zIndex: intervention.priority === 'P0' ? 80 : (isSelected ? 75 : 70),
    cursor: isDraggable ? 'grab' : 'default',
    touchAction: 'none',
  };

  // Color mappings
  const priorityColors: Record<string, { bg: string; border: string; glow: string }> = {
    P0: { bg: 'fill-slate-950', border: 'stroke-red-500', glow: 'shadow-red-500/80' },
    P1: { bg: 'fill-red-600', border: 'stroke-red-500', glow: 'shadow-red-500/60' },
    P3: { bg: 'fill-amber-500', border: 'stroke-amber-400', glow: 'shadow-amber-500/50' },
    P5: { bg: 'fill-blue-500', border: 'stroke-blue-400', glow: 'shadow-blue-500/40' },
  };

  const colors = priorityColors[intervention.priority] || priorityColors.P3;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDraggable) return;
    if (e.button !== 0) return;
    e.stopPropagation();

    const container = document.getElementById('map-bounds-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    onDragStart(intervention.id);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const percentDx = (dx / rect.width) * 100;
      const percentDy = (dy / rect.height) * 100;

      onDragMove(intervention.id, percentDx, percentDy);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      globalThis.removeEventListener('pointermove', onPointerMove);
      globalThis.removeEventListener('pointerup', onPointerUp);

      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;

      const percentDx = (dx / rect.width) * 100;
      const percentDy = (dy / rect.height) * 100;

      onDragEnd(intervention.id, percentDx, percentDy);

      // Open on tactile tap (touch pointer and did not move more than 5px)
      const isTouch = upEvent.pointerType === 'touch';
      const movedDistance = Math.sqrt(dx * dx + dy * dy);
      if (isTouch && movedDistance < 5) {
        onConfigure();
      }
    };

    globalThis.addEventListener('pointermove', onPointerMove);
    globalThis.addEventListener('pointerup', onPointerUp);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (mode === 'reader') return;
    e.preventDefault();
    e.stopPropagation();
    onConfigure();
  };

  const getAbbrev = (name: string) => {
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 3).toUpperCase();
  };

  return (
    <div 
      style={style} 
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      className="nodrag relative select-none"
    >
      {/* Hexagon Shape */}
      <div className={`w-7 h-7 flex items-center justify-center relative transition-transform duration-300 hover:scale-110 active:scale-95 ${intervention.priority === 'P0' ? 'animate-pulse' : ''}`}>
        {/* Drop target pulsing halo */}
        {isDropTarget && (
          <div className="absolute -inset-2.5 rounded-full border border-blue-400 bg-blue-400/20 animate-pulse pointer-events-none z-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        )}
        {/* Selected Indicator Outline ring */}
        {isSelected && (
          <div className="absolute -inset-1.5 rounded-full border border-dashed border-blue-400 animate-[spin_10s_linear_infinite] pointer-events-none z-0" />
        )}
        <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <polygon
            points="50,5 93,30 93,80 50,95 7,80 7,30"
            className={`${colors.bg} stroke-2 ${colors.border}`}
          />
        </svg>
        <span className={`relative z-10 text-[10px] font-black font-display select-none ${intervention.priority === 'P0' ? 'text-red-500' : 'text-white'}`}>
          {intervention.number}
        </span>

        {/* Assigned Team small initials indicator */}
        {assignedTeam && (
          <div 
            className="absolute -top-1 -right-1 text-[8px] font-black w-4.5 h-4.5 rounded-full border border-white flex items-center justify-center shadow-lg text-white select-none z-20"
            style={{ backgroundColor: assignedTeam.color }}
            title={`Assigné à : ${assignedTeam.name}`}
          >
            {getAbbrev(assignedTeam.name)}
          </div>
        )}
      </div>

      {/* Timer text just below the hexagon */}
      <div className="absolute top-[102%] left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded bg-slate-950/80 border border-white/5 text-slate-300 backdrop-blur-sm shadow-md pointer-events-none whitespace-nowrap">
        <Clock className="w-2 h-2 text-slate-400" />
        {elapsed}
      </div>
    </div>
  );
});
