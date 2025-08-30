/**
 * Language Constants for D&D 5e Character Conversion
 * 
 * Comprehensive mapping of D&D Beyond language identifiers to proper display
 * names and FoundryVTT system identifiers. Based on D&D 5e Player's Handbook
 * and additional official sources.
 */

export interface LanguageDefinition {
  id: string;
  displayName: string;
  foundryKey?: string;
  category: 'standard' | 'exotic' | 'secret' | 'regional';
  description?: string;
}

/**
 * Standard D&D 5e Languages
 * These are the core languages available to player characters
 */
export const STANDARD_LANGUAGES: Record<string, LanguageDefinition> = {
  'common': {
    id: 'common',
    displayName: 'Common',
    foundryKey: 'common',
    category: 'standard',
    description: 'The lingua franca of most humanoid races'
  },
  'common-sign-language': {
    id: 'common-sign-language',
    displayName: 'Common Sign Language',
    foundryKey: 'common',
    category: 'standard',
    description: 'Sign language equivalent of Common'
  },
  'dwarvish': {
    id: 'dwarvish',
    displayName: 'Dwarvish',
    foundryKey: 'dwarvish',
    category: 'standard',
    description: 'Language of dwarves and their kin'
  },
  'elvish': {
    id: 'elvish',
    displayName: 'Elvish',
    foundryKey: 'elvish',
    category: 'standard',
    description: 'Language of elves and their kin'
  },
  'giant': {
    id: 'giant',
    displayName: 'Giant',
    foundryKey: 'giant',
    category: 'standard',
    description: 'Language of giants and giant-kin'
  },
  'gnomish': {
    id: 'gnomish',
    displayName: 'Gnomish',
    foundryKey: 'gnomish',
    category: 'standard',
    description: 'Language of gnomes'
  },
  'goblin': {
    id: 'goblin',
    displayName: 'Goblin',
    foundryKey: 'goblin',
    category: 'standard',
    description: 'Language of goblinoids'
  },
  'halfling': {
    id: 'halfling',
    displayName: 'Halfling',
    foundryKey: 'halfling',
    category: 'standard',
    description: 'Language of halflings'
  },
  'orc': {
    id: 'orc',
    displayName: 'Orc',
    foundryKey: 'orc',
    category: 'standard',
    description: 'Language of orcs and their kin'
  }
};

/**
 * Exotic D&D 5e Languages
 * These languages are less commonly spoken and often require special circumstances
 */
export const EXOTIC_LANGUAGES: Record<string, LanguageDefinition> = {
  'abyssal': {
    id: 'abyssal',
    displayName: 'Abyssal',
    foundryKey: 'abyssal',
    category: 'exotic',
    description: 'Language of demons and chaotic evil outsiders'
  },
  'celestial': {
    id: 'celestial',
    displayName: 'Celestial',
    foundryKey: 'celestial',
    category: 'exotic',
    description: 'Language of angels and good-aligned outsiders'
  },
  'draconic': {
    id: 'draconic',
    displayName: 'Draconic',
    foundryKey: 'draconic',
    category: 'exotic',
    description: 'Ancient language of dragons, used in many spells'
  },
  'deep-speech': {
    id: 'deep-speech',
    displayName: 'Deep Speech',
    foundryKey: 'deep',
    category: 'exotic',
    description: 'Language of aberrations and the Far Realm'
  },
  'infernal': {
    id: 'infernal',
    displayName: 'Infernal',
    foundryKey: 'infernal',
    category: 'exotic',
    description: 'Language of devils and lawful evil outsiders'
  },
  'primordial': {
    id: 'primordial',
    displayName: 'Primordial',
    foundryKey: 'primordial',
    category: 'exotic',
    description: 'Language of elementals (includes Aquan, Auran, Ignan, Terran)'
  },
  'sylvan': {
    id: 'sylvan',
    displayName: 'Sylvan',
    foundryKey: 'sylvan',
    category: 'exotic',
    description: 'Language of fey creatures'
  },
  'undercommon': {
    id: 'undercommon',
    displayName: 'Undercommon',
    foundryKey: 'undercommon',
    category: 'exotic',
    description: 'Trade language of the Underdark'
  }
};

/**
 * Elemental Languages (Primordial Dialects)
 * These are dialects of Primordial spoken by specific elemental creatures
 */
