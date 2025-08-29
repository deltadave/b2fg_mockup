/**
 * Simple Multi-Format Selector
 * 
 * Lightweight format selection with basic dropdown and simple compatibility messages
 */

import Alpine from 'alpinejs';
import { formatRegistry } from '../../domain/export/registry/FormatRegistry';
import type { FormatInfo } from '../../domain/export/interfaces/OutputFormatter';
import { errorService, createProcessingError, createValidationError } from '@/shared/errors/ErrorService';

export interface SimpleFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  compatibility: 'excellent' | 'good' | 'fair' | 'poor';
  available: boolean;
  message?: string;
  formatInfo?: FormatInfo;
}

export interface SimpleFormatSelectorData {
  characterData: any;
  availableFormats: SimpleFormat[];
  selectedFormats: string[];
  isAnalyzing: boolean;
  showFormatModal: boolean;
  conversionResults: Record<string, any>;
  
  // Methods
  init(): void;
  analyzeFormats(characterData: any): void;
  toggleFormat(formatId: string): void;
  selectRecommendedFormats(): void;
  clearSelection(): void;
  convertToSelectedFormats(): Promise<void>;
  downloadFormat(formatId: string): Promise<void>;
  closeModal(): void;
  getCompatibilityColor(level: string): string;
  getCompatibilityMessage(level: string): string;
}

// Get formats from registry with fallback compatibility assessment
function getAvailableFormats(): SimpleFormat[] {
  try {
    const supportedFormats = formatRegistry.getSupportedFormats();
  
  const formats: SimpleFormat[] = supportedFormats.map(formatInfo => {
    // Map format IDs to compatibility levels (default assessment)
    let compatibility: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    let message = 'Standard compatibility';
    
    switch (formatInfo.format) {
      case 'foundry-vtt-json':
        compatibility = 'good';
        message = 'Most features supported, some manual setup may be required';
        break;
      default:
        compatibility = 'good';
        message = 'Compatible with standard character features';
        break;
    }
    
    return {
      id: formatInfo.format,
      name: formatInfo.name,
      description: formatInfo.description,
      icon: formatInfo.icon,
      compatibility,
      available: true,
      message,
      formatInfo
    };
  });
  
  // Ensure Fantasy Grounds is prioritized (remove duplicates if it already exists from registry)
  const filteredFormats = formats.filter(f => f.id !== 'fantasy-grounds-xml');
  
  // Add Fantasy Grounds as the primary format
  filteredFormats.unshift({
    id: 'fantasy-grounds-xml',
    name: 'Fantasy Grounds',
    description: 'Unity & Classic compatible XML format (primary)',
    icon: '🏰',
    compatibility: 'excellent',
    available: true,
    message: 'Fully supported with complete feature set - our primary output format'
  });
  
  return filteredFormats;
  } catch (error) {
    console.warn('Failed to get formats from registry, using fallback:', error);
    
    // Fallback format list if registry is not available
    return [
      {
        id: 'fantasy-grounds-xml',
        name: 'Fantasy Grounds',
        description: 'Unity & Classic compatible XML format',
        icon: '🏰',
        compatibility: 'excellent' as const,
        available: true,
        message: 'Fully supported with complete feature set'
      },
      {
        id: 'foundry-vtt-json',
        name: 'Foundry VTT',
        description: 'FoundryVTT Actor format with Active Effects',
        icon: '⚔️',
        compatibility: 'good' as const,
        available: true,
        message: 'Most features supported, some manual setup required'
      }
    ];
  }
}

// Character compatibility analysis using FormatRegistry when available
function analyzeCharacterCompatibility(characterData: any, formats: SimpleFormat[]): SimpleFormat[] {
  if (!characterData) return formats;

  return formats.map(format => {
    let compatibility = format.compatibility;
    let message = format.message;
    let available = format.available;

    // For registry-managed formats, use the registry's compatibility analysis
    if (format.formatInfo) {
      try {
        // Create ProcessedCharacterData for registry analysis
        const processedData = {
          characterData,
          // Add minimal processed data structure
          abilities: characterData.stats || {},
          totalLevel: characterData.classes?.reduce((total: number, cls: any) => total + (cls.level || 0), 0) || 1
        };
        
        const compatibilityMap = formatRegistry.getFormatCompatibility(processedData as any);
        const registryCompatibility = compatibilityMap.get(format.id);
        
        if (registryCompatibility) {
          compatibility = registryCompatibility.recommendation;
          if (registryCompatibility.warnings.length > 0) {
            message = registryCompatibility.warnings[0]; // Show first warning
          }
        }
      } catch (error) {
        console.warn(`Failed to analyze compatibility for ${format.id}:`, error);
        // Fall back to basic analysis below
      }
    }

    // Fallback to basic analysis for non-registry formats or on error
    if (!format.formatInfo || compatibility === format.compatibility) {
      const totalLevel = characterData.classes?.reduce((total: number, cls: any) => total + (cls.level || 0), 0) || 1;
      const hasSpells = characterData.spells && characterData.spells.length > 0;
      const hasMulticlass = characterData.classes && characterData.classes.length > 1;

      switch (format.id) {
        case 'fantasy-grounds-xml':
          // Always excellent for Fantasy Grounds (our native format)
          break;
          
        case 'foundry-vtt-json':
          if (hasSpells && totalLevel > 10) {
            compatibility = 'good';
            message = 'High-level spellcaster - may need manual spell setup';
          } else if (hasMulticlass) {
            compatibility = 'good';
            message = 'Multiclass character - verify class features';
          }
          break;
      }
    }

    return {
      ...format,
      compatibility,
      available,
      message
    };
  });
}

