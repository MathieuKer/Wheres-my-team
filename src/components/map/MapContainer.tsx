import { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { Team } from '../../types';
import { TeamMarker } from './TeamMarker';
import { MapIcon } from 'lucide-react';

interface MapContainerProps {
  mapUrl: string | null;
  teams: Team[];
  onTeamMove: (id: string, x: number, y: number) => void;
  onTeamDoubleClick: (id: string, currentStatus: string) => void;
}

export function MapContainer({ mapUrl, teams, onTeamMove, onTeamDoubleClick }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);

  if (!mapUrl) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
         <MapIcon className="w-16 h-16 mb-4 opacity-50" />
         <p>Aucun plan chargé.</p>
         <p className="text-sm">Veuillez uploader un plan depuis le panneau latéral.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900 cursor-move">
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
          <div id="map-bounds-container" ref={containerRef} className="relative shadow-2xl" style={{ border: '2px solid #334155' }}>
            
            {/* L'image de la carte */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={mapUrl} 
              alt="Map Plan" 
              draggable={false}
              className="max-w-[80vw] max-h-[90vh] object-contain pointer-events-none"
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
