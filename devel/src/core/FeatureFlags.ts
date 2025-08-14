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
      enabled: false,
      description: 'Enable bulk character conversion feature',
      rolloutPercentage: 0
    },
    'advanced_mapping': {
      key: 'advanced_mapping',
      enabled: false,
      description: 'Enable advanced field mapping configuration'
    },
    'character_preview': {
      key: 'character_preview',
      enabled: true,
      description: 'Show character preview before conversion',
      rolloutPercentage: 50
    },
    'export_formats': {
      key: 'export_formats',
      enabled: false,
      description: 'Enable multiple export format options (JSON, PDF, etc.)',
      rolloutPercentage: 10
    },
    'performance_metrics': {
      key: 'performance_metrics',
      enabled: true,
      description: 'Collect and display performance metrics',
      conditions: {
        environment: 'development'
      }
    }
  }
};

// Create global instance
export const featureFlags = new FeatureFlags(defaultFeatureFlags);