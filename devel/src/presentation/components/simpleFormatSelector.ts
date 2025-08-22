/**
 * Simple Multi-Format Selector
 * 
 * Lightweight format selection with basic dropdown and simple compatibility messages
 */

import Alpine from 'alpinejs';

export interface SimpleFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  compatibility: 'excellent' | 'good' | 'fair' | 'poor';
  available: boolean;
  message?: string;
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
  downloadFormat(formatId: string): void;
  closeModal(): void;
  getCompatibilityColor(level: string): string;
  getCompatibilityMessage(level: string): string;
}

// Simple format definitions
function getAvailableFormats(): SimpleFormat[] {
  return [
    {
      id: 'fantasy-grounds',
      name: 'Fantasy Grounds',
      description: 'Unity & Classic compatible XML format',
      icon: '🏰',
      compatibility: 'excellent',
      available: true,
      message: 'Fully supported with complete feature set'
    },
    {
      id: 'foundry-vtt',
      name: 'Foundry VTT',
      description: 'JSON format for Foundry Virtual Tabletop',
      icon: '⚒️',
      compatibility: 'good',
      available: true,
      message: 'Most features supported, some manual setup required'
    },
    {
      id: 'roll20',
      name: 'Roll20',
      description: 'JSON character sheet import',
      icon: '🎲',
      compatibility: 'fair',
      available: true,
      message: 'Basic character data supported'
    },
    {
      id: 'json-export',
      name: 'Generic JSON',
      description: 'Raw character data in JSON format',
      icon: '📄',
      compatibility: 'excellent',
      available: true,
      message: 'Complete character data export'
    }
  ];
}

// Simple format analysis based on character data
function analyzeCharacterCompatibility(characterData: any, formats: SimpleFormat[]): SimpleFormat[] {
  if (!characterData) return formats;

  return formats.map(format => {
    let compatibility = format.compatibility;
    let message = format.message;
    let available = format.available;

    // Basic analysis based on character complexity
    const totalLevel = characterData.classes?.reduce((total: number, cls: any) => total + (cls.level || 0), 0) || 1;
    const hasSpells = characterData.spells && characterData.spells.length > 0;
    const hasMulticlass = characterData.classes && characterData.classes.length > 1;

    switch (format.id) {
      case 'fantasy-grounds':
        // Always excellent for Fantasy Grounds (our native format)
        break;
        
      case 'foundry-vtt':
        if (hasSpells && totalLevel > 10) {
          compatibility = 'good';
          message = 'High-level spellcaster - may need manual spell setup';
        } else if (hasMulticlass) {
          compatibility = 'good';
          message = 'Multiclass character - verify class features';
        }
        break;
        
      case 'roll20':
        if (totalLevel > 15) {
          compatibility = 'fair';
          message = 'High-level features may need manual entry';
        } else if (hasSpells) {
          compatibility = 'fair';
          message = 'Spells require manual setup in Roll20';
        }
        break;
        
      case 'json-export':
        // Always excellent for raw data export
        break;
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
  selectedFormats: ['fantasy-grounds'], // Default to Fantasy Grounds
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
    this.characterData = characterData;
    this.isAnalyzing = true;
    
    // Simulate brief analysis delay
    setTimeout(() => {
      this.availableFormats = analyzeCharacterCompatibility(characterData, getAvailableFormats());
      this.isAnalyzing = false;
      
      console.log('📊 Format compatibility analysis complete:', {
        character: characterData.name,
        formats: this.availableFormats.length
      });
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

    const notifications = Alpine.store('notifications');
    
    try {
      console.log('🔄 Converting to selected formats:', this.selectedFormats);
      
      for (const formatId of this.selectedFormats) {
        const format = this.availableFormats.find(f => f.id === formatId);
        if (!format) continue;

        console.log(`📦 Converting to ${format.name}...`);
        
        // Simulate conversion process
        await this.simulateConversion(formatId, format);
      }

      notifications.addSuccess(`Successfully converted to ${this.selectedFormats.length} format(s)!`);
      
    } catch (error) {
      console.error('Conversion error:', error);
      notifications.addError('Failed to convert to selected formats');
    }
  },

  async simulateConversion(formatId: string, format: SimpleFormat) {
    // Simulate conversion delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For now, we'll use the existing Fantasy Grounds XML for all formats
    // In a real implementation, this would call specific format adapters
    const conversionResults = Alpine.store('conversionResults');
    
    let convertedData = '';
    let filename = '';
    
    switch (formatId) {
      case 'fantasy-grounds':
        convertedData = conversionResults.result || '<character>No data</character>';
        // Use the filename from conversionResults which was set with the correct naming convention
        filename = conversionResults.filename || `${(this.characterData?.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')}_unknown.xml`;
        break;
        
      case 'foundry-vtt':
        // Simple JSON conversion for demo
        convertedData = JSON.stringify({
          name: this.characterData?.name || 'Unknown',
          type: 'character',
          system: 'dnd5e',
          data: this.characterData
        }, null, 2);
        // Extract character name and ID from conversionResults filename if available
        {
          const baseFilename = conversionResults.filename ? 
            conversionResults.filename.replace('.xml', '') : 
            `${(this.characterData?.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')}_unknown`;
          filename = `${baseFilename}.json`;
        }
        break;
        
      case 'roll20':
        // Simple JSON conversion for demo
        convertedData = JSON.stringify({
          name: this.characterData?.name || 'Unknown',
          avatar: '',
          bio: '',
          gmnotes: '',
          archived: false,
          tags: [],
          controlledby: '',
          _displayname: this.characterData?.name || 'Unknown'
        }, null, 2);
        // Extract character name and ID from conversionResults filename if available
        {
          const baseFilename = conversionResults.filename ? 
            conversionResults.filename.replace('.xml', '') : 
            `${(this.characterData?.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')}_unknown`;
          filename = `${baseFilename}.json`;
        }
        break;
        
      case 'json-export':
        convertedData = JSON.stringify(this.characterData, null, 2);
        // Extract character name and ID from conversionResults filename if available
        {
          const baseFilename = conversionResults.filename ? 
            conversionResults.filename.replace('.xml', '') : 
            `${(this.characterData?.name || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')}_unknown`;
          filename = `${baseFilename}.json`;
        }
        break;
        
      default:
        throw new Error(`Unknown format: ${formatId}`);
    }
    
    this.conversionResults[formatId] = {
      data: convertedData,
      filename: filename,
      format: format
    };
    
    console.log(`✅ ${format.name} conversion complete`);
  },

  downloadFormat(formatId: string) {
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
      const notifications = Alpine.store('notifications');
      notifications.addError(`Failed to download ${result.format.name} file`);
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
  }
}));

console.log('📋 Simple Format Selector component registered');