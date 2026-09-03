import { useRef, useState, useEffect, memo } from 'react';
import type { Team, TeamStatus } from '../../types';
import { AlertTriangle, MapPin, Navigation } from 'lucide-react';
import { getAbbreviation, handleMarkerDrag } from '../../lib/utils';
import { getSpecialtyConfig } from '../../lib/specialties';
import { RadialMenu } from './RadialMenu';

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
  onUpdateStatus?: (status: TeamStatus) => void;
}

function getZIndex(isHovered: boolean, isSelected: boolean, status: string, isRadialOpen: boolean): number {
  if (isRadialOpen) return 99999;
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
  onConfigure,
  onUpdateStatus
}: Readonly<TeamMarkerProps>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  const rightClickPressTimeRef = useRef<number>(0);
  const isHoldingRightClickRef = useRef<boolean>(false);
  const didOpenRadialRef = useRef<boolean>(false);
  const radialTriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const specialtyConfig = getSpecialtyConfig(team.specialty);
  const RoleIcon = specialtyConfig.icon;

  useEffect(() => {
    return () => {
      if (radialTriggerTimerRef.current) clearTimeout(radialTriggerTimerRef.current);
      if (touchLongPressTimerRef.current) clearTimeout(touchLongPressTimerRef.current);
    };
  }, []);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${team.pos_x}%`,
    top: `${team.pos_y}%`,
    transform: `translate(-50%, -100%) scale(${1 / zoomScale})`,
    transformOrigin: 'bottom center',
    zIndex: getZIndex(isHovered, isSelected, team.status, isRadialOpen),
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

  // Coordo contrast ring
  const isCoordo = team.specialty === 'coordo';
  const isVehicle = specialtyConfig.shape === 'squircle';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) {
      if (mode === 'reader') return;
      e.stopPropagation();
      rightClickPressTimeRef.current = Date.now();
      isHoldingRightClickRef.current = true;
      didOpenRadialRef.current = false;

      radialTriggerTimerRef.current = setTimeout(() => {
        if (isHoldingRightClickRef.current) {
          didOpenRadialRef.current = true;
          setIsRadialOpen(true);
        }
      }, 300);

      const handleGlobalPointerUp = (upEvt: PointerEvent) => {
        if (upEvt.button === 2) {
          window.removeEventListener('pointerup', handleGlobalPointerUp);
          isHoldingRightClickRef.current = false;
          if (radialTriggerTimerRef.current) {
            clearTimeout(radialTriggerTimerRef.current);
            radialTriggerTimerRef.current = null;
          }
          const pressDuration = rightClickPressTimeRef.current > 0 ? Date.now() - rightClickPressTimeRef.current : 0;
          rightClickPressTimeRef.current = 0;
          // Ne déclencher la configuration classique QUE si la roue n'a JAMAIS été ouverte et que c'était un clic court (< 300ms)
          if (!didOpenRadialRef.current && pressDuration < 300) {
            onConfigure();
          }
        }
      };

      window.addEventListener('pointerup', handleGlobalPointerUp);
      return;
    }

    if (e.pointerType === 'touch' && mode !== 'reader') {
      didOpenRadialRef.current = false;
      touchLongPressTimerRef.current = setTimeout(() => {
        didOpenRadialRef.current = true;
        setIsRadialOpen(true);
      }, 350);
    }

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

  const handlePointerUp = () => {
    if (touchLongPressTimerRef.current) {
      clearTimeout(touchLongPressTimerRef.current);
      touchLongPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'reader') return;
    // Si un pointerdown a eu lieu ou si la roue est / a été ouverte, on bloque totalement le déclenchement contextmenu
    if (rightClickPressTimeRef.current > 0 || isHoldingRightClickRef.current || isRadialOpen || didOpenRadialRef.current) {
      return;
    }
    // Fallback direct pour les tests ou déclenchements clavier sans pointerdown
    onConfigure();
  };

  const tooltipPlacementClass = team.pos_y < 15
    ? 'top-[115%] bottom-auto translate-y-[-8px] group-hover/outer:translate-y-0'
    : 'bottom-[110%] top-auto translate-y-2 group-hover/outer:translate-y-0';

  const tooltipWidthClass = team.description ? 'w-52 whitespace-normal text-left' : 'whitespace-nowrap';

  const badgeSelectionClass = isSelected 
    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-105' 
    : 'bg-slate-900/90 text-white border-white/20 shadow-md backdrop-blur-sm';

  const badgeShapeClass = isVehicle ? 'rounded-lg' : 'rounded-full';

  return (
    <div 
      style={style} 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (touchLongPressTimerRef.current) clearTimeout(touchLongPressTimerRef.current);
      }}
      className="nodrag group/outer relative"
    >
      <div className={`${innerClass} ${isRadialOpen ? 'opacity-0 pointer-events-none' : ''}`}>
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

        {/* Name & Specialty Tooltip (visible on hover, masked when radial is open) */}
        {!isRadialOpen && (
          <div 
            className={`absolute mb-1 text-[11px] px-3 py-2 rounded-2xl shadow-2xl opacity-0 group-hover/outer:opacity-100 transition-all duration-300 border border-white/20 z-20 pointer-events-none font-display flex flex-col gap-1 ${tooltipPlacementClass} ${tooltipWidthClass}`}
            style={{ 
              backgroundColor: `${team.color}f0`, 
              color: '#fff',
              boxShadow: `0 10px 15px -3px ${team.color}44`
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-1">
              <span className="font-bold">{team.name}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 flex items-center gap-1">
                <RoleIcon className="w-2.5 h-2.5" />
                {specialtyConfig.shortLabel}
              </span>
            </div>
            {team.description ? (
              <span className="text-[10px] text-white/90 font-normal block leading-tight break-words">
                {team.description}
              </span>
            ) : null}
          </div>
        )}
        
        {/* Pin or Squircle Visual */}
        <div className={`relative flex items-center justify-center ${isCoordo ? 'rounded-full ring-2 ring-white/80 shadow-[0_0_12px_rgba(255,255,255,0.5)]' : ''}`}>
          <MapPin 
            className={`w-8 h-8 md:w-11 md:h-11 ${iconClass} filter drop-shadow-lg relative z-10`} 
            style={{ fill: pinFill, color: pinStroke, strokeWidth: 2.5 }} 
            aria-hidden="true"
          />
        </div>

        {/* Permanent Abbreviation & Role Badge */}
        <div 
          className={`absolute top-[85%] left-1/2 -translate-x-1/2 mt-0.5 text-[7px] md:text-[9px] font-black leading-none px-1.5 py-0.5 md:px-2 md:py-1 ${badgeShapeClass} shadow-lg whitespace-nowrap border pointer-events-none z-10 font-display transition-all flex items-center gap-1 ${badgeSelectionClass}`}
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
        >
          <RoleIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
          <span>{getAbbreviation(team.name)}</span>
        </div>
      </div>

      {/* Roue Radiale [E-06] - Placé au-dessus de tout le reste avec z-[9999] */}
      {isRadialOpen && onUpdateStatus && mode !== 'reader' && (
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-auto">
          <RadialMenu
            team={team}
            onSelectStatus={(status) => {
              onUpdateStatus(status);
              setIsRadialOpen(false);
            }}
            onClose={() => setIsRadialOpen(false)}
          />
        </div>
      )}
    </div>
  );
});
