import { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { Team } from '../../types';
import { TeamMarker } from './TeamMarker';
import { MapIcon } from 'lucide-react';

interface MapContainerProps {
  mapUrl: string | null;
  teams: Team[];
  onTeamMove: (id: string, x: number, y: number) => void;
  onTeamDoubleClick: (id: string, currentStatus: string) => void;
}

export function MapContainer({ mapUrl, teams, onTeamMove, onTeamDoubleClick }: Readonly<MapContainerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  if (!mapUrl) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#0b0f1a] overflow-hidden">
         {/* Subtle background decoration */}
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

  return (
    <div className="w-full h-full bg-[#0b0f1a] cursor-move relative overflow-hidden">
      {/* Dynamic grid background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.005 }}
        doubleClick={{ disabled: true }} 
        panning={{ excluded: ['nodrag'] }} 
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="w-full h-full flex items-center justify-center">
          <div id="map-bounds-container" ref={containerRef} className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10">
            
            {/* L'image de la carte */}
            <img 
              src={mapUrl} 
              alt="Map Plan" 
              draggable={false}
              className="max-w-[85vw] max-h-[90vh] object-contain pointer-events-none"
            />

            {/* Les marqueurs par-dessus l'image */}
            {teams.map(team => (
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
