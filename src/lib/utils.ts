import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Zone } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ZoneStyle {
  bg: string;
  border: string;
  borderWidth: string;
  borderStyle: string;
  borderRadius: string;
}

export function getZoneStyle(zone: Zone): ZoneStyle {
  const type = zone.type || 'zone';
  const color = zone.color || '#3b82f6';
  const isText = type === 'text';
  const isInfra = type.startsWith('infra_');

  let bg = `${color}66`;
  let border = `${color}99`;
  let borderWidth = '3px';
  let borderStyle = 'dashed';
  let borderRadius = '0px';

  if (isText) {
    bg = `${color}0d`;
    border = `${color}33`;
    borderWidth = '1px';
    borderStyle = 'solid';
    borderRadius = '8px';
  } else if (isInfra) {
    bg = `${color}26`;
    border = `${color}59`;
    borderWidth = '1.5px';
    borderStyle = 'solid';
    borderRadius = '12px';
  }

  return { bg, border, borderWidth, borderStyle, borderRadius };
}
