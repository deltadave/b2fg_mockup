/**
 * Format Selector Component
 * 
 * Alpine.js component for multi-format character export selection
 */

import Alpine from 'alpinejs';

export interface FormatMetadata {
  id: string;
  name: string;
  description: string;
  fileExtension: string;
  version: string;
  website?: string;
}

export interface FormatCompatibility {
  score: number; // 0-100
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  dataLoss: number; // 0-100 percentage
  limitations: string[];
}

export interface FormatOption {
  metadata: FormatMetadata;
  compatibility: FormatCompatibility;
  selected: boolean;
}

export interface ConversionProgress {
  [formatId: string]: {
    status: 'pending' | 'converting' | 'complete' | 'error';
    progress?: number;
    error?: string;
    downloadUrl?: string;
  };
}

export interface FormatSelectorData {
  // State
  availableFormats: FormatOption[];
  selectedFormats: string[];
  analysisComplete: boolean;
  isConverting: boolean;
  conversionProgress: ConversionProgress;
  recommendedFormat: string | null;
  
  // Character data
  characterData: any;
  
  // Methods
  init(): void;
  analyzeCharacterCompatibility(characterData: any): Promise<void>;
  toggleFormatSelection(formatId: string): void;
  selectRecommendedFormat(): void;
  selectAllFormats(): void;
  clearSelections(): void;
  convertToSelectedFormats(): Promise<void>;
  downloadFormat(formatId: string): void;
  downloadAllFormats(): void;
  getRecommendationBadgeClass(recommendation: string): string;
  reset(): void;
}

// Sample format data for demonstration
const defaultFormatOptions: FormatOption[] = [
  {
    metadata: {
      id: 'fantasy-grounds',
      name: 'Fantasy Grounds',
      description: 'XML format for Fantasy Grounds Unity and Classic',
      fileExtension: 'xml',
      version: '1.0.0',
      website: 'https://fantasygrounds.com'
    },
    compatibility: {
      score: 95,
      recommendation: 'excellent',
      dataLoss: 2,
      limitations: []
    },
    selected: true
  },
  {
    metadata: {
      id: 'foundry-vtt',
      name: 'Foundry VTT',
      description: 'JSON format for Foundry Virtual Tabletop D&D 5e system',
      fileExtension: 'json',
      version: '1.0.0',
      website: 'https://foundryvtt.com'
    },
    compatibility: {
      score: 88,
      recommendation: 'good',
      dataLoss: 8,
      limitations: ['Complex features may need manual setup']
    },
    selected: false
  },
  {
    metadata: {
      id: 'roll20',
      name: 'Roll20',
      description: 'JSON format for Roll20 D&D 5e character sheets',
      fileExtension: 'json',
      version: '1.0.0',
      website: 'https://roll20.net'
    },
    compatibility: {
      score: 72,
      recommendation: 'fair',
      dataLoss: 25,
      limitations: ['Limited automation', 'Basic feature support only']
    },
    selected: false
  },
  {
    metadata: {
      id: 'generic-json',
      name: 'Generic JSON',
      description: 'Comprehensive JSON format preserving all character data',
      fileExtension: 'json',
      version: '1.0.0'
    },
    compatibility: {
      score: 100,
      recommendation: 'excellent',
      dataLoss: 0,
      limitations: []
    },
    selected: false
  }
];