export const ELEMENTAL_LANGUAGES: Record<string, LanguageDefinition> = {
  'aquan': {
    id: 'aquan',
    displayName: 'Aquan',
    foundryKey: 'primordial',
    category: 'exotic',
    description: 'Dialect of Primordial spoken by water elementals'
  },
  'auran': {
    id: 'auran',
    displayName: 'Auran',
    foundryKey: 'primordial',
    category: 'exotic',
    description: 'Dialect of Primordial spoken by air elementals'
  },
  'ignan': {
    id: 'ignan',
    displayName: 'Ignan',
    foundryKey: 'primordial',
    category: 'exotic',
    description: 'Dialect of Primordial spoken by fire elementals'
  },
  'terran': {
    id: 'terran',
    displayName: 'Terran',
    foundryKey: 'primordial',
    category: 'exotic',
    description: 'Dialect of Primordial spoken by earth elementals'
  }
};

/**
 * Secret and Special Languages
 * Languages with special rules or restrictions
 */
export const SECRET_LANGUAGES: Record<string, LanguageDefinition> = {
  'thieves-cant': {
    id: 'thieves-cant',
    displayName: "Thieves' Cant",
    foundryKey: 'cant',
    category: 'secret',
    description: 'Secret language of rogues and criminals'
  },
  'druidcraft': {
    id: 'druidcraft',
    displayName: 'Druidic',
    category: 'secret',
    description: 'Secret language of druids'
  }
};

/**
 * Regional and Rare Languages
 * Languages specific to certain races or regions
 */
export const REGIONAL_LANGUAGES: Record<string, LanguageDefinition> = {
  'aarakocra': {
    id: 'aarakocra',
    displayName: 'Aarakocra',
    category: 'regional',
    description: 'Language of the aarakocra bird-people'
  },
  'gith': {
    id: 'gith',
    displayName: 'Gith',
    category: 'regional',
    description: 'Ancient language of the gith people'
  },
  'githyanki': {
    id: 'githyanki',
    displayName: 'Githyanki',
    category: 'regional',
    description: 'Dialect of Gith spoken by githyanki'
  },
  'githzerai': {
    id: 'githzerai',
    displayName: 'Githzerai',
    category: 'regional',
    description: 'Dialect of Gith spoken by githzerai'
  },
  'sphinx': {
    id: 'sphinx',
    displayName: 'Sphinx',
    category: 'regional',
    description: 'Language of sphinxes'
  }
};

/**
 * Complete language mapping combining all categories
 */
export const ALL_LANGUAGES: Record<string, LanguageDefinition> = {
  ...STANDARD_LANGUAGES,
  ...EXOTIC_LANGUAGES,
  ...ELEMENTAL_LANGUAGES,
  ...SECRET_LANGUAGES,
  ...REGIONAL_LANGUAGES
};

/**
 * Choice patterns that indicate language selection rather than specific languages
 */
export const CHOICE_PATTERNS = [
  'choose-a-language',
  'choose-a-standard-language',
  'select-a-language',
  'select-a-standard-language',
  'additional-language',
  'choose-language',
  'language-choice'
];

/**
 * Get language definition by D&D Beyond subType
 */
export function getLanguageDefinition(subType: string): LanguageDefinition | null {
  const normalized = subType.toLowerCase().replace(/[^a-z-]/g, '');
  return ALL_LANGUAGES[normalized] || null;
}

/**
 * Check if a subType represents a language choice rather than a specific language
 */
export function isLanguageChoice(subType: string): boolean {
  const normalized = subType.toLowerCase();
  return CHOICE_PATTERNS.some(pattern => normalized.includes(pattern));
}

/**
 * Get Foundry VTT language key for a given D&D Beyond subType
 */
export function getFoundryLanguageKey(subType: string): string | null {
  const definition = getLanguageDefinition(subType);
  return definition?.foundryKey || null;
}

/**
 * Get display name for a language subType
 */
export function getLanguageDisplayName(subType: string): string {
  const definition = getLanguageDefinition(subType);
  if (definition) {
    return definition.displayName;
  }
  
  // Fallback: Format the subType into a readable name
  return subType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all languages in a specific category
 */
export function getLanguagesByCategory(category: LanguageDefinition['category']): LanguageDefinition[] {
  return Object.values(ALL_LANGUAGES).filter(lang => lang.category === category);
}

/**
 * Language processing statistics
 */
export const LANGUAGE_STATS = {
  totalLanguages: Object.keys(ALL_LANGUAGES).length,
  standardCount: Object.keys(STANDARD_LANGUAGES).length,
  exoticCount: Object.keys(EXOTIC_LANGUAGES).length,
  secretCount: Object.keys(SECRET_LANGUAGES).length,
  regionalCount: Object.keys(REGIONAL_LANGUAGES).length,
  choicePatterns: CHOICE_PATTERNS.length
};