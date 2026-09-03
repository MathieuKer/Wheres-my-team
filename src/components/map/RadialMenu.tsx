import { useEffect, useRef, useState, memo } from 'react';
import type { Team, TeamStatus } from '../../types';
import { CheckCircle2, Navigation, AlertTriangle, Clock } from 'lucide-react';

interface RadialMenuProps {
  team: Team;
  onSelectStatus: (status: TeamStatus) => void;
  onClose: () => void;
}

interface SectorConfig {
  status: TeamStatus;
  label: string;
  key: string;
  color: string;
  activeColor: string;
  startAngle: number;
  endAngle: number;
  iconX: number;
  iconY: number;
  icon: typeof CheckCircle2;
}

const SECTORS: SectorConfig[] = [
  {
    status: 'dispo',
    label: 'Disponible',
    key: '1',
    color: '#10b981',
    activeColor: 'rgba(16, 185, 129, 0.85)',
    startAngle: -45,
    endAngle: 45,
    iconX: 110,
    iconY: 44,
    icon: CheckCircle2,
  },
  {
    status: 'en_route',
    label: 'En route',
    key: '2',
    color: '#3b82f6',
    activeColor: 'rgba(59, 130, 246, 0.85)',
    startAngle: 45,
    endAngle: 135,
    iconX: 176,
    iconY: 110,
    icon: Navigation,
  },
  {
    status: 'intervention',
    label: 'Intervention',
    key: '3',
    color: '#ef4444',
    activeColor: 'rgba(239, 68, 68, 0.85)',
    startAngle: 135,
    endAngle: 225,
    iconX: 110,
    iconY: 176,
    icon: AlertTriangle,
  },
  {
    status: 'pause',
    label: 'En pause',
    key: '4',
    color: '#f59e0b',
    activeColor: 'rgba(245, 158, 11, 0.85)',
    startAngle: 225,
    endAngle: 315,
    iconX: 44,
    iconY: 110,
    icon: Clock,
  },
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function calculateTargetStatus(dx: number, dy: number): TeamStatus | null {
  const dist = Math.hypot(dx, dy);
  if (dist < 38) return null; // Deadzone centrale ajustée

  let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  if (angle >= 315 || angle < 45) return 'dispo';
  if (angle >= 45 && angle < 135) return 'en_route';
  if (angle >= 135 && angle < 225) return 'intervention';
  return 'pause';
}

export const RadialMenu = memo(function RadialMenu({ team, onSelectStatus, onClose }: Readonly<RadialMenuProps>) {
  const [hoveredStatus, setHoveredStatus] = useState<TeamStatus | null>(null);
  const hoveredStatusRef = useRef<TeamStatus | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const target = calculateTargetStatus(dx, dy);
      hoveredStatusRef.current = target;
      setHoveredStatus(target);
    };

    const handlePointerUp = () => {
      // Clôture immédiate au relâchement du clic droit ou du doigt
      if (hoveredStatusRef.current) {
        onSelectStatus(hoveredStatusRef.current);
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const match = SECTORS.find(s => s.key === e.key);
      if (match) {
        onSelectStatus(match.status);
        onClose();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose, onSelectStatus]);

  const activeSector = SECTORS.find(s => s.status === hoveredStatus);

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label="Sélection rapide du statut"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] pointer-events-auto select-none z-[1000] animate-in fade-in zoom-in-90 duration-150 outline-none"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <svg className="w-full h-full drop-shadow-2xl overflow-visible" viewBox="0 0 220 220">
        {/* Anneau d'ombre arrière-plan */}
        <circle cx="110" cy="110" r="102" fill="#0f172a" fillOpacity="0.9" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        {/* 4 Quadrants SVG Contigus */}
        {SECTORS.map((sector) => {
          const isSelected = hoveredStatus === sector.status;
          const arcPath = describeArc(110, 110, 46, 102, sector.startAngle, sector.endAngle);

          return (
            <g
              key={sector.status}
              role="menuitem"
              aria-label={sector.label}
              className="transition-all duration-150 cursor-pointer"
            >
              <path
                d={arcPath}
                fill={isSelected ? sector.activeColor : 'rgba(30, 41, 59, 0.7)'}
                stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isSelected ? 2 : 1}
                className="transition-colors duration-150"
              />
            </g>
          );
        })}

        {/* Lignes séparatrices radiales nettes entre quadrants */}
        {[45, 135, 225, 315].map((angle) => {
          const start = polarToCartesian(110, 110, 46, angle);
          const end = polarToCartesian(110, 110, 102, angle);
          return (
            <line
              key={`div-${angle}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.5"
              className="pointer-events-none"
            />
          );
        })}

        {/* Icônes et Raccourcis positionnés au centre de chaque quadrant */}
        {SECTORS.map((sector) => {
          const Icon = sector.icon;
          const isSelected = hoveredStatus === sector.status;
          const isCurrentTeamStatus = team.status === sector.status;
          return (
            <g key={`icon-${sector.status}`} className="pointer-events-none">
              <foreignObject
                x={sector.iconX - 22}
                y={sector.iconY - 22}
                width={44}
                height={44}
                className="overflow-visible"
              >
                <div className="w-full h-full flex flex-col items-center justify-center transition-transform duration-150">
                  <Icon
                    className={`w-5 h-5 transition-all duration-150 ${
                      isSelected ? 'text-white scale-125 filter drop-shadow-md' : 'text-slate-300'
                    }`}
                    style={isSelected ? { color: '#ffffff' } : { color: sector.color }}
                  />
                  <span
                    className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded mt-0.5 flex items-center gap-0.5 ${
                      isSelected ? 'bg-black/60 text-white' : 'text-slate-400'
                    }`}
                  >
                    [{sector.key}]
                    {isCurrentTeamStatus && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" title="Statut actuel" />
                    )}
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Disque Central (Deadzone neutre & HUD contextuel) */}
        <circle
          cx="110"
          cy="110"
          r="46"
          fill="#020617"
          fillOpacity="0.95"
          stroke={activeSector ? activeSector.color : 'rgba(255,255,255,0.2)'}
          strokeWidth="2"
          className="transition-colors duration-150"
        />
      </svg>

      {/* Libellé au centre du disque */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
        {activeSector ? (
          <>
            <span
              className="text-[9px] font-black uppercase tracking-normal font-display leading-tight px-1"
              style={{ color: activeSector.color }}
            >
              {activeSector.label}
            </span>
            <span className="text-[7.5px] text-white/70 mt-0.5 font-medium">Relâcher</span>
          </>
        ) : (
          <>
            <span className="text-[10px] font-bold text-white/90 font-display leading-none truncate max-w-[76px]">
              {team.name}
            </span>
            <span className="text-[7.5px] text-slate-400 mt-1 font-medium leading-none">Annuler</span>
          </>
        )}
      </div>
    </div>
  );
});
