// Alpine.js character converter component
import Alpine from 'alpinejs';
import { featureFlags } from '@/core/FeatureFlags';
import { errorService, createApiError, createValidationError, createProcessingError } from '@/shared/errors/ErrorService';

export interface CharacterConverterData {
  // Form state
  characterId: string;
  fgVersion: 'unity' | 'classic';
  
  // Conversion state
  isConverting: boolean;
  progress: number;
  currentStep: string;
  substep: string;
  currentStepNumber: number;
  totalSteps: number;
  estimatedTimeRemaining: number;
  
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
  showFormatSelector(): void;
  validateWarlockPactMagic(result: any, notifications: any): void;
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
  substep: '',
  currentStepNumber: 0,
  totalSteps: 0,
  estimatedTimeRemaining: 0,
  
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

    // Listen for enhanced progress events from CharacterConverterFacade
    window.addEventListener('conversionProgress', (event: any) => {
      if (event.detail) {
        const progressDetail = event.detail;
        this.currentStep = progressDetail.step;
        this.progress = progressDetail.percentage;
        this.substep = progressDetail.substep || '';
        this.currentStepNumber = progressDetail.currentStep || 0;
        this.totalSteps = progressDetail.totalSteps || 0;
        this.estimatedTimeRemaining = progressDetail.estimatedTimeRemaining || 0;
        
        console.log('📊 Enhanced progress update:', progressDetail);
      }
    });

