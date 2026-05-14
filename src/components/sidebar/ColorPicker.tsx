import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#94a3b8', // Slate
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className = '' }: Readonly<ColorPickerProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return;

    // Calculer la position du bouton pour placer le portal
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }

    const handleClickOutside = (e: MouseEvent) => {
      // @ts-ignore - SonarCloud prefers no assertion here
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        // On vérifie aussi si on n'a pas cliqué dans le portal (qui est hors du container)
        const portal = document.getElementById('color-picker-portal');
        // @ts-ignore
        if (portal?.contains(e.target)) return;
        
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative flex items-center justify-center ${className}`} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-center outline-none group"
        title="Choisir une couleur"
      >
        <div 
          className="w-5 h-5 rounded-full border-2 border-white/30 shadow-sm transition-transform group-hover:scale-110" 
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}66` }}
        />
      </button>

      {/* Popover via Portal */}
      {isOpen && createPortal(
        <div 
          id="color-picker-portal"
          className="fixed p-3 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[9999] w-52 grid grid-cols-6 gap-2 origin-top-left animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
          style={{ 
            top: `${popoverPos.top}px`, 
            left: `${popoverPos.left}px` 
          }}
        >
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-6 h-6 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/50 ${color === c ? 'ring-2 ring-white scale-110 shadow-lg' : ''}`}
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}` : undefined }}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
            />
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

