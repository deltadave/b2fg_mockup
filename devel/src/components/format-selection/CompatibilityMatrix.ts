/**
 * Compatibility Matrix Alpine.js Component
 * 
 * Displays a visual matrix showing feature support across different VTT formats.
 * Provides detailed breakdown of what features are supported by each format.
 */

import Alpine from 'alpinejs';
import type { FormatCapability } from '@/domain/formats/interfaces/FormatAdapter';

export interface FeatureRow {
  feature: string;
  displayName: string;
  category: 'basic' | 'spells' | 'equipment' | 'features' | 'custom';
  description: string;
  supportByFormat: Record<string, {
    support: 'full' | 'partial' | 'none';
    limitations?: string;
    impact?: 'low' | 'medium' | 'high';
  }>;
}

export interface FormatColumn {
  id: string;
  name: string;
  overallScore: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CompatibilityMatrixData {
  // Data
  formats: FormatColumn[];
  features: FeatureRow[];
  
  // UI State
  selectedCategory: 'all' | 'basic' | 'spells' | 'equipment' | 'features' | 'custom';
  showLegend: boolean;
  highlightedFeature: string | null;
  highlightedFormat: string | null;
  
  // Filtering
  categories: Array<{ id: string; name: string; count: number }>;
  
  // Methods
  init(): void;
  updateMatrix(formatOptions: any[]): void;
  filterByCategory(category: string): void;
  getSupportIcon(support: 'full' | 'partial' | 'none'): string;
  getSupportColor(support: 'full' | 'partial' | 'none'): string;
  getSupportText(support: 'full' | 'partial' | 'none'): string;
  highlightFeature(feature: string | null): void;
  highlightFormat(format: string | null): void;
  getFilteredFeatures(): FeatureRow[];
  getCategoryCount(category: string): number;
  formatLimitations(limitations?: string): string;
  getImpactBadgeClass(impact?: 'low' | 'medium' | 'high'): string;
  exportMatrix(): void;
}

// Compatibility Matrix Alpine.js component
Alpine.data('compatibilityMatrix', (): CompatibilityMatrixData => ({
  // Data
  formats: [],
  features: [],
  
  // UI State
  selectedCategory: 'all',
  showLegend: true,
  highlightedFeature: null,
  highlightedFormat: null,
  
  // Categories
  categories: [
    { id: 'all', name: 'All Features', count: 0 },
    { id: 'basic', name: 'Basic Character', count: 0 },
    { id: 'spells', name: 'Spellcasting', count: 0 },
    { id: 'equipment', name: 'Equipment', count: 0 },
    { id: 'features', name: 'Features & Traits', count: 0 },
    { id: 'custom', name: 'Custom Content', count: 0 }
  ],

  init() {
    console.log('🎯 Compatibility Matrix initialized');
  },

  updateMatrix(formatOptions: any[]) {
    if (!formatOptions || formatOptions.length === 0) {
      this.formats = [];
      this.features = [];
      return;
    }

    console.log('📊 Updating compatibility matrix with', formatOptions.length, 'formats');

    // Build format columns
    this.formats = formatOptions.map(option => ({
      id: option.metadata.id,
      name: option.metadata.name,
      overallScore: option.compatibility.score,
      recommendation: option.compatibility.recommendation
    }));

    // Collect all unique features across formats
    const allFeatures = new Map<string, FeatureRow>();
    
    formatOptions.forEach(option => {
      const capabilities = option.compatibility.capabilities || [];
      
      capabilities.forEach((capability: FormatCapability) => {
        if (!allFeatures.has(capability.feature)) {
          allFeatures.set(capability.feature, {
            feature: capability.feature,
            displayName: this.getFeatureDisplayName(capability.feature),
            category: this.getFeatureCategory(capability.feature),
            description: this.getFeatureDescription(capability.feature),
            supportByFormat: {}
          });
        }

        const featureRow = allFeatures.get(capability.feature)!;
        featureRow.supportByFormat[option.metadata.id] = {
          support: capability.support,
          limitations: capability.limitations,
          impact: capability.impact
        };
      });
    });

    // Ensure all formats have entries for all features
    formatOptions.forEach(option => {
      allFeatures.forEach(featureRow => {
        if (!featureRow.supportByFormat[option.metadata.id]) {
          featureRow.supportByFormat[option.metadata.id] = {
            support: 'none'
          };
        }
      });
    });

    this.features = Array.from(allFeatures.values());

    // Update category counts
    this.updateCategoryCounts();

    console.log('📋 Matrix updated:', {
      formats: this.formats.length,
      features: this.features.length,
      categories: this.categories.map(c => ({ name: c.name, count: c.count }))
    });
  },

  filterByCategory(category: string) {
    this.selectedCategory = category as any;
    console.log('🔍 Filtered by category:', category);
  },

  getSupportIcon(support: 'full' | 'partial' | 'none'): string {
    switch (support) {
      case 'full': return '✅';
      case 'partial': return '⚠️';
      case 'none': return '❌';
      default: return '❓';
    }
  },

  getSupportColor(support: 'full' | 'partial' | 'none'): string {
    switch (support) {
      case 'full': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'none': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  },

  getSupportText(support: 'full' | 'partial' | 'none'): string {
    switch (support) {
      case 'full': return 'Full Support';
      case 'partial': return 'Partial Support';
      case 'none': return 'Not Supported';
      default: return 'Unknown';
    }
  },

  highlightFeature(feature: string | null) {
    this.highlightedFeature = feature;
  },

  highlightFormat(format: string | null) {
    this.highlightedFormat = format;
  },

  getFilteredFeatures(): FeatureRow[] {
    if (this.selectedCategory === 'all') {
      return this.features;
    }
    return this.features.filter(f => f.category === this.selectedCategory);
  },

  getCategoryCount(category: string): number {
    if (category === 'all') {
      return this.features.length;
    }
    return this.features.filter(f => f.category === category).length;
  },

  formatLimitations(limitations?: string): string {
    if (!limitations) return '';
    
    // Truncate long limitations for matrix display
    return limitations.length > 50 
      ? limitations.substring(0, 47) + '...'
      : limitations;
  },

  getImpactBadgeClass(impact?: 'low' | 'medium' | 'high'): string {
    switch (impact) {
      case 'low': return 'bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded';
      case 'medium': return 'bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5 rounded';
      case 'high': return 'bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded';
      default: return '';
    }
  },

  exportMatrix() {
    try {
      const matrixData = {
        formats: this.formats,
        features: this.features,
        exportDate: new Date().toISOString(),
        summary: {
          totalFormats: this.formats.length,
          totalFeatures: this.features.length,
          categoryBreakdown: this.categories.map(c => ({
            category: c.name,
            count: this.getCategoryCount(c.id)
          }))
        }
      };

      const dataStr = JSON.stringify(matrixData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'compatibility-matrix.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('📥 Compatibility matrix exported');

      const notifications = Alpine.store('notifications');
      notifications.addSuccess('Compatibility matrix exported successfully!');

    } catch (error) {
      console.error('Export failed:', error);
      const notifications = Alpine.store('notifications');
      notifications.addError('Failed to export compatibility matrix');
    }
  },

  // Private helper methods
  updateCategoryCounts() {
    this.categories.forEach(category => {
      category.count = this.getCategoryCount(category.id);
    });
  },

  getFeatureDisplayName(feature: string): string {
    const displayNames: Record<string, string> = {
      'abilities': 'Ability Scores',
      'skills': 'Skills',
      'saving_throws': 'Saving Throws',
      'spellcasting': 'Spellcasting',
      'spell_slots': 'Spell Slots',
      'weapons': 'Weapons',
      'armor': 'Armor',
      'magic_items': 'Magic Items',
      'class_features': 'Class Features',
      'racial_features': 'Racial Features',
      'feats': 'Feats',
      'homebrew_content': 'Homebrew Content'
    };
    
    return displayNames[feature] || feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  },

  getFeatureCategory(feature: string): 'basic' | 'spells' | 'equipment' | 'features' | 'custom' {
    const categoryMap: Record<string, 'basic' | 'spells' | 'equipment' | 'features' | 'custom'> = {
      'abilities': 'basic',
      'skills': 'basic',
      'saving_throws': 'basic',
      'spellcasting': 'spells',
      'spell_slots': 'spells',
      'weapons': 'equipment',
      'armor': 'equipment',
      'magic_items': 'equipment',
      'class_features': 'features',
      'racial_features': 'features',
      'feats': 'features',
      'homebrew_content': 'custom'
    };
    
    return categoryMap[feature] || 'features';
  },

  getFeatureDescription(feature: string): string {
    const descriptions: Record<string, string> = {
      'abilities': 'Character ability scores (STR, DEX, CON, INT, WIS, CHA)',
      'skills': 'Skill proficiencies and bonuses',
      'saving_throws': 'Saving throw proficiencies',
      'spellcasting': 'Spellcasting mechanics and spell lists',
      'spell_slots': 'Spell slot management and tracking',
      'weapons': 'Weapon stats, properties, and attacks',
      'armor': 'Armor class, properties, and equipment',
      'magic_items': 'Magical equipment and special properties',
      'class_features': 'Class-specific abilities and features',
      'racial_features': 'Racial traits and abilities',
      'feats': 'Optional feats and abilities',
      'homebrew_content': 'Custom homebrew races, classes, items, etc.'
    };
    
    return descriptions[feature] || 'Character feature or capability';
  }
}));