    // Listen for character data loaded from file upload
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail && event.detail.characterData && event.detail.xml) {
        console.log('📁 Character loaded from file, updating converter state');
        
        // Update character converter state to reflect successful conversion
        this.characterId = `file_${event.detail.characterData.id || Date.now()}`;
        this.isValidId = true;
        this.isConverting = false;
        this.progress = 100;
        this.currentStep = 'File conversion complete!';
        
        // Ensure conversion results store is properly updated
        const conversionResults = Alpine.store('conversionResults');
        const characterId = event.detail.characterData.id || 'unknown';
        conversionResults.setResult(event.detail.xml, event.detail.characterName || event.detail.characterData.name, characterId);

        console.log('📁 Basic converter state updated after file upload:', {
          characterId: this.characterId,
          hasResult: conversionResults.hasResult
        });
      }
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
      // Use centralized error handling for validation errors
      const validationError = createValidationError('Please enter a valid character ID or D&D Beyond character URL');
      errorService.handleError(validationError, {
        step: 'character_id_validation',
        component: 'CharacterConverter',
        characterId: this.characterId
      });
      
      const notifications = Alpine.store('notifications');
      notifications.addError('Please enter a valid character ID or D&D Beyond character URL');
    }
  },
  
  async convertCharacter() {
    if (!this.characterId.trim()) {
      // Use centralized error handling for empty character ID
      const validationError = createValidationError('Please enter a character ID');
      errorService.handleError(validationError, {
        step: 'character_id_required',
        component: 'CharacterConverter',
        characterId: this.characterId
      });
      
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
      const characterId = result.characterData?.id || this.characterId;
      const conversionResults = Alpine.store('conversionResults');
      conversionResults.setResult(result.xml!, characterName, characterId);
      
      // Dispatch event for simplified components with character data
      const characterDataEvent = new CustomEvent('characterDataLoaded', {
        detail: {
          characterData: result.characterData,
          xml: result.xml,
          characterName: characterName
        }
      });
      document.dispatchEvent(characterDataEvent);
      
      const notifications = Alpine.store('notifications');
      const isDebugMode = (window as any).featureFlags?.isEnabled('debug_character_data');
      
      // Check if this is a warlock and validate pact magic
      this.validateWarlockPactMagic(result, notifications);
      
      const successMessage = isDebugMode 
        ? `Character "${characterName}" converted successfully! Check console for detailed data.`
        : `Character "${characterName}" converted successfully!`;
      
      notifications.addSuccess(successMessage);
      
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Use centralized error handling
      const handledError = await errorService.handleError(
        error instanceof Error ? error : new Error('Unknown conversion error'), 
        {
          step: this.currentStep,
          component: 'CharacterConverter',
          characterId: this.characterId,
          metadata: { 
            progress: this.progress,
            fgVersion: this.fgVersion
          }
        }
      );
      
      // The error display component will show the error automatically
      // But also update local state and notifications for UI feedback
      const notifications = Alpine.store('notifications');
      notifications.addError(handledError.message);
      
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
  },

  // Validate warlock pact magic in converted characters
  validateWarlockPactMagic(result: any, notifications: any) {
    if (!result.success || !result.characterData || !result.xml) return;
    
    // Check if this character has warlock levels
    const classes = result.characterData.classes || [];
    const warlockClass = classes.find((cls: any) => 
      cls.definition?.name?.toLowerCase() === 'warlock'
    );
    
    if (!warlockClass) return; // Not a warlock, skip validation
    
    const warlockLevel = warlockClass.level;
    const characterName = result.characterData.name || 'Unknown';
    const xml = result.xml;
    
    // Expected pact magic slots for this warlock level
    let expectedSlots = {};
    if (warlockLevel >= 17) expectedSlots = { level5: 4 };
    else if (warlockLevel >= 15) expectedSlots = { level5: 3 };
    else if (warlockLevel >= 11) expectedSlots = { level5: 2 };
    else if (warlockLevel >= 9) expectedSlots = { level5: 2 };
    else if (warlockLevel >= 7) expectedSlots = { level4: 2 };
    else if (warlockLevel >= 5) expectedSlots = { level3: 2 };
    else if (warlockLevel >= 3) expectedSlots = { level2: 2 };
    else if (warlockLevel >= 2) expectedSlots = { level1: 2 };
    else if (warlockLevel >= 1) expectedSlots = { level1: 1 };
    
    // Look for pact magic slots in XML
    const pactMagicRegex = /<pactmagicslots(\d+)><max type="number">(\d+)<\/max>/g;
    const pactMatches = [...xml.matchAll(pactMagicRegex)];
    
    let foundSlots: string[] = [];
    let validationPassed = false;
    
    if (pactMatches.length > 0) {
      pactMatches.forEach(match => {
        const level = match[1];
        const slots = match[2];
        if (slots !== '0') {
          foundSlots.push(`L${level}: ${slots}`);
          
          // Check if this matches expected slots
          const expectedKey = `level${level}`;
          if (expectedSlots[expectedKey] && parseInt(slots) === expectedSlots[expectedKey]) {
            validationPassed = true;
          }
        }
      });
      
      if (validationPassed) {
        notifications.addInfo(`🎭 Warlock validated: Level ${warlockLevel} ${characterName} correctly has pact magic slots (${foundSlots.join(', ')})`);
      } else {
        const expectedDesc = Object.entries(expectedSlots).map(([key, val]) => `L${key.replace('level', '')}: ${val}`).join(', ');
        notifications.addWarning(`⚠️ Warlock issue: Level ${warlockLevel} ${characterName} has unexpected pact magic slots. Found: ${foundSlots.join(', ')}, Expected: ${expectedDesc}`);
      }
    } else {
      // Check if regular spell slots were generated instead
      const spellSlotRegex = /<spellslots(\d+)><max type="number">(\d+)<\/max>/g;
      const spellMatches = [...xml.matchAll(spellSlotRegex)];
      const regularSlots = spellMatches.filter(match => match[2] !== '0').map(match => `L${match[1]}: ${match[2]}`);
      
      if (regularSlots.length > 0) {
        notifications.addError(`❌ Warlock error: Level ${warlockLevel} ${characterName} has regular spell slots instead of pact magic (${regularSlots.join(', ')})`);
      } else {
        notifications.addError(`❌ Warlock error: Level ${warlockLevel} ${characterName} has no spell slots generated`);
      }
    }
  },

  showFormatSelector() {
    // Dispatch event to show format selector modal
    window.dispatchEvent(new CustomEvent('showFormatSelector'));
  }
}));