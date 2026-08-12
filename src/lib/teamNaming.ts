import type { Team, TeamSpecialty } from '../types';

export const PHONETIC_ALPHABET: readonly string[] = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
  'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey',
  'X-ray', 'Yankee', 'Zulu'
] as const;

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
  const match = trimmed.match(/^(.*?)\s*(\d+)$/);
  if (match) {
    const prefix = match[1].trim();
    const number = Number.parseInt(match[2], 10);
    return { prefix: prefix || 'Équipe', number, isNumbered: true };
  }
  return { prefix: trimmed, number: null, isNumbered: false };
}

/**
 * Calcule la prochaine suggestion recommandée par défaut selon les règles :
 * 1. Si la dernière équipe créée a un numéro (ex: "Volante 1", "Alpha 2"), incrémenter ce numéro ("Volante 2", "Alpha 3").
 * 2. Si la dernière équipe créée n'a pas de numéro, suggérer la prochaine lettre de l'alphabet (Alpha -> Bravo -> Charlie ... -> Zulu).
 * 3. Si tout l'alphabet est épuisé, recommencer avec un numéro (Alpha 2, Bravo 2...).
 */
export function getNextTeamSuggestion(teams: Team[]): string {
  const existingNames = new Set(teams.map(t => t.name.trim().toLowerCase()));

  if (teams.length === 0) {
    return PHONETIC_ALPHABET[0];
  }

  // Dernière équipe ajoutée
  const lastTeam = teams[teams.length - 1];
  const parsed = parseTeamName(lastTeam.name);

  // Cas 1 : L'équipe précédente possède un numéro -> continuer la suite numérique
  if (parsed.isNumbered && parsed.number !== null) {
    let nextNum = parsed.number + 1;
    while (existingNames.has(`${parsed.prefix.toLowerCase()} ${nextNum}`)) {
      nextNum++;
    }
    return `${parsed.prefix} ${nextNum}`;
  }

  // Cas 2 : L'équipe précédente est un nom simple sans numéro
  // Vérifier si elle fait partie de l'alphabet phonétique
  const phoneticIndex = PHONETIC_ALPHABET.findIndex(
    letter => letter.toLowerCase() === parsed.prefix.toLowerCase()
  );

  if (phoneticIndex >= 0) {
    // Chercher la prochaine lettre non utilisée à partir de l'index suivant
    for (let offset = 1; offset < PHONETIC_ALPHABET.length; offset++) {
      const idx = (phoneticIndex + offset) % PHONETIC_ALPHABET.length;
      const candidate = PHONETIC_ALPHABET[idx];
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  } else {
    // Si l'équipe précédente n'est pas phonétique, trouver la première lettre phonétique libre
    for (const candidate of PHONETIC_ALPHABET) {
      if (!existingNames.has(candidate.toLowerCase())) {
        return candidate;
      }
    }
  }

  // Cas 3 : Toutes les 26 lettres phonétiques de base sont déjà prises
  // Générer des variantes numérotées (ex: Alpha 2, Bravo 2...)
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

  // 4. Variantes numérotées des équipes existantes
  for (const t of teams) {
    const { prefix } = parseTeamName(t.name);
    let num = 2;
    while (existingNames.has(`${prefix.toLowerCase()} ${num}`)) {
      num++;
    }
    pushCandidate(`${prefix} ${num}`);
  }

  // 5. Variantes phonétiques numérotées restantes
  for (const letter of PHONETIC_ALPHABET) {
    let num = 2;
    while (existingNames.has(`${letter.toLowerCase()} ${num}`)) {
      num++;
    }
    pushCandidate(`${letter} ${num}`);
  }

  return pool;
}
