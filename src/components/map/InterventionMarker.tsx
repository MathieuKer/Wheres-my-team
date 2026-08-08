import { useRef, useState, useEffect, memo } from 'react';
import type { Intervention, Team } from '../../types';
import { Clock } from 'lucide-react';

interface InterventionMarkerProps {
  intervention: Intervention;
  teams: Team[];
  onDoubleClick?: () => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, dx: number, dy: number) => void;
  onConfigure: () => void;
  isDraggable?: boolean;
  zoomScale?: number;
  mode?: 'reader' | 'deployment' | 'edition';
  isSelected?: boolean;
  isDropTarget?: boolean;
}

function calculateElapsed(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h${mins > 0 ? `${mins}m` : ''}`;
}

function getInterventionZIndex(priority: string, isSelected: boolean): number {
  if (priority === 'P0') return 80;
  return isSelected ? 75 : 70;
}

function getAbbrev(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

export const InterventionMarker = memo(function InterventionMarker({
  intervention,
  teams,
  onDoubleClick = () => {},
  onDragStart,
  onDragMove,
  onDragEnd,
  onConfigure,
  isDraggable = true,
  zoomScale = 1,
  mode = 'reader',
  isSelected = false,
  isDropTarget = false
}: Readonly<InterventionMarkerProps>) {
  const [elapsed, setElapsed] = useState(() => calculateElapsed(intervention.created_at));
  const lastClickTimeRef = useRef<number>(0);

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
    zIndex: getInterventionZIndex(intervention.priority, isSelected),
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

    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      onDoubleClick();
      lastClickTimeRef.current = 0;
      return;
    }
    lastClickTimeRef.current = now;

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
      const movedDistance = Math.hypot(dx, dy);
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

  return (
    <div 
      style={style} 
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      className="nodrag group relative flex flex-col items-center select-none"
    >
      {/* Halo Pulsant / Drop Target */}
      <div className="relative flex items-center justify-center">
        {isDropTarget && (
          <div className="absolute inset-0 -m-3 rounded-full border-2 border-dashed border-white animate-spin duration-3000 pointer-events-none" />
        )}
        
        {/* Glow effect on high priority */}
        {(intervention.priority === 'P0' || intervention.priority === 'P1') && (
          <div className={`absolute inset-0 -m-1 rounded-full animate-ping opacity-25 ${colors.bg}`} />
        )}

        {/* Hexagonal Marker Base */}
        <div className={`relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-2xl shadow-xl transition-all duration-200 group-hover:scale-110 ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <polygon 
              points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" 
              className={`${colors.bg} ${colors.border}`}
              strokeWidth="6"
            />
          </svg>

          {/* Icon & Priority number inside */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-black font-display pointer-events-none leading-none">
            <span className="text-[10px] md:text-xs">#{intervention.number}</span>
            <span className="text-[8px] md:text-[9px] opacity-80">{intervention.priority}</span>
          </div>
        </div>

        {/* Assigned Team Badge (if any) */}
        {assignedTeam && (
          <div 
            className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black text-white shadow-md border border-white/40 flex items-center gap-0.5"
            style={{ backgroundColor: assignedTeam.color }}
            title={`Assigné à ${assignedTeam.name}`}
          >
            {getAbbrev(assignedTeam.name)}
          </div>
        )}
      </div>

      {/* Timer & Info Tooltip on Hover */}
      <div className="absolute top-[110%] mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 bg-slate-900/95 border border-white/20 rounded-xl px-2.5 py-1 text-white shadow-2xl backdrop-blur-md whitespace-nowrap flex flex-col gap-0.5 text-center font-display">
        <span className="text-xs font-bold text-slate-100">{intervention.description || `Appel #${intervention.number}`}</span>
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <Clock className="w-2.5 h-2.5" />
          <span>{elapsed}</span>
          {assignedTeam && (
            <span className="text-blue-400 font-semibold">• {assignedTeam.name}</span>
          )}
        </div>
      </div>
    </div>
  );
});
