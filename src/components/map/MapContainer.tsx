import { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { Team, Zone, TeamStatus } from '../../types';
import { TeamMarker } from './TeamMarker';
import { ZoneElement } from './ZoneElement';
import { MapIcon, MousePointer2 } from 'lucide-react';

interface MapContainerProps {
  mapUrl: string | null;
  teams: Team[];
  zones: Zone[];
  mode: 'deployment' | 'edition';
  onTeamMove: (id: string, x: number, y: number) => void;
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
  onTeamMove, 
  onTeamDoubleClick,
  onZoneCreate,
  onZoneUpdate,
  onZoneDelete: _onZoneDelete
}: Readonly<MapContainerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // État local pour le dessin en cours
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number, y: number } | null>(null);

  const getRelativeCoords = (e: React.PointerEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== 'edition') return;
    // On ne commence le dessin que si on clique sur le fond (pas sur un bouton de suppression de zone par exemple)
    if ((e.target as HTMLElement).closest('.zone-action')) return;

    const coords = getRelativeCoords(e);
    if (coords) {
      setIsDrawing(true);
      setDrawStart(coords);
      setDrawCurrent(coords);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || mode !== 'edition') return;
    const coords = getRelativeCoords(e);
    if (coords) {
      setDrawCurrent(coords);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent) {
      setIsDrawing(false);
      return;
    }

    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    // On ne crée une zone que si elle a une taille minimum (évite les clics simples)
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
  };

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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-600/90 backdrop-blur px-4 py-2 rounded-full border border-amber-400/30 text-white text-xs font-bold shadow-xl animate-in slide-in-from-top-4 duration-500 flex items-center gap-2">
          <MousePointer2 className="w-3 h-3" />
          MODE ÉDITION : CLIQUEZ ET GLISSEZ POUR DESSINER DES ZONES
        </div>
      )}

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.005 }}
        disabled={isDrawing} // On désactive le pan pendant qu'on dessine une zone
        doubleClick={{ disabled: true }} 
        panning={{ excluded: ['nodrag', 'zone-element'] }} 
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="w-full h-full flex items-center justify-center">
          <div 
            id="map-bounds-container" 
            ref={containerRef} 
            className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10"
            onPointerDown={handlePointerDown}
          >
            
            <img 
              src={mapUrl} 
              alt="Map Plan" 
              draggable={false}
              className="max-w-[85vw] max-h-[90vh] object-contain pointer-events-none select-none"
            />

            {/* Rendu des Zones existantes */}
            {zones.map(zone => (
              mode === 'edition' ? (
                <ZoneElement 
                  key={zone.id} 
                  zone={zone} 
                  onUpdate={onZoneUpdate} 
                />
              ) : (
                <div 
                  key={zone.id}
                  className="absolute border-2 border-solid opacity-60 pointer-events-none zone-element"
                  style={{
                    left: `${zone.bounds.x}%`,
                    top: `${zone.bounds.y}%`,
                    width: `${zone.bounds.width}%`,
                    height: `${zone.bounds.height}%`,
                    backgroundColor: `${zone.color}66`,
                    borderColor: zone.color,
                    transform: `rotate(${zone.rotation}deg)`,
                    zIndex: 5
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 bg-black/40 backdrop-blur px-1.5 py-0.5 text-[10px] text-white font-bold rounded-br uppercase"
                    style={{ color: zone.color }}
                  >
                    {zone.name}
                  </div>
                </div>
              )
            ))}

            {/* Rendu du rectangle en cours de dessin */}
            {isDrawing && currentDrawRect && (
              <div 
                className="absolute border-2 border-blue-400 bg-blue-500/20 z-50 pointer-events-none"
                style={currentDrawRect}
              />
            )}

            {/* Les marqueurs par-dessus */}
            {mode === 'deployment' && teams.map(team => (
              <TeamMarker 
                key={team.id} 
                team={team} 
                onDoubleClick={() => onTeamDoubleClick(team.id, team.status)} 
                onMoveEnd={(id, x, y) => onTeamMove(id, x, y)}
              />
            ))}

          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
