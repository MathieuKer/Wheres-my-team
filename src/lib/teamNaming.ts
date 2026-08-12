import type { Team, TeamSpecialty } from '../types';

export const PHONETIC_ALPHABET: readonly string[] = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
] as const;

const NUMBERED_TEAM_REGEX = /^(.+?)\s*(\d+)$/;

export function getRoleDefaultSuggestion(role: TeamSpecialty, teams: Team[]): string {
  const existingNames = new Set(teams.map(t => t.name.trim().toLowerCase()));

  if (role === 'terrain') {
    return getNextTeamSuggestion(teams);
  }

  const prefixMap: Record<TeamSpecialty, string> = {
    terrain: 'Alpha',
    volante: 'Volante',
    superviseur: 'Superviseur',
    coordo: 'Coordo',
    kart: 'Kart'
  };

  const prefix = prefixMap[role] || 'Unité';

  let num = 1;
  while (existingNames.has(`${prefix.toLowerCase()} ${num}`)) {
    num++;
  }
  return `${prefix} ${num}`;
}

export interface ParsedTeamName {
  prefix: string;
  number: number | null;
  isNumbered: boolean;
}

export function parseTeamName(name: string): ParsedTeamName {
  const trimmed = name.trim();
  const match = NUMBERED_TEAM_REGEX.exec(trimmed);
  if (match) {
    const prefix = match[1].trim();
    const number = Number.parseInt(match[2], 10);
    return { prefix: prefix || 'Équipe', number, isNumbered: true };
  }
  return { prefix: trimmed, number: null, isNumbered: false };
}

function getNextNumberedSuggestion(parsed: ParsedTeamName, existingNames: Set<string>): string {
  let nextNum = (parsed.number ?? 0) + 1;
  while (existingNames.has(`${parsed.prefix.toLowerCase()} ${nextNum}`)) {
    nextNum++;
  }
  return `${parsed.prefix} ${nextNum}`;
}

function getNextPhoneticSuggestion(parsed: ParsedTeamName, existingNames: Set<string>): string | null {
  const phoneticIndex = PHONETIC_ALPHABET.findIndex(
    letter => letter.toLowerCase() === parsed.prefix.toLowerCase()
  );

  if (phoneticIndex >= 0) {
    for (let offset = 1; offset < PHONETIC_ALPHABET.length; offset++) {
      const idx = (phoneticIndex + offset) % PHONETIC_ALPHABET.length;
      const candidate = PHONETIC_ALPHABET[idx];
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  } else {
    for (const candidate of PHONETIC_ALPHABET) {
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }
  return null;
}

function getFallbackNumberedSuggestion(existingNames: Set<string>): string {
  let num = 2;
  while (num < 100) {
    for (const base of PHONETIC_ALPHABET) {
      const candidate = `${base} ${num}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
    num++;
  }
  return 'Volante 1';
}

/**
 * Calcule la prochaine suggestion recommandée par défaut selon les règles :
 * 1. Si la dernière équipe créée a un numéro (ex: "Volante 1", "Alpha 2"), incrémenter ce numéro ("Volante 2", "Alpha 3").
 * 2. Si la dernière équipe créée n'a pas de numéro, suggérer la prochaine lettre de l'alphabet (Alpha -> Bravo -> Charlie ... -> Zulu).
 * 3. Si tout l'alphabet est épuisé, recommencer avec un numéro (Alpha 2, Bravo 2...).
 */
export function getNextTeamSuggestion(teams: Team[]): string {
  if (teams.length === 0) {
    return PHONETIC_ALPHABET[0];
  }

  const existingNames = new Set(teams.map(t => t.name.trim().toLowerCase()));
  const lastTeam = teams.at(-1)!;
  const parsed = parseTeamName(lastTeam.name);

  if (parsed.isNumbered && parsed.number !== null) {
    return getNextNumberedSuggestion(parsed, existingNames);
  }

  const phoneticCandidate = getNextPhoneticSuggestion(parsed, existingNames);
  if (phoneticCandidate) {
    return phoneticCandidate;
  }

  return getFallbackNumberedSuggestion(existingNames);
}

/**
 * Génère le pool ordonné complet de suggestions pour la liste déroulante / autocomplétion.
 */
export function getTeamSuggestionsPool(teams: Team[]): string[] {
  const existingNames = new Set(teams.map(t => t.name.trim().toLowerCase()));
  const pool: string[] = [];
  const added = new Set<string>();

  const pushCandidate = (name: string) => {
    const lower = name.trim().toLowerCase();
    if (!existingNames.has(lower) && !added.has(lower)) {
      pool.push(name.trim());
      added.add(lower);
    }
  };

  // 1. La suggestion principale calculée
  const nextTop = getNextTeamSuggestion(teams);
  pushCandidate(nextTop);

  // 2. Toutes les lettres phonétiques de A à Z encore libres
  for (const letter of PHONETIC_ALPHABET) {
    pushCandidate(letter);
  }

  // 3. Équipes Volantes (1 à 5, ou plus si déjà prises)
  let vNum = 1;
  while (vNum <= 5 || existingNames.has(`volante ${vNum}`)) {
    pushCandidate(`Volante ${vNum}`);
    vNum++;
  }

  // 4. Variante numérotée de la première lettre phonétique disponible
  for (let num = 2; num <= 5; num++) {
    for (const base of PHONETIC_ALPHABET) {
      pushCandidate(`${base} ${num}`);
    }
  }

  return pool;
}
