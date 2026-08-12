import type { SVGProps } from 'react';

/**
 * Icône vectorielle dédiée représentant une véritable civière de brancardage
 * avec ses deux barres de portage, ses poignées et sa toile de secours.
 */
export function StretcherIcon({ className = 'w-4 h-4', ...props }: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      aria-label="Civière"
      {...props}
    >
      {/* 2 Barres de civière / brancard avec poignées débordantes */}
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="2" y1="16" x2="22" y2="16" />
      {/* Toile de brancard tendue */}
      <rect x="5" y="7" width="14" height="10" rx="1.5" fill="currentColor" fillOpacity="0.25" strokeWidth="1.5" />
      {/* Croix de premiers secours au centre */}
      <line x1="12" y1="9.5" x2="12" y2="14.5" strokeWidth="2" />
      <line x1="9.5" y1="12" x2="14.5" y2="12" strokeWidth="2" />
      {/* Pieds / cales de pose de la civière */}
      <line x1="6" y1="16" x2="6" y2="18.5" strokeWidth="2" />
      <line x1="18" y1="16" x2="18" y2="18.5" strokeWidth="2" />
    </svg>
  );
}
