// Main entry point for the modern D&D Beyond to Fantasy Grounds converter
import './style.css';
import Alpine from 'alpinejs';

// Initialize feature flags system
import { featureFlags } from '@/core/FeatureFlags';

// Initialize Alpine.js stores and components
import './presentation/alpineStores';
import './presentation/components/characterConverter';
import './presentation/components/featureStatus';
import './presentation/components/featureFlagAdmin';

console.log('D&D Beyond to Fantasy Grounds Converter v2.0 - Development Build');
console.log('Modern refactor in progress...');

// Make feature flags globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).featureFlags = featureFlags;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Modern converter initialized');
  console.log('Feature flags loaded:', Object.keys(featureFlags.getAllFlags()));
  
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