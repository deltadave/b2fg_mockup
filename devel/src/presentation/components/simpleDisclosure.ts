/**
 * Simple Progressive Disclosure Component
 * 
 * Lightweight Alpine.js component for character section disclosure
 * with basic CSS transitions and no complex dependencies
 */

import Alpine from 'alpinejs';

export interface SimpleSection {
  id: string;
  title: string;
  icon: string;
  badge?: string;
  expanded: boolean;
  description?: string;
}

export interface SimpleDisclosureData {
  sections: SimpleSection[];
  
  // Methods
  init(): void;
  toggleSection(sectionId: string): void;
  createCharacterSections(characterData: any): SimpleSection[];
}

// Simple character preview disclosure sections
function createDefaultSections(): SimpleSection[] {
  return [
    {
      id: 'basic-info',
      title: 'Basic Information',
      icon: '👤',
      expanded: true,
      description: 'Name, race, class, and level'
    },
    {
      id: 'stats',
      title: 'Ability Scores',
      icon: '📊',
      expanded: false,
      description: 'STR, DEX, CON, INT, WIS, CHA scores and modifiers'
    },
    {
      id: 'skills',
      title: 'Skills & Proficiencies',
      icon: '🎯',
      expanded: false,
      description: 'Skill bonuses and proficiency status'
    },
    {
      id: 'features',
      title: 'Features & Traits',
      icon: '⭐',
      expanded: false,
      description: 'Class features, racial traits, and special abilities'
    },
    {
      id: 'equipment',
      title: 'Equipment & Inventory',
      icon: '🎒',
      expanded: false,
      description: 'Weapons, armor, and carried items'
    },
    {
      id: 'spells',
      title: 'Spells & Magic',
      icon: '✨',
      expanded: false,
      description: 'Known spells and spell slots'
    }
  ];
}

// Alpine.js component for simple character preview disclosure
Alpine.data('simpleCharacterDisclosure', (): SimpleDisclosureData => ({
  sections: createDefaultSections(),

  init() {
    console.log('📋 Simple Character Disclosure initialized');
    
    // Listen for character data updates
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail?.characterData) {
        this.updateSectionsWithCharacterData(event.detail.characterData);
      }
    });
  },

  toggleSection(sectionId: string) {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.expanded = !section.expanded;
      console.log(`📂 Section ${section.expanded ? 'expanded' : 'collapsed'}: ${sectionId}`);
    }
  },

  updateSectionsWithCharacterData(characterData: any) {
    // Update sections with character data badges/info
    const updatedSections = this.sections.map(section => {
      switch (section.id) {
        case 'basic-info':
          return {
            ...section,
            badge: characterData.name ? '✓' : '?',
            description: characterData.name 
              ? `${characterData.name} - Level ${this.calculateTotalLevel(characterData)}`
              : 'Character basic information'
          };
        
        case 'stats':
          return {
            ...section,
            badge: characterData.stats ? '6' : '0',
            description: 'Ability scores and modifiers'
          };
        
        case 'skills':
          return {
            ...section,
            badge: characterData.skills ? Object.keys(characterData.skills).length.toString() : '0',
            description: 'Skills and proficiency bonuses'
          };
        
        case 'features':
          return {
            ...section,
            badge: characterData.features ? characterData.features.length.toString() : '0',
            description: 'Class features and racial traits'
          };
        
        case 'equipment':
          return {
            ...section,
            badge: characterData.inventory ? characterData.inventory.length.toString() : '0',
            description: 'Equipment and inventory items'
          };
        
        case 'spells':
          const hasSpells = characterData.spells && characterData.spells.length > 0;
          return {
            ...section,
            badge: hasSpells ? characterData.spells.length.toString() : '0',
            description: hasSpells ? 'Known spells and casting' : 'No spells available'
          };
        
        default:
          return section;
      }
    });
    
    this.sections = updatedSections;
    console.log('📊 Character sections updated with data');
  },

  calculateTotalLevel(characterData: any): number {
    if (!characterData.classes || !Array.isArray(characterData.classes)) return 1;
    return characterData.classes.reduce((total: number, cls: any) => total + (cls.level || 0), 0);
  },

  createCharacterSections(characterData: any): SimpleSection[] {
    return createDefaultSections().map(section => {
      // Add character-specific data to sections
      switch (section.id) {
        case 'basic-info':
          return {
            ...section,
            badge: characterData.name ? '✓' : '?',
            expanded: true
          };
        default:
          return section;
      }
    });
  }
}));

console.log('📋 Simple Character Disclosure component registered');