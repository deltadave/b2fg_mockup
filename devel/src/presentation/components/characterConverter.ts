// Alpine.js character converter component
import Alpine from 'alpinejs';
import { featureFlags } from '@/core/FeatureFlags';

export interface CharacterConverterData {
  // Form state
  characterId: string;
  fgVersion: 'unity' | 'classic';
  
  // Conversion state
  isConverting: boolean;
  progress: number;
  currentStep: string;
  
  // Validation
  isValidId: boolean;
  
  // Feature flags
  showCharacterPreview: boolean;
  showPerformanceMetrics: boolean;
  enableBulkConversion: boolean;
  
  // Methods
  init(): void;
  validateCharacterId(): void;
  convertCharacter(): Promise<void>;
  resetForm(): void;
  downloadResult(): void;
  delay(ms: number): Promise<void>;
  updateFeatureFlags(): void;
}

// Character converter Alpine.js component
Alpine.data('characterConverter', (): CharacterConverterData => ({
  // Form state
  characterId: '',
  fgVersion: 'unity',
  
  // Conversion state  
  isConverting: false,
  progress: 0,
  currentStep: '',
  
  // Validation
  isValidId: true,
  
  // Feature flags
  showCharacterPreview: featureFlags.isEnabled('character_preview'),
  showPerformanceMetrics: featureFlags.isEnabled('performance_metrics'),
  enableBulkConversion: featureFlags.isEnabled('bulk_conversion'),
  
  // Initialize feature flag listeners
  init() {
    // Listen for feature flag changes
    window.addEventListener('featureFlagsChanged', () => {
      this.updateFeatureFlags();
    });
  },

  // Methods
  validateCharacterId() {
    const trimmedId = this.characterId.trim();
    
    if (!trimmedId) {
      this.isValidId = true; // Empty is valid (not required)
      return;
    }
    
    // Check for D&D Beyond URL pattern
    const urlPattern = /(?:dndbeyond\.com\/characters\/|\/characters\/)(\d+)/i;
    const urlMatch = trimmedId.match(urlPattern);
    
    if (urlMatch && urlMatch[1]) {
      // Extract ID from URL and update the input
      this.characterId = urlMatch[1];
      this.isValidId = true;
      return;
    }
    
    // Check for direct character ID (numeric)
    const idPattern = /^\d+$/;
    this.isValidId = idPattern.test(trimmedId);
    
    if (!this.isValidId) {
      const notifications = Alpine.store('notifications');
      notifications.addError('Please enter a valid character ID or D&D Beyond character URL');
    }
  },
  
  async convertCharacter() {
    if (!this.characterId.trim()) {
      const notifications = Alpine.store('notifications');
      notifications.addError('Please enter a character ID');
      return;
    }
    
    this.validateCharacterId();
    if (!this.isValidId) return;
    
    // Clear any existing results
    const conversionResults = Alpine.store('conversionResults');
    conversionResults.clearResult();
    
    this.isConverting = true;
    this.progress = 0;
    this.currentStep = 'Initializing...';
    
    try {
      // Step 1: Validate and sanitize ID
      this.currentStep = 'Validating character ID...';
      this.progress = 10;
      await this.delay(200);
      
      const sanitizedId = this.characterId.trim();
      console.log('Converting character:', sanitizedId);
      
      // Check if debug mode is enabled
      const debugEnabled = (window as any).featureFlags?.isEnabled('debug_character_data');
      if (debugEnabled) {
        console.log('🔍 Debug mode enabled - detailed character data will be logged');
      }
      
      // Step 2-4: Use CharacterConverterFacade for full conversion
      const facade = (window as any).characterConverterFacade;
      if (!facade) {
        throw new Error('CharacterConverterFacade not available');
      }

      // Set up progress callback
      facade.onProgress = (step: string, percentage: number) => {
        this.currentStep = step;
        this.progress = percentage;
      };

      const result = await facade.convertFromDNDBeyond(sanitizedId);
      
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed');
      }

      // Step 5: Complete
      this.currentStep = 'Complete!';
      this.progress = 100;
      
      // Store result
      const characterName = result.characterData?.name || 'Unknown Character';
      const conversionResults = Alpine.store('conversionResults');
      conversionResults.setResult(result.xml!, characterName);
      
      const notifications = Alpine.store('notifications');
      const isDebugMode = (window as any).featureFlags?.isEnabled('debug_character_data');
      const successMessage = isDebugMode 
        ? `Character "${characterName}" converted successfully! Check console for detailed data.`
        : `Character "${characterName}" converted successfully!`;
      
      notifications.addSuccess(successMessage);
      
    } catch (error) {
      console.error('Conversion error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const notifications = Alpine.store('notifications');
      notifications.addError(`Conversion failed: ${errorMessage}`);
      
      this.currentStep = 'Error occurred';
      this.progress = 0;
    } finally {
      this.isConverting = false;
    }
  },
  
  
  resetForm() {
    this.characterId = '';
    this.fgVersion = 'unity';
    this.isConverting = false;
    this.progress = 0;
    this.currentStep = '';
    this.isValidId = true;
    
    const conversionResults = Alpine.store('conversionResults');
    conversionResults.clearResult();
    
    const notifications = Alpine.store('notifications');
    notifications.clear();
    
    console.log('Character converter form reset');
  },
  
  downloadResult() {
    const conversionResults = Alpine.store('conversionResults');
    const success = conversionResults.downloadXML();
    
    const notifications = Alpine.store('notifications');
    if (success) {
      notifications.addSuccess('XML file downloaded successfully!');
    } else {
      notifications.addError('Failed to download XML file');
    }
  },
  
  // Update feature flags from current state
  updateFeatureFlags() {
    this.showCharacterPreview = featureFlags.isEnabled('character_preview');
    this.showPerformanceMetrics = featureFlags.isEnabled('performance_metrics');
    this.enableBulkConversion = featureFlags.isEnabled('bulk_conversion');
  },
  
  // Utility method for delays
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}));