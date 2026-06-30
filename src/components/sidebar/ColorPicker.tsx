import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const PRESET_COLORS = [
  '#ffffff', // White
  '#cbd5e1', // Light slate
  '#64748b', // Slate
  '#000000', // Black
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
  '#78350f', // Brown
  '#1e293b', // Dark Slate
  '#0f172a', // Very Dark Blue
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

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const width = 208; // Largeur du menu (w-52 = 13rem = 208px)
      let left = rect.left;
      
      // Si le menu dépasse du bord droit de l'écran, on l'aligne par la droite
      if (left + width > window.innerWidth - 16) {
        left = rect.right - width;
      }
      left = Math.max(8, left); // Empêche de déborder à gauche de l'écran

      setPopoverPos({
        top: rect.bottom + 8,
        left
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Calcul initial réactif lors de l'ouverture
    updatePosition();

    // Recalculer la position lors du scroll ou du resize de la fenêtre pour rester collé
    const handleResizeOrScroll = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    // Le true à la fin écoute le scroll en phase de capture (nécessaire pour le scroll interne de la sidebar)
    window.addEventListener('scroll', handleResizeOrScroll, true);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Node) {
        if (containerRef.current && !containerRef.current.contains(target)) {
          const portal = document.getElementById('color-picker-portal');
          if (portal?.contains(target)) return;
          
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
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
              className={`w-6 h-6 rounded-full border border-white/10 transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/50 ${color === c ? 'ring-2 ring-white scale-110 shadow-lg' : ''}`}
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

