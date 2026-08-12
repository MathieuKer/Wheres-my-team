import { describe, it, expect } from 'vitest';
import { SPECIALTIES, SPECIALTY_LIST, getSpecialtyConfig } from './specialties';

describe('specialties configuration', () => {
  it('contains all 5 operational roles', () => {
    expect(SPECIALTY_LIST).toHaveLength(5);
    expect(SPECIALTIES.terrain).toBeDefined();
    expect(SPECIALTIES.volante).toBeDefined();
    expect(SPECIALTIES.superviseur).toBeDefined();
    expect(SPECIALTIES.coordo).toBeDefined();
    expect(SPECIALTIES.kart).toBeDefined();
  });

  it('configures colors as specified by the team', () => {
    expect(SPECIALTIES.terrain.defaultColor).toBe('#3b82f6'); // Bleu
    expect(SPECIALTIES.volante.defaultColor).toBe('#ef4444'); // Rouge
    expect(SPECIALTIES.superviseur.defaultColor).toBe('#10b981'); // Vert
    expect(SPECIALTIES.coordo.defaultColor).toBe('#0f172a'); // Noir
  });

  it('differentiates shape for kart as squircle and others as circle', () => {
    expect(SPECIALTIES.kart.shape).toBe('squircle');
    expect(SPECIALTIES.terrain.shape).toBe('circle');
    expect(SPECIALTIES.volante.shape).toBe('circle');
    expect(SPECIALTIES.superviseur.shape).toBe('circle');
    expect(SPECIALTIES.coordo.shape).toBe('circle');
  });

  it('returns default terrain config when specialty is null, undefined or unknown', () => {
    expect(getSpecialtyConfig(null).id).toBe('terrain');
    expect(getSpecialtyConfig(undefined).id).toBe('terrain');
    expect(getSpecialtyConfig('unknown').id).toBe('terrain');
    expect(getSpecialtyConfig('volante').id).toBe('volante');
    expect(getSpecialtyConfig('coordo').id).toBe('coordo');
    expect(getSpecialtyConfig('superviseur').id).toBe('superviseur');
    expect(getSpecialtyConfig('kart').id).toBe('kart');
  });

  it('infers specialty from team name when specialty is missing', () => {
    expect(getSpecialtyConfig(null, 'Volante 1').id).toBe('volante');
    expect(getSpecialtyConfig(null, 'Superviseur Ouest').id).toBe('superviseur');
    expect(getSpecialtyConfig(null, 'Sup Nord').id).toBe('superviseur');
    expect(getSpecialtyConfig(null, 'Coordo Général').id).toBe('coordo');
    expect(getSpecialtyConfig(null, 'Kart 2').id).toBe('kart');
    expect(getSpecialtyConfig(null, 'Alpha').id).toBe('terrain');
  });
});
