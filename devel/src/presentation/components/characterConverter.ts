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
  fetchCharacterData(characterId: string): Promise<any>;
  generateXML(characterData: any): Promise<string>;
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
      
      // Step 2: Fetch character data
      this.currentStep = 'Fetching character data...';
      this.progress = 30;
      
      const characterData = await this.fetchCharacterData(sanitizedId);
      
      // Step 3: Process character data
      this.currentStep = 'Processing character data...';
      this.progress = 60;
      await this.delay(500);
      
      // Step 4: Generate XML
      this.currentStep = 'Generating Fantasy Grounds XML...';
      this.progress = 80;
      
      const xml = await this.generateXML(characterData);
      
      // Step 5: Complete
      this.currentStep = 'Complete!';
      this.progress = 100;
      
      // Store result
      const characterName: string = characterData?.name || 'Unknown Character';
      const conversionResults = Alpine.store('conversionResults');
      conversionResults.setResult(xml, characterName);
      
      const notifications = Alpine.store('notifications');
      notifications.addSuccess(`Character "${characterName}" converted successfully!`);
      
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
  
  async fetchCharacterData(characterId: string) {
    // Use the same proxy and API as legacy code
    const proxyUrl = 'https://uakari-indigo.fly.dev/';
    const apiUrl = 'https://character-service.dndbeyond.com/character/v5/character/';
    const fetchUrl = proxyUrl + apiUrl + characterId;
    
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      switch (response.status) {
        case 404:
          errorMessage = 'Character not found. Please verify the Character ID and ensure the character is set to Public.';
          break;
        case 403:
          errorMessage = 'Access denied. Please ensure the character is set to Public, not Private.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'D&D Beyond servers are experiencing issues. Please try again in a few minutes.';
          break;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  },
  
  async generateXML(characterData: any): Promise<string> {
    // For now, we'll create a placeholder XML
    // Later this will integrate with the extracted legacy parsing logic
    const characterName = characterData?.name || 'Unknown Character';
    const characterId = characterData?.id || 'unknown';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<root version="4.0">
  <character>
    <name type="string">${characterName}</name>
    <charsheet type="string">dnd5e</charsheet>
    <notes type="string">Converted from D&D Beyond (ID: ${characterId}) using Modern Converter v2.0</notes>
    <!-- TODO: Integrate with legacy character parsing logic -->
    <placeholder type="string">This is a placeholder XML. Integration with legacy parsing logic pending.</placeholder>
  </character>
</root>`;
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