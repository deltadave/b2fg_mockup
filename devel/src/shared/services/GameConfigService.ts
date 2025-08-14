/**
 * GameConfigService
 * 
 * Loads and manages D&D 5e game configuration data from JSON files.
 * This allows game rules and data to be easily edited without code changes.
 */

// Configuration interfaces
export interface AlignmentConfig {
  mappings: Record<string, string>;
  default: string;
}

export interface AbilityConfig {
  abilities: Array<{
    id: number;
    name: string;
    displayName: string;
    abbreviation: string;
    description: string;
  }>;
  calculations: {
    modifierFormula: string;
    defaultScore: number;
    minimumScore: number;
    maximumScore: number;
  };
}

export interface CurrencyConfig {
  currencies: Array<{
    name: string;
    displayName: string;
    value: number;
    description: string;
  }>;
}

export interface GameRulesConfig {
  proficiencyBonus: {
    formula: string;
    table: Record<string, number>;
  };
  characterLevels: {
    minimum: number;
    maximum: number;
    default: number;
  };
  hitDice: {
    types: string[];
    default: string;
  };
  armorClass: {
    baseAC: number;
  };
  sizes: Record<string, string> & { default: string };
  experiencePoints: {
    levelThresholds: Record<string, number>;
  };
}

export class GameConfigService {
  private static instance: GameConfigService;
  private alignmentConfig: AlignmentConfig | null = null;
  private abilityConfig: AbilityConfig | null = null;
  private currencyConfig: CurrencyConfig | null = null;
  private gameRulesConfig: GameRulesConfig | null = null;

  private constructor() {}

  static getInstance(): GameConfigService {
    if (!GameConfigService.instance) {
      GameConfigService.instance = new GameConfigService();
    }
    return GameConfigService.instance;
  }

  /**
   * Load all configuration files
   */
  async loadConfigs(): Promise<void> {
    try {
      const [alignments, abilities, currencies, gameRules] = await Promise.all([
        this.loadConfig<{ mappings: Record<string, string>; default: string }>('/src/config/dnd5e/alignments.json'),
        this.loadConfig<AbilityConfig>('/src/config/dnd5e/abilities.json'),
        this.loadConfig<CurrencyConfig>('/src/config/dnd5e/currencies.json'),
        this.loadConfig<GameRulesConfig>('/src/config/dnd5e/game-rules.json')
      ]);

      this.alignmentConfig = alignments;
      this.abilityConfig = abilities;
      this.currencyConfig = currencies;
      this.gameRulesConfig = gameRules;

      console.log('✅ Game configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load game configuration:', error);
      throw error;
    }
  }

  /**
   * Load a single configuration file
   */
  private async loadConfig<T>(path: string): Promise<T> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load config from ${path}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get alignment name from ID
   */
  getAlignmentName(alignmentId?: number): string {
    if (!this.alignmentConfig) {
      console.warn('Alignment config not loaded, using fallback');
      return 'True Neutral';
    }

    const id = alignmentId?.toString() || '5';
    return this.alignmentConfig.mappings[id] || this.alignmentConfig.default;
  }

  /**
   * Get ability score configuration
   */
  getAbilities(): Array<{ id: number; name: string; displayName: string; abbreviation: string }> {
    if (!this.abilityConfig) {
      console.warn('Ability config not loaded, using fallback');
      return [
        { id: 1, name: 'strength', displayName: 'Strength', abbreviation: 'STR' },
        { id: 2, name: 'dexterity', displayName: 'Dexterity', abbreviation: 'DEX' },
        { id: 3, name: 'constitution', displayName: 'Constitution', abbreviation: 'CON' },
        { id: 4, name: 'intelligence', displayName: 'Intelligence', abbreviation: 'INT' },
        { id: 5, name: 'wisdom', displayName: 'Wisdom', abbreviation: 'WIS' },
        { id: 6, name: 'charisma', displayName: 'Charisma', abbreviation: 'CHA' }
      ];
    }

    return this.abilityConfig.abilities;
  }

  /**
   * Calculate ability modifier from score
   */
  calculateAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Get default ability score
   */
  getDefaultAbilityScore(): number {
    return this.abilityConfig?.calculations.defaultScore || 10;
  }

  /**
   * Get currency configuration
   */
  getCurrencies(): Array<{ name: string; displayName: string; value: number }> {
    if (!this.currencyConfig) {
      return [
        { name: 'PP', displayName: 'Platinum Pieces', value: 10 },
        { name: 'GP', displayName: 'Gold Pieces', value: 1 },
        { name: 'EP', displayName: 'Electrum Pieces', value: 0.5 },
        { name: 'SP', displayName: 'Silver Pieces', value: 0.1 },
        { name: 'CP', displayName: 'Copper Pieces', value: 0.01 }
      ];
    }

    return this.currencyConfig.currencies;
  }

  /**
   * Calculate proficiency bonus for given level
   */
  calculateProficiencyBonus(level: number): number {
    if (!this.gameRulesConfig) {
      return Math.ceil(level / 4) + 1;
    }

    // Find the appropriate tier
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
  }

  /**
   * Get base armor class
   */
  getBaseArmorClass(): number {
    return this.gameRulesConfig?.armorClass.baseAC || 10;
  }

  /**
   * Get default character size
   */
  getDefaultSize(): string {
    return this.gameRulesConfig?.sizes.default || 'Medium';
  }

  /**
   * Get available hit dice types
   */
  getHitDiceTypes(): string[] {
    return this.gameRulesConfig?.hitDice.types || ['d6', 'd8', 'd10', 'd12'];
  }

  /**
   * Get default hit die
   */
  getDefaultHitDie(): string {
    return this.gameRulesConfig?.hitDice.default || 'd8';
  }

  /**
   * Check if configs are loaded
   */
  isLoaded(): boolean {
    return !!(this.alignmentConfig && this.abilityConfig && this.currencyConfig && this.gameRulesConfig);
  }
}

// Export singleton instance
export const gameConfigService = GameConfigService.getInstance();