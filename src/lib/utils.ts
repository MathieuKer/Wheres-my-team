import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Zone } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAbbreviation(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

export function handleMarkerDrag(
  e: React.PointerEvent,
  id: string,
  onDragStart: (id: string) => void,
  onDragMove: (id: string, dx: number, dy: number) => void,
  onDragEnd: (id: string, dx: number, dy: number) => void,
  onConfigure: () => void
) {
  const container = document.getElementById('map-bounds-container');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;

  onDragStart(id);

  const onPointerMove = (moveEvent: PointerEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;

    const percentDx = (dx / rect.width) * 100;
    const percentDy = (dy / rect.height) * 100;

    onDragMove(id, percentDx, percentDy);
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    globalThis.removeEventListener('pointermove', onPointerMove);
    globalThis.removeEventListener('pointerup', onPointerUp);

    const dx = upEvent.clientX - startX;
    const dy = upEvent.clientY - startY;

    const percentDx = (dx / rect.width) * 100;
    const percentDy = (dy / rect.height) * 100;

    onDragEnd(id, percentDx, percentDy);

    const isTouch = upEvent.pointerType === 'touch';
    const movedDistance = Math.hypot(dx, dy);
    if (isTouch && movedDistance < 5) {
      onConfigure();
    }
  };

  globalThis.addEventListener('pointermove', onPointerMove);
  globalThis.addEventListener('pointerup', onPointerUp);
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
