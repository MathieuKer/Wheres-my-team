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

export function parseZoneType(type: string | undefined) {
  if (!type) return { baseType: 'zone', format: 'transparent', bgCol: undefined };
  const [baseType, format = 'transparent', bgCol] = type.split(':');
  return { baseType, format, bgCol };
}

export function getZoneStyle(zone: Zone): ZoneStyle {
  const { baseType, format, bgCol } = parseZoneType(zone.type);
  const color = zone.color || '#3b82f6';
  const isText = baseType === 'text';
  const isInfra = baseType.startsWith('infra_');

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
    if (format === 'clean') {
      bg = 'transparent';
      border = 'transparent';
      borderWidth = '0px';
      borderStyle = 'none';
      borderRadius = '0px';
    } else if (format === 'solid') {
      bg = bgCol || '#090d16f2';
      border = color;
      borderWidth = '2px';
      borderStyle = 'solid';
      borderRadius = '16px';
    } else if (format === 'circle') {
      bg = bgCol || '#090d16f2';
      border = color;
      borderWidth = '2px';
      borderStyle = 'solid';
      borderRadius = '9999px';
    } else {
      // transparent default
      bg = bgCol ? `${bgCol}cc` : `${color}26`;
      border = `${color}59`;
      borderWidth = '1.5px';
      borderStyle = 'solid';
      borderRadius = '12px';
    }
  }

  return { bg, border, borderWidth, borderStyle, borderRadius };
}
