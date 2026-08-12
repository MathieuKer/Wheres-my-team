import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Users, Shield, Radio, Car } from 'lucide-react';
import { StretcherIcon } from '../components/icons/StretcherIcon';
import type { TeamSpecialty } from '../types';

export interface SpecialtyConfig {
  id: TeamSpecialty;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  defaultColor: string;
  shape: 'circle' | 'squircle';
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const SPECIALTIES: Record<TeamSpecialty, SpecialtyConfig> = {
  terrain: {
    id: 'terrain',
    label: 'Équipe Terrain',
    shortLabel: 'Terrain',
    description: 'Binôme standard à pied sur zone',
    icon: Users,
    defaultColor: '#3b82f6', // Bleu
    shape: 'circle',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/20'
  },
  volante: {
    id: 'volante',
    label: 'Équipe Volante (Civière)',
    shortLabel: 'Volante',
    description: 'Équipe mobile avec civière / brancard',
    icon: StretcherIcon,
    defaultColor: '#ef4444', // Rouge
    shape: 'circle',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/20'
  },
  superviseur: {
    id: 'superviseur',
    label: 'Superviseur de Zone',
    shortLabel: 'Superv.',
    description: 'Responsable opérationnel de secteur',
    icon: Shield,
    defaultColor: '#10b981', // Vert
    shape: 'circle',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/20'
  },
  coordo: {
    id: 'coordo',
    label: "Coordo d'Événement",
    shortLabel: 'Coordo',
    description: "Super-superviseur général de l'événement",
    icon: Radio,
    defaultColor: '#0f172a', // Noir
    shape: 'circle',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-100',
    badgeBorder: 'border-slate-600'
  },
  kart: {
    id: 'kart',
    label: 'Kart de Golf / Véhicule',
    shortLabel: 'Kart',
    description: 'Moyen de transport motorisé',
    icon: Car,
    defaultColor: '#0284c7', // Bleu ciel / Libre
    shape: 'squircle',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-400',
    badgeBorder: 'border-sky-500/20'
  }
};

export const SPECIALTY_LIST: SpecialtyConfig[] = Object.values(SPECIALTIES);

export function inferSpecialtyFromName(name?: string | null): TeamSpecialty {
  if (!name) return 'terrain';
  const clean = name.toLowerCase().trim();
  if (clean.includes('volante') || clean.includes('civiere') || clean.includes('civière') || clean.includes('brancard')) {
    return 'volante';
  }
  if (clean.includes('supervis') || clean.includes('sup ') || clean.startsWith('sup-') || clean.startsWith('sup_') || clean === 'sup') {
    return 'superviseur';
  }
  if (clean.includes('coordo') || clean.includes('coordination')) {
    return 'coordo';
  }
  if (clean.includes('kart') || clean.includes('vehicule') || clean.includes('véhicule') || clean.includes('voiture')) {
    return 'kart';
  }
  return 'terrain';
}

export function getSpecialtyConfig(specialty?: string | null, teamName?: string | null): SpecialtyConfig {
  if (specialty && specialty in SPECIALTIES) {
    return SPECIALTIES[specialty as TeamSpecialty];
  }
  if (teamName) {
    const inferred = inferSpecialtyFromName(teamName);
    return SPECIALTIES[inferred];
  }
  return SPECIALTIES.terrain;
}

