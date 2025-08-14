import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlags, type FeatureFlagConfig } from '@/core/FeatureFlags';

describe('FeatureFlags', () => {
  let featureFlags: FeatureFlags;
  let mockConfig: FeatureFlagConfig;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    mockConfig = {
      environment: 'development',
      userId: 'test-user-123',
      sessionId: 'session-456',
      flags: {
        'test_flag_enabled': {
          key: 'test_flag_enabled',
          enabled: true,
          description: 'A test flag that is enabled'
        },
        'test_flag_disabled': {
          key: 'test_flag_disabled',
          enabled: false,
          description: 'A test flag that is disabled'
        },
        'test_flag_rollout': {
          key: 'test_flag_rollout',
          enabled: true,
          description: 'A test flag with rollout percentage',
          rolloutPercentage: 50
        },
        'test_flag_condition': {
          key: 'test_flag_condition',
          enabled: true,
          description: 'A test flag with conditions',
          conditions: {
            environment: 'development'
          }
        }
      }
    };

    featureFlags = new FeatureFlags(mockConfig);
  });

  describe('Basic flag evaluation', () => {
    it('should return true for enabled flags', () => {
      expect(featureFlags.isEnabled('test_flag_enabled')).toBe(true);
    });

    it('should return false for disabled flags', () => {
      expect(featureFlags.isEnabled('test_flag_disabled')).toBe(false);
    });

    it('should return false for non-existent flags', () => {
      expect(featureFlags.isEnabled('non_existent_flag')).toBe(false);
    });

    it('should log warning for non-existent flags', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      featureFlags.isEnabled('non_existent_flag');
      expect(consoleSpy).toHaveBeenCalledWith(
        "Feature flag 'non_existent_flag' not found. Defaulting to false."
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Rollout percentage', () => {
    it('should handle rollout percentage consistently', () => {
      // The result should be deterministic for the same user/session
      const result1 = featureFlags.isEnabled('test_flag_rollout');
      const result2 = featureFlags.isEnabled('test_flag_rollout');
      expect(result1).toBe(result2);
    });

    it('should return false for 0% rollout', () => {
      mockConfig.flags['zero_rollout'] = {
        key: 'zero_rollout',
        enabled: true,
        description: 'Zero rollout test',
        rolloutPercentage: 0
      };
      featureFlags = new FeatureFlags(mockConfig);
      expect(featureFlags.isEnabled('zero_rollout')).toBe(false);
    });

    it('should return true for 100% rollout', () => {
      mockConfig.flags['full_rollout'] = {
        key: 'full_rollout',
        enabled: true,
        description: 'Full rollout test',
        rolloutPercentage: 100
      };
      featureFlags = new FeatureFlags(mockConfig);
      expect(featureFlags.isEnabled('full_rollout')).toBe(true);
    });
  });

  describe('Condition evaluation', () => {
    it('should evaluate environment conditions correctly', () => {
      expect(featureFlags.isEnabled('test_flag_condition')).toBe(true);
      
      // Test with different environment
      mockConfig.environment = 'production';
      featureFlags = new FeatureFlags(mockConfig);
      expect(featureFlags.isEnabled('test_flag_condition')).toBe(false);
    });

    it('should evaluate user conditions correctly', () => {
      mockConfig.flags['user_flag'] = {
        key: 'user_flag',
        enabled: true,
        description: 'User-specific flag',
        conditions: {
          userId: ['test-user-123', 'other-user']
        }
      };
      featureFlags = new FeatureFlags(mockConfig);
      expect(featureFlags.isEnabled('user_flag')).toBe(true);

      // Test with different user
      mockConfig.userId = 'different-user';
      featureFlags = new FeatureFlags(mockConfig);
      expect(featureFlags.isEnabled('user_flag')).toBe(false);
    });
  });

  describe('Overrides', () => {
    it('should allow enabling disabled flags', () => {
      expect(featureFlags.isEnabled('test_flag_disabled')).toBe(false);
      
      featureFlags.enable('test_flag_disabled');
      expect(featureFlags.isEnabled('test_flag_disabled')).toBe(true);
    });

    it('should allow disabling enabled flags', () => {
      expect(featureFlags.isEnabled('test_flag_enabled')).toBe(true);
      
      featureFlags.disable('test_flag_enabled');
      expect(featureFlags.isEnabled('test_flag_enabled')).toBe(false);
    });

    it('should clear specific overrides', () => {
      featureFlags.enable('test_flag_disabled');
      expect(featureFlags.isEnabled('test_flag_disabled')).toBe(true);
      
      featureFlags.clearOverride('test_flag_disabled');
      expect(featureFlags.isEnabled('test_flag_disabled')).toBe(false);
    });

    it('should clear all overrides', () => {
      featureFlags.enable('test_flag_disabled');
      featureFlags.disable('test_flag_enabled');
      
      featureFlags.clearAllOverrides();
      expect(featureFlags.isEnabled('test_flag_disabled')).toBe(false);
      expect(featureFlags.isEnabled('test_flag_enabled')).toBe(true);
    });

    it('should return current overrides', () => {
      featureFlags.enable('test_flag_disabled');
      featureFlags.disable('test_flag_enabled');
      
      const overrides = featureFlags.getOverrides();
      expect(overrides).toEqual({
        'test_flag_disabled': true,
        'test_flag_enabled': false
      });
    });
  });

  describe('Flag retrieval', () => {
    it('should get specific flag details', () => {
      const flag = featureFlags.getFlag('test_flag_enabled');
      expect(flag).toEqual({
        key: 'test_flag_enabled',
        enabled: true,
        description: 'A test flag that is enabled'
      });
    });

    it('should return null for non-existent flag', () => {
      const flag = featureFlags.getFlag('non_existent');
      expect(flag).toBeNull();
    });

    it('should get all flags', () => {
      const allFlags = featureFlags.getAllFlags();
      expect(Object.keys(allFlags)).toHaveLength(4);
      expect(allFlags['test_flag_enabled']).toBeDefined();
    });
  });

  describe('localStorage integration', () => {
    it('should save overrides to localStorage', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      featureFlags.enable('test_flag');
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'featureFlags_overrides',
        JSON.stringify({ 'test_flag': true })
      );
    });

    it('should load overrides from localStorage', () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
        .mockReturnValue(JSON.stringify({ 'test_flag': true }));
      
      const newFeatureFlags = new FeatureFlags(mockConfig);
      
      expect(getItemSpy).toHaveBeenCalledWith('featureFlags_overrides');
      expect(newFeatureFlags.getOverrides()).toEqual({ 'test_flag': true });
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      featureFlags.enable('test_flag');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save feature flag overrides to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});