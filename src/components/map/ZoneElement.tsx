import { useState, useRef } from 'react';
import type { Zone } from '../../types';
import { RotateCw } from 'lucide-react';
import { ZoneContent } from './ZoneContent';
import { getZoneStyle } from '../../lib/utils';

interface ZoneElementProps {
  zone: Zone;
  onUpdate: (id: string, updates: Partial<Zone>) => void;
}

export function ZoneElement({ zone, onUpdate }: Readonly<ZoneElementProps>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  
  // États locaux pour le rendu fluide
  const [localBounds, setLocalBounds] = useState(zone.bounds);
  const [localRotation, setLocalRotation] = useState(zone.rotation || 0);
  
  // Refs pour éviter les closures périmées lors du drag
  const boundsRef = useRef(zone.bounds);
  const rotationRef = useRef(zone.rotation || 0);
  const elementRef = useRef<HTMLDivElement>(null);

  // Synchronisation des états locaux quand la prop zone change (depuis Supabase / parent)
  // en évitant d'exécuter un setState pendant le render s'il n'y a pas de changement.
  const [prevBounds, setPrevBounds] = useState(zone.bounds);
  const [prevRotation, setPrevRotation] = useState(zone.rotation || 0);

  const boundsChanged = 
    zone.bounds.x !== prevBounds.x || 
    zone.bounds.y !== prevBounds.y || 
    zone.bounds.width !== prevBounds.width || 
    zone.bounds.height !== prevBounds.height;
  
  if (boundsChanged || zone.rotation !== prevRotation) {
    setPrevBounds(zone.bounds);
    setPrevRotation(zone.rotation || 0);
    if (!isDragging && !isResizing && !isRotating) {
      setLocalBounds(zone.bounds);
      setLocalRotation(zone.rotation || 0);
    }
  }

  const startDrag = (e: React.PointerEvent, type: 'move' | 'resize' | 'rotate') => {
    e.stopPropagation();
    
    const container = document.getElementById('map-bounds-container');
    if (!container) return;

    // Initialize refs at the start of interaction to avoid accessing them during render
    boundsRef.current = zone.bounds;
    rotationRef.current = zone.rotation || 0;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialBounds = { ...zone.bounds };
    const rect = container.getBoundingClientRect();

    if (type === 'move') setIsDragging(true);
    else if (type === 'resize') setIsResizing(true);
    else setIsRotating(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      if (type === 'move') {
        const nextBounds = {
          ...initialBounds,
          x: initialBounds.x + deltaX,
          y: initialBounds.y + deltaY
        };
        setLocalBounds(nextBounds);
        boundsRef.current = nextBounds;
      } else if (type === 'resize') {
        const nextBounds = {
          ...initialBounds,
          width: Math.max(2, initialBounds.width + deltaX),
          height: Math.max(2, initialBounds.height + deltaY)
        };
        setLocalBounds(nextBounds);
        boundsRef.current = nextBounds;
      } else if (type === 'rotate') {
        const zoneRect = elementRef.current?.getBoundingClientRect();
        if (zoneRect) {
          const centerX = zoneRect.left + zoneRect.width / 2;
          const centerY = zoneRect.top + zoneRect.height / 2;
          
          const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
          let degree = (angle * 180) / Math.PI + 90;
          if (moveEvent.shiftKey) {
            degree = Math.round(degree / 15) * 15;
          }
          setLocalRotation(degree);
          rotationRef.current = degree;
        }
      }
    };

    const handlePointerUp = () => {
      globalThis.removeEventListener('pointermove', handlePointerMove);
      globalThis.removeEventListener('pointerup', handlePointerUp);
      
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);

      if (type === 'rotate') {
        onUpdate(zone.id, { rotation: rotationRef.current });
      } else {
        onUpdate(zone.id, { bounds: boundsRef.current });
      }
    };

    globalThis.addEventListener('pointermove', handlePointerMove);
    globalThis.addEventListener('pointerup', handlePointerUp);
  };

  const { bg, border, borderWidth, borderStyle, borderRadius } = getZoneStyle(zone);

  const displayBounds = (isDragging || isResizing) ? localBounds : zone.bounds;
  const displayRotation = isRotating ? localRotation : (zone.rotation || 0);

  return (
    <div 
      ref={elementRef}
      className={`absolute animate-in fade-in duration-500 cursor-move z-10 zone-element nodrag group/zone transition-none select-none`}
      style={{
        left: `${displayBounds.x}%`,
        top: `${displayBounds.y}%`,
        width: `${displayBounds.width}%`,
        height: `${displayBounds.height}%`,
        transform: `rotate(${displayRotation}deg)`,
        touchAction: 'none',
        willChange: 'left, top, width, height, transform'
      }}
      onPointerDown={(e) => startDrag(e, 'move')}
    >
      {/* Content & Background Wrapper with Custom Opacity */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          backgroundColor: bg,
          borderColor: border,
          borderWidth,
          borderStyle,
          borderRadius,
          opacity: zone.opacity ?? 1,
        }}
      >
        <ZoneContent zone={zone} />
      </div>

      {/* Rotation Handle - En haut au centre */}
      <div 
        className={`absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center cursor-alias z-20 shadow-xl text-amber-400 hover:text-amber-300 hover:bg-slate-700 active:scale-90 transition-opacity ${
          isRotating ? 'opacity-100 scale-110 border-amber-500' : 'opacity-0 group-hover/zone:opacity-100'
        }`}
        onPointerDown={(e) => startDrag(e, 'rotate')}
      >
        <RotateCw className="w-4 h-4" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white/20" />
        
        {/* Affichage de l'angle lors de la rotation */}
        {isRotating && (
          <div className="absolute bottom-full mb-2 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white font-bold whitespace-nowrap shadow-lg">
            {Math.round(((displayRotation % 360) + 360) % 360)}°
          </div>
        )}
      </div>

      {/* Resize Handle - En bas à droite */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover/zone:opacity-100 transition-opacity z-20"
        onPointerDown={(e) => startDrag(e, 'resize')}
      >
        <div className="w-3 h-3 bg-white rounded-sm shadow-md border border-slate-400" />
      </div>
    </div>
  );
}
