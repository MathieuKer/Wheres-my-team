import { useRef, useState, memo } from 'react';
import type { Team } from '../../types';
import { AlertTriangle, MapPin, Navigation } from 'lucide-react';
import { getAbbreviation, handleMarkerDrag } from '../../lib/utils';

interface TeamMarkerProps {
  team: Team;
  onDoubleClick: () => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, dx: number, dy: number) => void;
  isDraggable?: boolean;
  zoomScale?: number;
  isSelected?: boolean;
  mode?: 'reader' | 'deployment' | 'edition';
  onConfigure: () => void;
}

function getZIndex(isHovered: boolean, isSelected: boolean, status: string): number {
  if (isHovered) return 800;
  if (isSelected) return 500;
  return status === 'intervention' ? 50 : 10;
}

export const TeamMarker = memo(function TeamMarker({ 
  team, 
  onDoubleClick, 
  onDragStart,
  onDragMove,
  onDragEnd, 
  isDraggable = true,
  zoomScale = 1,
  isSelected = false,
  mode = 'reader',
  onConfigure
}: Readonly<TeamMarkerProps>) {
  const [isHovered, setIsHovered] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${team.pos_x}%`,
    top: `${team.pos_y}%`,
    transform: `translate(-50%, -100%) scale(${1 / zoomScale})`,
    transformOrigin: 'bottom center',
    zIndex: getZIndex(isHovered, isSelected, team.status),
    cursor: isDraggable ? 'grab' : 'default',
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
  } else if (team.status === 'en_route') {
    innerClass += " animate-pulse";
    iconClass = `drop-shadow-[0_0_12px_#3b82f6cc]`;
    pinFill = team.color;
  } else if (team.status === 'pause') {
    iconClass = "opacity-60 grayscale-[0.5]";
    pinStroke = '#94a3b8'; 
  }

  if (isSelected) {
    iconClass += " drop-shadow-[0_0_10px_#3b82f6]";
  }

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

    handleMarkerDrag(e, team.id, onDragStart, onDragMove, onDragEnd, onConfigure);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (mode === 'reader') return;
    e.preventDefault();
    e.stopPropagation();
    onConfigure();
  };

  const tooltipPlacementClass = team.pos_y < 15
    ? 'top-[115%] bottom-auto translate-y-[-8px] group-hover/outer:translate-y-0'
    : 'bottom-[110%] top-auto translate-y-2 group-hover/outer:translate-y-0';

  const tooltipWidthClass = team.description ? 'w-48 whitespace-normal text-left' : 'whitespace-nowrap';

  const badgeSelectionClass = isSelected 
    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105' 
    : 'bg-white text-slate-900 border-slate-200 shadow-sm';

  return (
    <div 
      style={style} 
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="nodrag group/outer relative"
    >
      <div className={innerClass}>
        {/* Intervention: Ping and Alert Badge */}
        {team.status === 'intervention' && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] w-8 h-8 md:w-12 md:h-12 pointer-events-none">
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-30" 
                style={{ backgroundColor: team.color }}
              />
              <div 
                className="absolute inset-0 rounded-full animate-pulse opacity-15" 
                style={{ backgroundColor: team.color }}
              />
            </div>
            
            <div 
              className="absolute top-0 right-0 translate-x-[20%] -translate-y-[20%] z-30 flex items-center justify-center w-4 h-4 md:w-[22px] md:h-[22px] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white"
              style={{ backgroundColor: team.color }}
            >
              <AlertTriangle className="w-2 h-2 md:w-3 md:h-3 text-white fill-white animate-pulse" />
            </div>
          </>
        )}

        {/* En Route: Navigation Badge */}
        {team.status === 'en_route' && (
          <div 
            className="absolute top-0 right-0 translate-x-[20%] -translate-y-[20%] z-30 flex items-center justify-center w-4 h-4 md:w-[22px] md:h-[22px] rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white bg-blue-600"
          >
            <Navigation className="w-2 h-2 md:w-3 md:h-3 text-white fill-white animate-pulse" />
          </div>
        )}

        {/* Name Tooltip (visible on hover) */}
        <div 
          className={`absolute mb-1 text-[11px] px-3 py-1.5 rounded-2xl shadow-2xl opacity-0 group-hover/outer:opacity-100 transition-all duration-300 border border-white/20 z-20 pointer-events-none font-display flex flex-col gap-0.5 ${tooltipPlacementClass} ${tooltipWidthClass}`}
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
          className={`w-8 h-8 md:w-11 md:h-11 ${iconClass} filter drop-shadow-lg relative z-10`} 
          style={{ fill: pinFill, color: pinStroke, strokeWidth: 2.5 }} 
          aria-hidden="true"
        />

        {/* Permanent Abbreviation Badge */}
        <div 
          className={`absolute top-[85%] left-1/2 -translate-x-1/2 mt-0.5 text-[7px] md:text-[9px] font-black leading-none px-1.5 py-0.5 md:px-2 md:py-1 rounded-full shadow-lg whitespace-nowrap border pointer-events-none z-10 font-display transition-all ${badgeSelectionClass}`}
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
        >
          {getAbbreviation(team.name)}
        </div>
      </div>
    </div>
  );
});
