import { useState, useRef } from 'react';
import type { Zone } from '../../types';

interface ZoneElementProps {
  zone: Zone;
  onUpdate: (id: string, updates: Partial<Zone>) => void;
}

export function ZoneElement({ zone, onUpdate }: Readonly<ZoneElementProps>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [localBounds, setLocalBounds] = useState(zone.bounds);
  const elementRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setLocalBounds(zone.bounds);
    
    if (elementRef.current) {
        elementRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setLocalBounds(zone.bounds);
    
    if (elementRef.current) {
        elementRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && !isResizing) return;
    
    const container = document.getElementById('map-bounds-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const deltaX = ((e.clientX - startPos.x) / rect.width) * 100;
    const deltaY = ((e.clientY - startPos.y) / rect.height) * 100;

    if (isDragging) {
      setLocalBounds({
        ...zone.bounds,
        x: zone.bounds.x + deltaX,
        y: zone.bounds.y + deltaY
      });
    } else if (isResizing) {
      setLocalBounds({
        ...zone.bounds,
        width: Math.max(5, zone.bounds.width + deltaX),
        height: Math.max(5, zone.bounds.height + deltaY)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging && !isResizing) return;
    
    const wasDragging = isDragging;
    const wasResizing = isResizing;
    
    setIsDragging(false);
    setIsResizing(false);
    
    if (elementRef.current) {
        elementRef.current.releasePointerCapture(e.pointerId);
    }

    if (wasDragging || wasResizing) {
        onUpdate(zone.id, { bounds: localBounds });
    }
  };

  return (
    <div 
      ref={elementRef}
      className={`absolute border-2 border-dashed animate-in fade-in duration-500 cursor-move z-10 zone-element nodrag group/zone`}
      style={{
        left: `${localBounds.x}%`,
        top: `${localBounds.y}%`,
        width: `${localBounds.width}%`,
        height: `${localBounds.height}%`,
        backgroundColor: `${zone.color}33`,
        borderColor: zone.color,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div 
        className="absolute top-0 left-0 bg-black/40 backdrop-blur px-1.5 py-0.5 text-[10px] text-white font-bold rounded-br uppercase pointer-events-none"
        style={{ color: zone.color }}
      >
        {zone.name}
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover/zone:opacity-100 transition-opacity"
        onPointerDown={handleResizeDown}
      >
        <div className="w-2 h-2 bg-white rounded-sm shadow-sm" />
      </div>
    </div>
  );
}