// Alpine.js component for simple format selector
Alpine.data('simpleFormatSelector', (): SimpleFormatSelectorData => ({
  characterData: null,
  availableFormats: getAvailableFormats(),
  selectedFormats: ['fantasy-grounds-xml'], // Default to Fantasy Grounds
  isAnalyzing: false,
  showFormatModal: false,
  conversionResults: {},

  init() {
    console.log('📋 Simple Format Selector initialized');
    
    // Listen for character data updates
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail?.characterData) {
        this.analyzeFormats(event.detail.characterData);
      }
    });

    // Listen for format selector requests
    window.addEventListener('showFormatSelector', () => {
      this.showFormatModal = true;
    });
  },

  analyzeFormats(characterData: any) {
    console.log('📊 analyzeFormats called with character data:', characterData?.name, characterData?.id);
    console.log('📊 Character data keys:', Object.keys(characterData || {}));
    
    this.characterData = characterData;
    this.isAnalyzing = true;
    
    // Simulate brief analysis delay
    setTimeout(() => {
      this.availableFormats = analyzeCharacterCompatibility(characterData, getAvailableFormats());
      this.isAnalyzing = false;
      
      console.log('📊 Format compatibility analysis complete:', {
        character: characterData.name,
        formats: this.availableFormats.length,
        availableFormatIds: this.availableFormats.map(f => f.id)
      });
      console.log('📊 Character data stored:', !!this.characterData);
    }, 300);
  },

  toggleFormat(formatId: string) {
    const index = this.selectedFormats.indexOf(formatId);
    if (index === -1) {
      this.selectedFormats.push(formatId);
    } else {
      this.selectedFormats.splice(index, 1);
    }
    
    console.log('📋 Format selection updated:', this.selectedFormats);
  },

  selectRecommendedFormats() {
    // Select formats with excellent or good compatibility
    this.selectedFormats = this.availableFormats
      .filter(format => format.compatibility === 'excellent' || format.compatibility === 'good')
      .map(format => format.id);
      
    console.log('✨ Recommended formats selected:', this.selectedFormats);
  },

  clearSelection() {
    this.selectedFormats = [];
    console.log('🗑️ Format selection cleared');
  },

  async convertToSelectedFormats() {
    if (this.selectedFormats.length === 0) {
      console.warn('No formats selected for conversion');
      return;
    }

    if (!this.characterData) {
      console.error('❌ No character data available for conversion');
      
      // Use centralized error handling for validation errors
      const validationError = createValidationError('No character data available for conversion');
      errorService.handleError(validationError, {
        step: 'pre_conversion_validation',
        component: 'SimpleFormatSelector',
        metadata: { 
          selectedFormats: this.selectedFormats
        }
      });
      
      const notifications = Alpine.store('notifications');
      notifications.addError('No character data available for conversion');
      return;
    }

    const notifications = Alpine.store('notifications');
    
    try {
      console.log('🔄 Converting to selected formats:', this.selectedFormats);
      console.log('📊 Character data available:', !!this.characterData);
      console.log('📊 Character data preview:', this.characterData?.name, this.characterData?.id);
      
      // Get the CharacterConverterFacade for actual conversions
      console.log('📦 Importing CharacterConverterFacade...');
      const { CharacterConverterFacade } = await import('../../application/facades/CharacterConverterFacade');
      console.log('✅ CharacterConverterFacade imported');
      
      console.log('🏭 Creating converter instance...');
      const converter = new CharacterConverterFacade();
      console.log('✅ Converter created');
      
      const registryFormats = this.selectedFormats.filter(id => id !== 'fantasy-grounds-xml');
      const includeFantasyGrounds = this.selectedFormats.includes('fantasy-grounds-xml');
      
      console.log('📋 Registry formats to process:', registryFormats);
      console.log('🏰 Include Fantasy Grounds:', includeFantasyGrounds);
      
      // Convert using registry formats if any selected
      if (registryFormats.length > 0) {
        console.log('🔄 Starting multi-format conversion for:', registryFormats);
        
        try {
          const results = await converter.generateMultiFormatOutput(
            this.characterData, 
            registryFormats
          );
          
          console.log('📊 Multi-format conversion completed, results:', results.size);
          
          // Store results for download
          for (const [formatId, result] of results) {
            console.log(`📄 Processing result for ${formatId}:`, result.success);
            
            if (result.success && result.output) {
              const format = this.availableFormats.find(f => f.id === formatId);
              if (format) {
                this.conversionResults[formatId] = {
                  data: result.output,
                  filename: result.filename || `${this.getCharacterFilename()}.${this.getFormatExtension(formatId)}`,
                  format: format
                };
                console.log(`✅ Successfully stored result for ${formatId}`);
              } else {
                console.warn(`⚠️ Format definition not found for ${formatId}`);
              }
            } else {
              console.error(`❌ Failed to convert to ${formatId}:`, result.errors);
              notifications.addError(`Failed to convert to ${formatId}`);
            }
          }
        } catch (conversionError) {
          console.error('💥 Multi-format conversion threw error:', conversionError);
          throw conversionError;
        }
      }
      
      // Handle Fantasy Grounds XML separately (uses existing system)
      if (includeFantasyGrounds) {
        const format = this.availableFormats.find(f => f.id === 'fantasy-grounds-xml');
        if (format) {
          await this.simulateConversion('fantasy-grounds-xml', format);
        }
      }

      notifications.addSuccess(`Successfully converted to ${this.selectedFormats.length} format(s)!`);
      
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Use centralized error handling
      const handledError = await errorService.handleError(
        error instanceof Error ? error : new Error('Unknown format conversion error'), 
        {
          step: 'multi_format_conversion',
          component: 'SimpleFormatSelector',
          metadata: { 
            selectedFormats: this.selectedFormats,
            characterName: this.characterData?.name,
            characterId: this.characterData?.id
          }
        }
      );
      
      notifications.addError(handledError.message);
    }
  },

  async simulateConversion(formatId: string, format: SimpleFormat) {
    // This is only used for Fantasy Grounds XML now (legacy system)
    if (formatId !== 'fantasy-grounds-xml') {
      console.warn('simulateConversion should only be used for Fantasy Grounds XML');
      return;
    }
    
    // Simulate conversion delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use the existing Fantasy Grounds XML system
    const conversionResults = Alpine.store('conversionResults');
    
    const convertedData = conversionResults.result || '<character>No data</character>';
    const filename = conversionResults.filename || `${this.getCharacterFilename()}.xml`;
    
    this.conversionResults[formatId] = {
      data: convertedData,
      filename: filename,
      format: format
    };
    
    console.log(`✅ ${format.name} conversion complete`);
  },

  async downloadFormat(formatId: string) {
    const result = this.conversionResults[formatId];
    if (!result) {
      console.warn('No conversion result found for format:', formatId);
      return;
    }

    try {
      const mimeType = formatId.includes('json') ? 'application/json' : 'application/xml';
      const blob = new Blob([result.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('📥 Downloaded:', result.filename);
      
      const notifications = Alpine.store('notifications');
      notifications.addSuccess(`Downloaded ${result.format.name} file: ${result.filename}`);
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Use centralized error handling for download errors
      const handledError = await errorService.handleError(
        error instanceof Error ? error : new Error('File download failed'), 
        {
          step: 'file_download',
          component: 'SimpleFormatSelector',
          metadata: { 
            formatId: formatId,
            formatName: result.format.name,
            filename: result.filename
          }
        }
      );
      
      const notifications = Alpine.store('notifications');
      notifications.addError(handledError.message);
    }
  },

  closeModal() {
    this.showFormatModal = false;
    console.log('📋 Format selector modal closed');
  },

  getCompatibilityColor(level: string): string {
    switch (level) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },

  getCompatibilityMessage(level: string): string {
    switch (level) {
      case 'excellent': return 'Full compatibility';
      case 'good': return 'Very good compatibility';
      case 'fair': return 'Basic compatibility';
      case 'poor': return 'Limited compatibility';
      default: return 'Unknown compatibility';
    }
  },
  
  getCharacterFilename(): string {
    if (!this.characterData) return 'character_unknown';
    
    const name = (this.characterData.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_');
    const id = this.characterData.id || 'unknown';
    return `${name}_${id}`;
  },
  
  getFormatExtension(formatId: string): string {
    const format = this.availableFormats.find(f => f.id === formatId);
    if (format?.formatInfo) {
      return format.formatInfo.fileExtension.replace('.', '');
    }
    
    // Fallback extensions
    switch (formatId) {
      case 'fantasy-grounds-xml': return 'xml';
      default: return 'json';
    }
  }
}));

console.log('📋 Simple Format Selector component registered');