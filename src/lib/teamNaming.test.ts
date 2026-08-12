import { describe, it, expect } from 'vitest';
import { getNextTeamSuggestion, getTeamSuggestionsPool, parseTeamName, PHONETIC_ALPHABET, getRoleDefaultSuggestion } from './teamNaming';
import type { Team } from '../types';

function createMockTeam(name: string, id: string = name): Team {
  return {
    id,
    map_id: 'map-1',
    name,
    color: '#3b82f6',
    status: 'dispo',
    pos_x: 50,
    pos_y: 50,
    updated_at: new Date().toISOString(),
    description: null
  };
}

describe('teamNaming utility', () => {
  describe('PHONETIC_ALPHABET', () => {
    it('contains all 26 letters of the NATO phonetic alphabet', () => {
      expect(PHONETIC_ALPHABET).toHaveLength(26);
      expect(PHONETIC_ALPHABET[0]).toBe('Alpha');
      expect(PHONETIC_ALPHABET[1]).toBe('Bravo');
      expect(PHONETIC_ALPHABET[2]).toBe('Charlie');
      expect(PHONETIC_ALPHABET[25]).toBe('Zulu');
    });
  });

  describe('parseTeamName', () => {
    it('parses unnumbered names correctly', () => {
      expect(parseTeamName('Alpha')).toEqual({ prefix: 'Alpha', number: null, isNumbered: false });
      expect(parseTeamName('Poste Médical')).toEqual({ prefix: 'Poste Médical', number: null, isNumbered: false });
    });

    it('parses numbered names correctly', () => {
      expect(parseTeamName('Volante 1')).toEqual({ prefix: 'Volante', number: 1, isNumbered: true });
      expect(parseTeamName('Alpha 2')).toEqual({ prefix: 'Alpha', number: 2, isNumbered: true });
      expect(parseTeamName('Bravo 12')).toEqual({ prefix: 'Bravo', number: 12, isNumbered: true });
    });
  });

  describe('getNextTeamSuggestion', () => {
    it('returns Alpha when there are no existing teams', () => {
      expect(getNextTeamSuggestion([])).toBe('Alpha');
    });

    it('suggests Bravo when Alpha is created', () => {
      const teams = [createMockTeam('Alpha')];
      expect(getNextTeamSuggestion(teams)).toBe('Bravo');
    });

    it('suggests Charlie when Bravo was the last created team', () => {
      const teams = [createMockTeam('Alpha'), createMockTeam('Bravo')];
      expect(getNextTeamSuggestion(teams)).toBe('Charlie');
    });

    it('suggests Delta when Charlie was the last created team', () => {
      const teams = [createMockTeam('Alpha'), createMockTeam('Bravo'), createMockTeam('Charlie')];
      expect(getNextTeamSuggestion(teams)).toBe('Delta');
    });

    it('progresses through the entire alphabet up to Zulu', () => {
      const allPhoneticTeams = PHONETIC_ALPHABET.slice(0, 25).map(l => createMockTeam(l));
      // 25 teams: Alpha through Yankee -> Next must be Zulu
      expect(getNextTeamSuggestion(allPhoneticTeams)).toBe('Zulu');
    });

    it('cycles to numbered variants (Alpha 2) once all 26 phonetic letters are taken', () => {
      const all26Teams = PHONETIC_ALPHABET.map(l => createMockTeam(l));
      expect(getNextTeamSuggestion(all26Teams)).toBe('Alpha 2');
    });

    it('increments numbered teams properly (Volante 1 -> Volante 2)', () => {
      const teams = [createMockTeam('Volante 1')];
      expect(getNextTeamSuggestion(teams)).toBe('Volante 2');
    });

    it('increments numbered phonetic teams (Bravo 1 -> Bravo 2)', () => {
      const teams = [createMockTeam('Alpha'), createMockTeam('Bravo 1')];
      expect(getNextTeamSuggestion(teams)).toBe('Bravo 2');
    });

    it('finds next available number skipping already taken numbers', () => {
      const teams = [createMockTeam('Volante 1'), createMockTeam('Volante 2')];
      expect(getNextTeamSuggestion(teams)).toBe('Volante 3');
    });

    it('returns first available phonetic letter when last team is a custom name', () => {
      const teams = [createMockTeam('Secours Principal')];
      expect(getNextTeamSuggestion(teams)).toBe('Alpha');
    });
  });

  describe('getTeamSuggestionsPool', () => {
    it('returns ordered suggestions starting with the next best suggestion', () => {
      const teams = [createMockTeam('Alpha')];
      const pool = getTeamSuggestionsPool(teams);

      // Top suggestion is Bravo
      expect(pool[0]).toBe('Bravo');
      // Alpha is not present as it is already taken
      expect(pool).not.toContain('Alpha');
      // Contains next phonetic letters
      expect(pool).toContain('Charlie');
      expect(pool).toContain('Delta');
      expect(pool).toContain('Zulu');
      // Contains Volante options
      expect(pool).toContain('Volante 1');
      expect(pool).toContain('Volante 2');
      // Contains Alpha 2 variant
      expect(pool).toContain('Alpha 2');
    });
  });

  describe('getRoleDefaultSuggestion', () => {
    it('suggests phonetic progression for terrain role', () => {
      const teams = [createMockTeam('Alpha')];
      expect(getRoleDefaultSuggestion('terrain', teams)).toBe('Bravo');
    });

    it('suggests Volante with incremented number', () => {
      const teams = [createMockTeam('Volante 1')];
      expect(getRoleDefaultSuggestion('volante', teams)).toBe('Volante 2');
    });

    it('suggests Superviseur, Coordo and Kart starting from 1', () => {
      const teams: Team[] = [];
      expect(getRoleDefaultSuggestion('superviseur', teams)).toBe('Superviseur 1');
      expect(getRoleDefaultSuggestion('coordo', teams)).toBe('Coordo 1');
      expect(getRoleDefaultSuggestion('kart', teams)).toBe('Kart 1');
    });
  });
});
