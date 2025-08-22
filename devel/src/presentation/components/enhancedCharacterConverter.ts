/**
 * Enhanced Character Converter Alpine.js Component
 * 
 * Extends the original character converter to support multi-format selection
 * and advanced UX features from Phase 2 implementation.
 */

import Alpine from 'alpinejs';
import { featureFlags } from '@/core/FeatureFlags';
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';

export interface EnhancedCharacterConverterData {
  // Form state
  characterId: string;
  fgVersion: 'unity' | 'classic';
  
  // Conversion state
  isConverting: boolean;
  progress: number;
  currentStep: string;
  
  // Character data
  characterData: CharacterData | null;
  
  // Validation
  isValidId: boolean;
  
  // Feature flags
  showCharacterPreview: boolean;
  showPerformanceMetrics: boolean;
  enableBulkConversion: boolean;
  enableMultiFormat: boolean;
  
  // Multi-format integration
  showFormatSelection: boolean;
  formatSelectionAnalyzed: boolean;
  
  // Methods
  init(): void;
  validateCharacterId(): void;
  convertCharacter(): Promise<void>;
  triggerFormatAnalysis(): Promise<void>;
  resetForm(): void;
  downloadResult(): void;
  delay(ms: number): Promise<void>;
  updateFeatureFlags(): void;
  validateWarlockPactMagic(result: any, notifications: any): void;
  showFormatSelector(): void;
  hideFormatSelector(): void;
  onCharacterDataLoaded(characterData: CharacterData): void;
}

