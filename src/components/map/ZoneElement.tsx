import { useState, useRef } from 'react';
import type { Zone } from '../../types';

interface ZoneElementProps {
  zone: Zone;
  onUpdate: (id: string, updates: Partial<Zone>) => void;
}

export function ZoneElement({ zone, onUpdate }: Readonly<ZoneElementProps>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [localBounds, setLocalBounds] = useState(zone.bounds);
  const elementRef = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.PointerEvent, type: 'move' | 'resize') => {
    e.stopPropagation();
    
    const container = document.getElementById('map-bounds-container');
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialBounds = { ...zone.bounds };
    const rect = container.getBoundingClientRect();

    if (type === 'move') setIsDragging(true);
    else setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      if (type === 'move') {
        setLocalBounds({
          ...initialBounds,
          x: initialBounds.x + deltaX,
          y: initialBounds.y + deltaY
        });
      } else {
        setLocalBounds({
          ...initialBounds,
          width: Math.max(2, initialBounds.width + deltaX),
          height: Math.max(2, initialBounds.height + deltaY)
        });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      globalThis.removeEventListener('pointermove', handlePointerMove);
      globalThis.removeEventListener('pointerup', handlePointerUp);
      
      setIsDragging(false);
      setIsResizing(false);

      // Calculer les coordonnées finales
      const deltaX = ((upEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((upEvent.clientY - startY) / rect.height) * 100;

      const finalBounds = type === 'move' ? {
        ...initialBounds,
        x: initialBounds.x + deltaX,
        y: initialBounds.y + deltaY
      } : {
        ...initialBounds,
        width: Math.max(2, initialBounds.width + deltaX),
        height: Math.max(2, initialBounds.height + deltaY)
      };

      onUpdate(zone.id, { bounds: finalBounds });
    };

    globalThis.addEventListener('pointermove', handlePointerMove);
    globalThis.addEventListener('pointerup', handlePointerUp);
  };

  const displayBounds = (isDragging || isResizing) ? localBounds : zone.bounds;

  return (
    <div 
      ref={elementRef}
      className={`absolute border-2 border-dashed animate-in fade-in duration-500 cursor-move z-10 zone-element nodrag group/zone transition-none select-none`}
      style={{
        left: `${displayBounds.x}%`,
        top: `${displayBounds.y}%`,
        width: `${displayBounds.width}%`,
        height: `${displayBounds.height}%`,
        backgroundColor: `${zone.color}66`,
        borderColor: zone.color,
        touchAction: 'none',
        willChange: 'left, top, width, height'
      }}
      onPointerDown={(e) => startDrag(e, 'move')}
    >
      <div 
        className="absolute top-0 left-0 bg-black/40 backdrop-blur px-1.5 py-0.5 text-[10px] text-white font-bold rounded-br uppercase pointer-events-none"
        style={{ color: zone.color }}
      >
        {zone.name}
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover/zone:opacity-100 transition-opacity z-20"
        onPointerDown={(e) => startDrag(e, 'resize')}
      >
        <div className="w-3 h-3 bg-white rounded-sm shadow-md border border-slate-400" />
      </div>
    </div>
  );
}
