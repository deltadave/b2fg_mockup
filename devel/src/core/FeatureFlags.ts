export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  environment: 'development' | 'staging' | 'production';
  userId?: string;
  sessionId?: string;
}

export class FeatureFlags {
  private config: FeatureFlagConfig;
  private overrides: Map<string, boolean> = new Map();

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.loadLocalOverrides();
  }

  isEnabled(flagKey: string): boolean {
    // Check for local override first (useful for development)
    if (this.overrides.has(flagKey)) {
      return this.overrides.get(flagKey)!;
    }

    const flag = this.config.flags[flagKey];
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found. Defaulting to false.`);
      return false;
    }

    // Simple enabled/disabled check
    if (!flag.enabled) {
      return false;
    }

    // Rollout percentage logic
    if (flag.rolloutPercentage !== undefined) {
      return this.checkRolloutPercentage(flagKey, flag.rolloutPercentage);
    }

    // Condition-based logic
    if (flag.conditions) {
      return this.evaluateConditions(flag.conditions);
    }

    return flag.enabled;
  }

  enable(flagKey: string): void {
    this.overrides.set(flagKey, true);
    this.saveLocalOverrides();
  }

  disable(flagKey: string): void {
    this.overrides.set(flagKey, false);
    this.saveLocalOverrides();
  }

  clearOverride(flagKey: string): void {
    this.overrides.delete(flagKey);
    this.saveLocalOverrides();
  }

  clearAllOverrides(): void {
    this.overrides.clear();
    this.saveLocalOverrides();
  }

  getFlag(flagKey: string): FeatureFlag | null {
    return this.config.flags[flagKey] || null;
  }

  getAllFlags(): Record<string, FeatureFlag> {
    return { ...this.config.flags };
  }

  getOverrides(): Record<string, boolean> {
    return Object.fromEntries(this.overrides);
  }

  private checkRolloutPercentage(flagKey: string, percentage: number): boolean {
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    // Create deterministic hash based on flag key and user/session identifier
    const identifier = this.config.userId || this.config.sessionId || 'anonymous';
    const hash = this.simpleHash(`${flagKey}:${identifier}`);
    const bucket = hash % 100;
    
    return bucket < percentage;
  }

  private evaluateConditions(conditions: Record<string, any>): boolean {
    // Simple condition evaluation - can be extended for complex scenarios
    if (conditions.environment) {
      return conditions.environment === this.config.environment;
    }

    if (conditions.userId && this.config.userId) {
      const allowedUsers = Array.isArray(conditions.userId) 
        ? conditions.userId 
        : [conditions.userId];
      return allowedUsers.includes(this.config.userId);
    }

    return true;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private loadLocalOverrides(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('featureFlags_overrides');
      if (stored) {
        const overrides = JSON.parse(stored);
        this.overrides = new Map(Object.entries(overrides));
      }
    } catch (error) {
      console.warn('Failed to load feature flag overrides from localStorage:', error);
    }
  }

  private saveLocalOverrides(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const overrides = Object.fromEntries(this.overrides);
      localStorage.setItem('featureFlags_overrides', JSON.stringify(overrides));
    } catch (error) {
      console.warn('Failed to save feature flag overrides to localStorage:', error);
    }
  }
}

// Default feature flags for the D&D Beyond converter project
export const defaultFeatureFlags: FeatureFlagConfig = {
  environment: 'development',
  flags: {
    'character_fetcher': {
      key: 'character_fetcher',
      enabled: true,
      description: 'Use new CharacterFetcher service for D&D Beyond API calls',
      rolloutPercentage: 100
    },
    'modern_converter': {
      key: 'modern_converter',
      enabled: true,
      description: 'Enable the new Alpine.js-based character converter',
      rolloutPercentage: 100
    },
    'legacy_fallback': {
      key: 'legacy_fallback',
      enabled: true,
      description: 'Show fallback option to legacy converter'
    },
    'bulk_conversion': {
      key: 'bulk_conversion',
      enabled: true,
      description: 'Enable bulk character conversion feature',
      rolloutPercentage: 100
    },
    'advanced_mapping': {
      key: 'advanced_mapping',
      enabled: true,
      description: 'Enable advanced field mapping configuration'
    },
    'character_preview': {
      key: 'character_preview',
      enabled: true,
      description: 'Show character preview before conversion',
      rolloutPercentage: 100
    },
    'export_formats': {
      key: 'export_formats',
      enabled: true,
      description: 'Enable multiple export format options (JSON, PDF, etc.)',
      rolloutPercentage: 100
    },
    'multi_format_export': {
      key: 'multi_format_export',
      enabled: true,
      description: 'Enable multi-format export with compatibility analysis',
      rolloutPercentage: 100
    },
    'performance_metrics': {
      key: 'performance_metrics',
      enabled: true,
      description: 'Collect and display performance metrics',
      conditions: {
        environment: 'development'
      }
    },
    'debug_character_data': {
      key: 'debug_character_data',
      enabled: true,
      description: 'Log detailed character data to console for debugging',
      rolloutPercentage: 100
    },
    'object_search_service': {
      key: 'object_search_service',
      enabled: true,
      description: 'Use new ObjectSearch service instead of legacy getObjects() function',
      rolloutPercentage: 100
    },
    'string_sanitizer_service': {
      key: 'string_sanitizer_service',
      enabled: true,
      description: 'Use new StringSanitizer service instead of legacy fixQuote() function',
      rolloutPercentage: 100
    },
    'safe_access_service': {
      key: 'safe_access_service',
      enabled: true,
      description: 'Use new SafeAccess service instead of legacy safeAccess() function',
      rolloutPercentage: 100
    },
    'ability_constants': {
      key: 'ability_constants',
      enabled: true,
      description: 'Use new AbilityConstants instead of legacy justAbilities array',
      rolloutPercentage: 100
    },
    'ability_score_processor': {
      key: 'ability_score_processor',
      enabled: true,
      description: 'Use new AbilityScoreProcessor service instead of legacy processAbilityScoreBonuses() function',
      rolloutPercentage: 100
    },
    'debug_ability_score_processor': {
      key: 'debug_ability_score_processor',
      enabled: false,
      description: 'Enable detailed debugging output for ability score modifier sources',
      conditions: {
        environment: 'development'
      }
    },
    'spell_slot_calculator': {
      key: 'spell_slot_calculator',
      enabled: true,
      description: 'Use new SpellSlotCalculator service instead of legacy getSpellSlots() function',
      rolloutPercentage: 100
    },
    'debug_spell_slot_calculator': {
      key: 'debug_spell_slot_calculator',
      enabled: false,
      description: 'Enable detailed debugging output for spell slot calculations',
      conditions: {
        environment: 'development'
      }
    },
    'inventory_processor': {
      key: 'inventory_processor',
      enabled: true,
      description: 'Use new InventoryProcessor service instead of legacy inventory functions',
      rolloutPercentage: 100
    },
    'encumbrance_calculator': {
      key: 'encumbrance_calculator',
      enabled: true,
      description: 'Use new EncumbranceCalculator service instead of legacy calculateEncumbrance() function',
      rolloutPercentage: 100
    },
    'inventory_processor_debug': {
      key: 'inventory_processor_debug',
      enabled: true,
      description: 'Enable detailed debugging output for inventory processing',
      conditions: {
        environment: 'development'
      }
    },
    'encumbrance_calculator_debug': {
      key: 'encumbrance_calculator_debug',
      enabled: false,
      description: 'Enable detailed debugging output for encumbrance calculations',
      conditions: {
        environment: 'development'
      }
    },
    'feature_processor': {
      key: 'feature_processor',
      enabled: true,
      description: 'Use new FeatureProcessor service instead of legacy feature processing',
      rolloutPercentage: 100
    },
    'feature_processor_debug': {
      key: 'feature_processor_debug',
      enabled: false,
      description: 'Enable detailed debugging output for feature processing',
      conditions: {
        environment: 'development'
      }
    },
    'weaponlist_debug': {
      key: 'weaponlist_debug',
      enabled: true,
      description: 'Enable detailed debugging output for weaponlist XML generation',
      conditions: {
        environment: 'development'
      }
    },
    'spelllist_debug': {
      key: 'spelllist_debug',
      enabled: true,
      description: 'Enable detailed debugging output for spelllist XML generation',
      conditions: {
        environment: 'development'
      }
    }
  }
};

// Create global instance
export const featureFlags = new FeatureFlags(defaultFeatureFlags);