// Enhanced Character converter Alpine.js component
Alpine.data('enhancedCharacterConverter', (): EnhancedCharacterConverterData => ({
  // Form state
  characterId: '',
  fgVersion: 'unity',
  
  // Conversion state  
  isConverting: false,
  progress: 0,
  currentStep: '',
  
  // Character data
  characterData: null,
  
  // Validation
  isValidId: true,
  
  // Feature flags
  showCharacterPreview: featureFlags.isEnabled('character_preview'),
  showPerformanceMetrics: featureFlags.isEnabled('performance_metrics'),
  enableBulkConversion: featureFlags.isEnabled('bulk_conversion'),
  enableMultiFormat: featureFlags.isEnabled('multi_format_export'),
  
  // Multi-format integration
  showFormatSelection: false,
  formatSelectionAnalyzed: false,
  
  // Initialize component
  init() {
    // Listen for feature flag changes
    window.addEventListener('featureFlagsChanged', () => {
      this.updateFeatureFlags();
    });

    // Listen for character data loaded from file upload or regular conversion
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail && event.detail.characterData) {
        console.log('🎯 Enhanced converter: Character data loaded');
        this.onCharacterDataLoaded(event.detail.characterData);
        
        // Update state for file uploads
        if (event.detail.xml) {
          // Set a special file identifier that won't interfere with validation
          this.characterId = `file_${event.detail.characterData.id || Date.now()}`;
          this.isValidId = true;
          this.isConverting = false;
          this.progress = 100;
          this.currentStep = 'File conversion complete!';
          
          // Store character data so format selector works
          this.characterData = event.detail.characterData;
          
          // Ensure conversion results store is properly updated
          const conversionResults = Alpine.store('conversionResults');
          const characterId = event.detail.characterData.id || 'unknown';
          conversionResults.setResult(event.detail.xml, event.detail.characterName || event.detail.characterData.name, characterId);

          // Trigger format analysis if multi-format is enabled
          if (this.enableMultiFormat) {
            setTimeout(() => {
              this.triggerFormatAnalysis();
            }, 100);
          }

          console.log('📁 Enhanced converter state updated after file upload:', {
            characterId: this.characterId,
            hasCharacterData: !!this.characterData,
            hasResult: conversionResults.hasResult,
            enableMultiFormat: this.enableMultiFormat
          });
        }
      }
    });
    
    console.log('🎯 Enhanced Character Converter initialized');
    console.log('Multi-format support:', this.enableMultiFormat ? 'enabled' : 'disabled');
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
    
    // Check for direct character ID (numeric) or file upload identifier
    const idPattern = /^\d+$/;
    const filePattern = /^file_/;
    this.isValidId = idPattern.test(trimmedId) || filePattern.test(trimmedId);
    
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
    
    const sanitizedId = this.characterId.trim();
    
    // Check if this is a file upload ID - if so, character is already converted
    if (sanitizedId.startsWith('file_')) {
      const notifications = Alpine.store('notifications');
      notifications.addInfo('Character from file is already converted! Use the download button or choose export formats.');
      return;
    }
    
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

      // Store character data for format analysis
      this.characterData = result.characterData;
      this.onCharacterDataLoaded(result.characterData);

      // Step 5: Complete
      this.currentStep = 'Complete!';
      this.progress = 100;
      
      // Store result (maintain backward compatibility)
      const characterName = result.characterData?.name || 'Unknown Character';
      const characterId = result.characterData?.id || this.characterId;
      conversionResults.setResult(result.xml!, characterName, characterId);
      
      const notifications = Alpine.store('notifications');
      const isDebugMode = (window as any).featureFlags?.isEnabled('debug_character_data');
      
      // Check if this is a warlock and validate pact magic
      this.validateWarlockPactMagic(result, notifications);
      
      const successMessage = isDebugMode 
        ? `Character "${characterName}" converted successfully! Check console for detailed data.`
        : `Character "${characterName}" converted successfully!`;
      
      notifications.addSuccess(successMessage);
      
      // Show format selection if multi-format is enabled
      if (this.enableMultiFormat) {
        await this.triggerFormatAnalysis();
      }
      
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

  async triggerFormatAnalysis() {
    if (!this.characterData || !this.enableMultiFormat) return;
    
    try {
      console.log('🔍 Triggering format compatibility analysis...');
      
      // Dispatch event to format selector
      const event = new CustomEvent('characterDataLoaded', {
        detail: { characterData: this.characterData }
      });
      window.dispatchEvent(event);
      
      // Small delay to allow format analysis
      await this.delay(500);
      
      this.formatSelectionAnalyzed = true;
      
      const notifications = Alpine.store('notifications');
      notifications.addInfo('Format compatibility analysis complete. You can now export to multiple formats.');
      
    } catch (error) {
      console.error('Format analysis failed:', error);
    }
  },

  showFormatSelector() {
    if (!this.enableMultiFormat) {
      const notifications = Alpine.store('notifications');
      notifications.addInfo('Multi-format export is not enabled. Please enable the feature flag to access format selection.');
      return;
    }
    
    if (!this.characterData) {
      const notifications = Alpine.store('notifications');
      notifications.addError('Please convert a character first before selecting export formats.');
      return;
    }
    
    // Trigger simple format selector and provide character data
    window.dispatchEvent(new CustomEvent('showFormatSelector'));
    window.dispatchEvent(new CustomEvent('characterDataLoaded', {
      detail: { characterData: this.characterData }
    }));
    console.log('📋 Simple format selector triggered with character data:', this.characterData?.name);
  },

  hideFormatSelector() {
    this.showFormatSelection = false;
    console.log('📋 Format selector closed');
  },

  onCharacterDataLoaded(characterData: CharacterData) {
    console.log('📊 Character data loaded for format analysis:', {
      name: characterData.name,
      level: this.calculateTotalLevel(characterData),
      classes: characterData.classes?.length || 0,
      race: characterData.race?.fullName
    });
  },
  
  resetForm() {
    this.characterId = '';
    this.fgVersion = 'unity';
    this.isConverting = false;
    this.progress = 0;
    this.currentStep = '';
    this.isValidId = true;
    this.characterData = null;
    this.showFormatSelection = false;
    this.formatSelectionAnalyzed = false;
    
    const conversionResults = Alpine.store('conversionResults');
    conversionResults.clearResult();
    
    const notifications = Alpine.store('notifications');
    notifications.clear();
    
    // Reset format selector if present
    const formatSelector = document.querySelector('[x-data*="formatSelector"]');
    if (formatSelector && (formatSelector as any).formatSelector) {
      (formatSelector as any).formatSelector.reset();
    }
    
    console.log('🔄 Enhanced character converter form reset');
  },
  
  downloadResult() {
    const conversionResults = Alpine.store('conversionResults');
    const success = conversionResults.downloadXML();
    
    const notifications = Alpine.store('notifications');
    if (success) {
      notifications.addSuccess('Fantasy Grounds XML file downloaded successfully!');
    } else {
      notifications.addError('Failed to download Fantasy Grounds XML file');
    }
  },
  
  // Update feature flags from current state
  updateFeatureFlags() {
    this.showCharacterPreview = featureFlags.isEnabled('character_preview');
    this.showPerformanceMetrics = featureFlags.isEnabled('performance_metrics');
    this.enableBulkConversion = featureFlags.isEnabled('bulk_conversion');
    this.enableMultiFormat = featureFlags.isEnabled('multi_format_export');
    
    console.log('🎛️ Feature flags updated:', {
      characterPreview: this.showCharacterPreview,
      performanceMetrics: this.showPerformanceMetrics,
      bulkConversion: this.enableBulkConversion,
      multiFormat: this.enableMultiFormat
    });
  },
  
  // Utility method for delays
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Calculate total character level
  calculateTotalLevel(characterData: CharacterData): number {
    const classes = characterData.classes || [];
    return classes.reduce((total, cls) => total + (cls.level || 0), 0);
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
  }
}));