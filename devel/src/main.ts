// Main entry point for the modern D&D Beyond to Fantasy Grounds converter
import './style.css';
import Alpine from 'alpinejs';

// Initialize feature flags system
import { featureFlags } from '@/core/FeatureFlags';

// Import CharacterFetcher service for testing
import { characterFetcher } from '@/domain/character/services/CharacterFetcher';
import { characterConverterFacade } from '@/application/facades/CharacterConverterFacade';
import { gameConfigService } from '@/shared/services/GameConfigService';
import { ObjectSearch } from '@/shared/utils/ObjectSearch';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { SafeAccess } from '@/shared/utils/SafeAccess';
import { AbilityScoreUtils } from '@/domain/character/constants/AbilityConstants';
import { AbilityScoreProcessor } from '@/domain/character/services/AbilityScoreProcessor';
import { SpellSlotCalculator } from '@/domain/character/services/SpellSlotCalculator';

// Initialize Alpine.js stores and components
import './presentation/alpineStores';
import './presentation/components/characterConverter';
import './presentation/components/featureStatus';
import './presentation/components/featureFlagAdmin';

console.log('D&D Beyond to Fantasy Grounds Converter v2.0 - Development Build');
console.log('Modern refactor in progress...');

// Make services globally accessible for debugging and testing
if (typeof window !== 'undefined') {
  (window as any).featureFlags = featureFlags;
  (window as any).characterFetcher = characterFetcher;
  (window as any).characterConverterFacade = characterConverterFacade;
  (window as any).gameConfigService = gameConfigService;
  (window as any).ObjectSearch = ObjectSearch;
  (window as any).StringSanitizer = StringSanitizer;
  (window as any).SafeAccess = SafeAccess;
  (window as any).AbilityScoreUtils = AbilityScoreUtils;
  (window as any).AbilityScoreProcessor = AbilityScoreProcessor;
  (window as any).SpellSlotCalculator = SpellSlotCalculator;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Modern converter initialized');
  console.log('Feature flags loaded:', Object.keys(featureFlags.getAllFlags()));
  
  // Initialize game configuration
  try {
    await gameConfigService.loadConfigs();
    console.log('Game configuration loaded successfully');
  } catch (error) {
    console.warn('Failed to load game configuration, using fallbacks:', error);
  }
  
  // Start Alpine.js
  Alpine.start();
  console.log('Alpine.js started');
  
  // Log current feature flag status in development
  if (featureFlags.isEnabled('performance_metrics')) {
    console.log('Performance metrics enabled');
    console.log('Active feature flags:', 
      Object.entries(featureFlags.getAllFlags())
        .filter(([key]) => featureFlags.isEnabled(key))
        .map(([key]) => key)
    );
  }
});