// Alpine.js component
Alpine.data('formatSelector', (): FormatSelectorData => ({
  availableFormats: [...defaultFormatOptions],
  selectedFormats: ['fantasy-grounds'], // Default selection
  analysisComplete: false,
  isConverting: false,
  conversionProgress: {},
  recommendedFormat: 'fantasy-grounds',
  characterData: null,

  init() {
    console.log('📋 Format Selector initialized');
    
    // Listen for character data events
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail && event.detail.characterData) {
        this.characterData = event.detail.characterData;
        this.analyzeCharacterCompatibility(this.characterData);
      }
    });
    
    // Simulate initial analysis completion
    setTimeout(() => {
      this.analysisComplete = true;
      console.log('✅ Format analysis complete');
    }, 1000);
  },

  async analyzeCharacterCompatibility(characterData: any) {
    if (!characterData) return;
    
    console.log('🔍 Analyzing character compatibility...');
    this.analysisComplete = false;
    
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock compatibility analysis based on character data
      const totalLevel = this.calculateTotalLevel(characterData);
      const classCount = characterData.classes?.length || 0;
      const hasSpells = (characterData.spells?.class?.length || 0) > 0;
      
      // Adjust compatibility scores based on character complexity
      this.availableFormats.forEach(format => {
        let adjustedScore = format.compatibility.score;
        
        // More complex characters may have reduced compatibility with some formats
        if (format.metadata.id === 'roll20' && (classCount > 1 || hasSpells)) {
          adjustedScore = Math.max(50, adjustedScore - 20);
          format.compatibility.dataLoss = Math.min(40, format.compatibility.dataLoss + 15);
        }
        
        if (format.metadata.id === 'foundry-vtt' && totalLevel > 10) {
          adjustedScore = Math.max(70, adjustedScore - 10);
        }
        
        format.compatibility.score = adjustedScore;
        
        // Update recommendation based on score
        if (adjustedScore >= 90) format.compatibility.recommendation = 'excellent';
        else if (adjustedScore >= 75) format.compatibility.recommendation = 'good';
        else if (adjustedScore >= 60) format.compatibility.recommendation = 'fair';
        else format.compatibility.recommendation = 'poor';
      });
      
      // Update recommended format
      const bestFormat = this.availableFormats.reduce((best, current) => 
        current.compatibility.score > best.compatibility.score ? current : best
      );
      this.recommendedFormat = bestFormat.metadata.id;
      
      this.analysisComplete = true;
      console.log('✅ Compatibility analysis complete');
      
    } catch (error) {
      console.error('❌ Compatibility analysis failed:', error);
      this.analysisComplete = true;
    }
  },

  toggleFormatSelection(formatId: string) {
    const format = this.availableFormats.find(f => f.metadata.id === formatId);
    if (!format) return;
    
    format.selected = !format.selected;
    
    // Update selected formats array
    this.selectedFormats = this.availableFormats
      .filter(f => f.selected)
      .map(f => f.metadata.id);
    
    console.log(`📋 Format ${formatId} ${format.selected ? 'selected' : 'deselected'}`);
  },

  selectRecommendedFormat() {
    if (!this.recommendedFormat) return;
    
    // Clear all selections first
    this.clearSelections();
    
    // Select recommended format
    const recommendedFormat = this.availableFormats.find(f => f.metadata.id === this.recommendedFormat);
    if (recommendedFormat) {
      recommendedFormat.selected = true;
      this.selectedFormats = [this.recommendedFormat];
    }
    
    console.log('⭐ Recommended format selected:', this.recommendedFormat);
  },

  selectAllFormats() {
    this.availableFormats.forEach(format => {
      format.selected = true;
    });
    
    this.selectedFormats = this.availableFormats.map(f => f.metadata.id);
    console.log('📋 All formats selected');
  },

  clearSelections() {
    this.availableFormats.forEach(format => {
      format.selected = false;
    });
    
    this.selectedFormats = [];
    console.log('🧹 All selections cleared');
  },

  async convertToSelectedFormats() {
    if (this.selectedFormats.length === 0) {
      console.warn('No formats selected for conversion');
      return;
    }
    
    if (!this.characterData) {
      console.error('No character data available for conversion');
      return;
    }
    
    this.isConverting = true;
    this.conversionProgress = {};
    
    console.log(`🔄 Starting conversion to ${this.selectedFormats.length} format(s)`);
    
    try {
      // Initialize progress for each selected format
      this.selectedFormats.forEach(formatId => {
        this.conversionProgress[formatId] = {
          status: 'pending',
          progress: 0
        };
      });
      
      // Convert each format sequentially
      for (const formatId of this.selectedFormats) {
        await this.convertToFormat(formatId);
      }
      
      console.log('✅ All format conversions complete');
      
    } catch (error) {
      console.error('❌ Format conversion failed:', error);
    } finally {
      this.isConverting = false;
    }
  },

  async convertToFormat(formatId: string) {
    const format = this.availableFormats.find(f => f.metadata.id === formatId);
    if (!format) return;
    
    const progress = this.conversionProgress[formatId];
    if (!progress) return;
    
    try {
      progress.status = 'converting';
      progress.progress = 0;
      
      console.log(`🔄 Converting to ${format.metadata.name}...`);
      
      // Simulate conversion progress
      for (let i = 0; i <= 100; i += 20) {
        progress.progress = i;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mock successful conversion
      progress.status = 'complete';
      progress.downloadUrl = this.generateDownloadUrl(formatId);
      
      console.log(`✅ ${format.metadata.name} conversion complete`);
      
    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : 'Conversion failed';
      console.error(`❌ ${format.metadata.name} conversion failed:`, error);
    }
  },

  downloadFormat(formatId: string) {
    const progress = this.conversionProgress[formatId];
    const format = this.availableFormats.find(f => f.metadata.id === formatId);
    
    if (!progress || !format || progress.status !== 'complete') {
      console.error('Cannot download format:', formatId);
      return;
    }
    
    // Mock download functionality
    const characterName = this.characterData?.name || 'character';
    const filename = `${characterName}_${formatId}.${format.metadata.fileExtension}`;
    
    console.log(`⬇️ Downloading ${format.metadata.name} file: ${filename}`);
    
    // In a real implementation, this would trigger an actual file download
    // For now, just show a notification
    const notifications = Alpine.store('notifications');
    if (notifications) {
      notifications.addSuccess(`${format.metadata.name} file download started: ${filename}`);
    }
  },

  downloadAllFormats() {
    const completedFormats = Object.entries(this.conversionProgress)
      .filter(([_, progress]) => progress.status === 'complete')
      .map(([formatId]) => formatId);
    
    if (completedFormats.length === 0) {
      console.warn('No completed formats to download');
      return;
    }
    
    console.log(`⬇️ Downloading ${completedFormats.length} format(s)`);
    
    completedFormats.forEach(formatId => {
      this.downloadFormat(formatId);
    });
  },

  getRecommendationBadgeClass(recommendation: string): string {
    const classes = {
      excellent: 'bg-green-100 text-green-800 border-green-300',
      good: 'bg-blue-100 text-blue-800 border-blue-300',
      fair: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      poor: 'bg-red-100 text-red-800 border-red-300'
    };
    
    return classes[recommendation] || 'bg-gray-100 text-gray-800 border-gray-300';
  },

  reset() {
    this.selectedFormats = ['fantasy-grounds'];
    this.analysisComplete = false;
    this.isConverting = false;
    this.conversionProgress = {};
    this.characterData = null;
    
    // Reset format selections
    this.availableFormats.forEach(format => {
      format.selected = format.metadata.id === 'fantasy-grounds';
    });
    
    console.log('🔄 Format selector reset');
  },

  // Helper methods
  calculateTotalLevel(characterData: any): number {
    const classes = characterData.classes || [];
    return classes.reduce((total: number, cls: any) => total + (cls.level || 0), 0);
  },

  generateDownloadUrl(formatId: string): string {
    // Mock download URL generation
    return `#download-${formatId}-${Date.now()}`;
  }
}));

console.log('📋 Format Selector component registered');