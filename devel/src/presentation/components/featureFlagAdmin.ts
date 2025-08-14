import Alpine from 'alpinejs';
import { featureFlags, type FeatureFlag } from '@/core/FeatureFlags';

interface FeatureFlagAdminData {
  flags: Record<string, FeatureFlag>;
  overrides: Record<string, boolean>;
  showAdmin: boolean;
  init(): void;
  toggleFlag(flagKey: string): void;
  clearOverride(flagKey: string): void;
  clearAllOverrides(): void;
  refreshFlags(): void;
  getFlagStatus(flagKey: string): 'enabled' | 'disabled' | 'overridden';
  getFlagDisplayClass(flagKey: string): string;
}

Alpine.data('featureFlagAdmin', (): FeatureFlagAdminData => ({
  flags: {},
  overrides: {},
  showAdmin: false,

  init() {
    this.refreshFlags();
    
    // Listen for keyboard shortcut to toggle admin panel (Ctrl+Shift+F)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.showAdmin = !this.showAdmin;
      }
    });
  },

  toggleFlag(flagKey: string) {
    const currentStatus = this.getFlagStatus(flagKey);
    
    if (currentStatus === 'overridden') {
      // If overridden, clear the override
      featureFlags.clearOverride(flagKey);
    } else if (currentStatus === 'enabled') {
      // If enabled, disable it
      featureFlags.disable(flagKey);
    } else {
      // If disabled, enable it
      featureFlags.enable(flagKey);
    }
    
    this.refreshFlags();
    
    // Trigger a custom event so other components can react
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', {
      detail: { flagKey, newStatus: this.getFlagStatus(flagKey) }
    }));
  },

  clearOverride(flagKey: string) {
    featureFlags.clearOverride(flagKey);
    this.refreshFlags();
    
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', {
      detail: { flagKey, newStatus: this.getFlagStatus(flagKey) }
    }));
  },

  clearAllOverrides() {
    featureFlags.clearAllOverrides();
    this.refreshFlags();
    
    window.dispatchEvent(new CustomEvent('featureFlagsChanged', {
      detail: { action: 'clearAll' }
    }));
  },

  refreshFlags() {
    this.flags = featureFlags.getAllFlags();
    this.overrides = featureFlags.getOverrides();
  },

  getFlagStatus(flagKey: string): 'enabled' | 'disabled' | 'overridden' {
    if (this.overrides.hasOwnProperty(flagKey)) {
      return 'overridden';
    }
    
    return featureFlags.isEnabled(flagKey) ? 'enabled' : 'disabled';
  },

  getFlagDisplayClass(flagKey: string): string {
    const status = this.getFlagStatus(flagKey);
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'enabled':
        return `${baseClasses} bg-green-800 text-green-200`;
      case 'disabled':
        return `${baseClasses} bg-red-800 text-red-200`;
      case 'overridden':
        return `${baseClasses} bg-yellow-800 text-yellow-200`;
      default:
        return `${baseClasses} bg-gray-800 text-gray-200`;
    }
  }
}));