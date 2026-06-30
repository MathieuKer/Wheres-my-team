import { useRef, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { Team, Zone, TeamStatus } from '../../types';
import { TeamMarker } from './TeamMarker';
import { ZoneElement } from './ZoneElement';
import { ZoneContent } from './ZoneContent';
import { MapIcon, MousePointer2, ZoomIn, ZoomOut, Maximize, Lock, Unlock, Eye } from 'lucide-react';
import { getZoneStyle } from '../../lib/utils';

interface MapContainerProps {
  mapUrl: string | null;
  teams: Team[];
  zones: Zone[];
  mode: 'reader' | 'deployment' | 'edition';
  onTeamsMove: (moves: { id: string; x: number; y: number }[]) => void;
  onTeamDoubleClick: (id: string, currentStatus: TeamStatus) => void;
  onZoneCreate: (zone: Omit<Zone, 'id' | 'map_id' | 'created_at'>) => void;
  onZoneUpdate: (id: string, updates: Partial<Zone>) => void;
  onZoneDelete: (id: string) => void;
}

export function MapContainer({ 
  mapUrl, 
  teams, 
  zones, 
  mode, 
  onTeamsMove, 
  onTeamDoubleClick,
  onZoneCreate,
  onZoneUpdate
}: Readonly<MapContainerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // État de sélection par lasso
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number, y: number } | null>(null);
  const [selectCurrent, setSelectCurrent] = useState<{ x: number, y: number } | null>(null);

  // État de glissement de groupe/individuel
  const [dragOffset, setDragOffset] = useState<{ dx: number, dy: number } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Désélectionner avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTeamIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Nettoyer la sélection si on change de mode (Render-pass reset pattern)
  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setSelectedTeamIds([]);
  }

  const getRelativeCoords = (e: React.PointerEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === 'edition') {
      if ((e.target as HTMLElement).closest('.zone-action')) return;
      const coords = getRelativeCoords(e);
      if (coords) {
        setIsDrawing(true);
        setDrawStart(coords);
        setDrawCurrent(coords);
      }
      return;
    }

    if (mode === 'deployment' && isLocked) {
      // Ignorer si on clique sur un marqueur
      if ((e.target as HTMLElement).closest('.group\\/outer')) return;

      const coords = getRelativeCoords(e);
      if (coords) {
        setIsSelecting(true);
        setSelectStart(coords);
        setSelectCurrent(coords);
        setSelectedTeamIds([]); // Vider la sélection lors d'un nouveau lasso
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'edition' && isDrawing) {
      const coords = getRelativeCoords(e);
      if (coords) {
        setDrawCurrent(coords);
      }
      return;
    }

    if (mode === 'deployment' && isSelecting && selectStart) {
      const coords = getRelativeCoords(e);
      if (coords) {
        setSelectCurrent(coords);
      }
    }
  };

  const handlePointerUp = () => {
    if (isDrawing && drawStart && drawCurrent) {
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      if (width > 1 && height > 1) {
        onZoneCreate({
          name: `Zone ${zones.length + 1}`,
          color: '#3b82f6',
          rotation: 0,
          bounds: {
            x: Math.min(drawStart.x, drawCurrent.x),
            y: Math.min(drawStart.y, drawCurrent.y),
            width,
            height
          }
        });
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    if (isSelecting && selectStart && selectCurrent) {
      const width = Math.abs(selectCurrent.x - selectStart.x);
      const height = Math.abs(selectCurrent.y - selectStart.y);

      if (width < 0.5 && height < 0.5) {
        // Clic simple sur le fond : vide la sélection
        setSelectedTeamIds([]);
      } else {
        // Rectangle de sélection lasso
        const minX = Math.min(selectStart.x, selectCurrent.x);
        const maxX = Math.max(selectStart.x, selectCurrent.x);
        const minY = Math.min(selectStart.y, selectCurrent.y);
        const maxY = Math.max(selectStart.y, selectCurrent.y);

        const newlySelected = teams
          .filter(t => t.pos_x >= minX && t.pos_x <= maxX && t.pos_y >= minY && t.pos_y <= maxY)
          .map(t => t.id);

        setSelectedTeamIds(newlySelected);
      }

      setIsSelecting(false);
      setSelectStart(null);
      setSelectCurrent(null);
    }
  };

  // Gestion du drag-and-drop de groupe ou d'unité
  const handleDragStart = (id: string) => {
    setActiveDragId(id);
    setDragOffset({ dx: 0, dy: 0 });
  };

  const handleDragMove = (_id: string, dx: number, dy: number) => {
    setDragOffset({ dx, dy });
  };

  const handleDragEnd = (id: string, dx: number, dy: number) => {
    const isMovedTeamSelected = selectedTeamIds.includes(id);
    const movingTeamsIds = isMovedTeamSelected ? selectedTeamIds : [id];

    const moves = movingTeamsIds.map(tid => {
      const t = teams.find(team => team.id === tid);
      if (!t) return null;

      const newX = Math.max(0, Math.min(100, t.pos_x + dx));
      const newY = Math.max(0, Math.min(100, t.pos_y + dy));
      return { id: tid, x: newX, y: newY };
    }).filter(Boolean) as { id: string; x: number; y: number }[];

    onTeamsMove(moves);
    setActiveDragId(null);
    setDragOffset(null);
  };

  // État local pour le dessin de zone en cours
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number, y: number } | null>(null);

  if (!mapUrl) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#0b0f1a] overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
         <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border border-white/5 backdrop-blur-sm">
                <MapIcon className="w-12 h-12 text-blue-500/50" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-300 font-display mb-2">Aucun plan chargé</h2>
            <p className="text-slate-500 text-sm max-w-[250px] text-center">
                Uploadez une image de plan depuis le panneau latéral pour commencer la répartition.
            </p>
         </div>
      </div>
    );
  }

  const currentDrawRect = isDrawing && drawStart && drawCurrent ? {
    left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
    top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
    width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
    height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
  } : null;

  return (
    <div 
      className={`w-full h-full bg-[#0b0f1a] relative overflow-hidden ${mode === 'edition' ? 'cursor-crosshair' : 'cursor-move'}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      
       {mode === 'edition' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-600/90 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-amber-400/30 text-white text-[10px] md:text-xs font-bold shadow-xl animate-in slide-in-from-top-4 duration-500 flex items-center gap-1.5 whitespace-nowrap">
          <MousePointer2 className="w-3 h-3" />
          <span className="md:hidden">MODE ÉDITION</span>
          <span className="hidden md:inline">MODE ÉDITION : CLIQUEZ ET GLISSEZ POUR DESSINER DES ZONES</span>
        </div>
      )}

      {mode === 'reader' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-white text-[10px] md:text-xs font-bold shadow-xl animate-in slide-in-from-top-4 duration-500 flex items-center gap-1.5 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span className="md:hidden">MODE LECTEUR</span>
          <span className="hidden md:inline">MODE LECTEUR : CONSULTATION UNIQUEMENT (DÉPLACEMENT DES ÉQUIPES BLOQUÉ)</span>
        </div>
      )}

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.005 }}
        disabled={isDrawing || isSelecting} // Désactivé pendant dessin ou sélection lasso
        doubleClick={{ disabled: true }} 
        panning={{ disabled: isLocked, excluded: ['nodrag', 'zone-element'] }} 
        onTransform={(_ref, state) => {
          if (state.scale !== zoomScale) {
            setZoomScale(state.scale);
          }
        }}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="w-full h-full flex items-center justify-center">
          <div 
            id="map-bounds-container" 
            ref={containerRef} 
            className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10 select-none"
            onPointerDown={handlePointerDown}
          >
            
            <img 
              src={mapUrl} 
              alt="Map Plan" 
              draggable={false}
              className="max-w-[85vw] max-h-[90vh] object-contain pointer-events-none select-none"
            />

            {/* Rendu des Zones existantes */}
            {zones.map(zone => {
              const { bg, border, borderWidth, borderStyle, borderRadius } = getZoneStyle(zone);

              return mode === 'edition' ? (
                <ZoneElement 
                  key={zone.id} 
                  zone={zone} 
                  onUpdate={onZoneUpdate} 
                />
              ) : (
                <div 
                  key={zone.id}
                  className="absolute pointer-events-none zone-element"
                  style={{
                    left: `${zone.bounds.x}%`,
                    top: `${zone.bounds.y}%`,
                    width: `${zone.bounds.width}%`,
                    height: `${zone.bounds.height}%`,
                    backgroundColor: bg,
                    borderColor: border,
                    borderWidth,
                    borderStyle,
                    borderRadius,
                    opacity: zone.opacity ?? 1,
                    transform: `rotate(${zone.rotation}deg)`,
                    zIndex: 5
                  }}
                >
                  <ZoneContent zone={zone} />
                </div>
              );
            })}

            {/* Rendu du rectangle en cours de dessin de zone */}
            {isDrawing && currentDrawRect && (
              <div 
                className="absolute border-2 border-blue-400 bg-blue-500/20 z-50 pointer-events-none"
                style={currentDrawRect}
              />
            )}

            {/* Rendu de la boîte de sélection lasso */}
            {isSelecting && selectStart && selectCurrent && (
              <div 
                className="absolute border border-dashed border-blue-500 bg-blue-500/10 z-50 pointer-events-none rounded"
                style={{
                  left: `${Math.min(selectStart.x, selectCurrent.x)}%`,
                  top: `${Math.min(selectStart.y, selectCurrent.y)}%`,
                  width: `${Math.abs(selectCurrent.x - selectStart.x)}%`,
                  height: `${Math.abs(selectCurrent.y - selectStart.y)}%`,
                }}
              />
            )}

            {/* Les marqueurs par-dessus */}
            {(mode === 'deployment' || mode === 'reader') && teams.map(team => {
              let x = team.pos_x;
              let y = team.pos_y;
              
              if (dragOffset && activeDragId) {
                const isMoving = team.id === activeDragId || (selectedTeamIds.includes(activeDragId) && selectedTeamIds.includes(team.id));
                if (isMoving) {
                  x = Math.max(0, Math.min(100, x + dragOffset.dx));
                  y = Math.max(0, Math.min(100, y + dragOffset.dy));
                }
              }

              return (
                <TeamMarker 
                  key={team.id} 
                  team={{ ...team, pos_x: x, pos_y: y }} 
                  isDraggable={mode === 'deployment'}
                  zoomScale={zoomScale}
                  isSelected={selectedTeamIds.includes(team.id)}
                  onDoubleClick={() => onTeamDoubleClick(team.id, team.status)} 
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                />
              );
            })}

          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* FLOATING CONTROLS */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
        <button
          type="button"
          onClick={() => transformRef.current?.zoomIn()}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/5"
          title="Zoomer"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => transformRef.current?.zoomOut()}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/5"
          title="Dézoomer"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => transformRef.current?.resetTransform()}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/5"
          title="Réinitialiser la vue"
        >
          <Maximize className="w-5 h-5" />
        </button>
        <div className="h-px bg-white/10 my-1" />
        <button
          type="button"
          onClick={() => setIsLocked(prev => !prev)}
          className={`p-2.5 rounded-xl transition-all border ${
            isLocked
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title={isLocked ? "Déverrouiller le déplacement" : "Verrouiller le déplacement"}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
