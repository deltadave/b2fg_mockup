/**
 * Character Preview Disclosure Component
 * 
 * Alpine.js component for organizing character data in progressive disclosure sections
 */

import Alpine from 'alpinejs';

export interface CharacterData {
  name: string;
  level?: number;
  race?: { fullName?: string; baseName?: string; subraceShortName?: string };
  classes?: Array<{
    definition: { name: string };
    level: number;
    subclass?: { definition: { name: string } };
  }>;
  abilities?: {
    [key: string]: { value: number; modifier: number };
  };
  skills?: Array<{
    name: string;
    ability: string;
    proficient: boolean;
    expertise: boolean;
  }>;
  equipment?: Array<{
    definition: { name: string; filterType?: string };
    quantity?: number;
  }>;
  spells?: {
    class?: Array<{ definition: { name: string } }>;
  };
  features?: Array<{
    name: string;
    source: string;
    description: string;
  }>;
}

export interface DisclosureSection {
  id: string;
  title: string;
  icon: string;
  badge?: string;
  expanded: boolean;
  loading: boolean;
  error?: string;
  content?: {
    type: string;
    description?: string;
    [key: string]: any;
  };
}

export interface CharacterPreviewDisclosureData {
  characterData: CharacterData | null;
  sections: DisclosureSection[];
  isLoading: boolean;
  error: string | null;
  
  // Methods
  init(): void;
  loadCharacterData(characterId: string): Promise<void>;
  generateSections(data: CharacterData): DisclosureSection[];
  updateSectionContent(sectionId: string, content: any): void;
  toggleSection(sectionId: string): void;
  expandAll(): void;
  collapseAll(): void;
  refreshSection(sectionId: string): Promise<void>;
}

// Sample character data for demonstration
export const sampleCharacterData: CharacterData = {
  name: "Lyralei Nightwhisper",
  level: 8,
  race: { baseName: "Elf", subraceShortName: "Wood", fullName: "Wood Elf" },
  classes: [
    {
      definition: { name: "Ranger" },
      level: 5,
      subclass: { definition: { name: "Gloom Stalker" } }
    },
    {
      definition: { name: "Rogue" },
      level: 3,
      subclass: { definition: { name: "Scout" } }
    }
  ],
  abilities: {
    strength: { value: 13, modifier: 1 },
    dexterity: { value: 18, modifier: 4 },
    constitution: { value: 14, modifier: 2 },
    intelligence: { value: 12, modifier: 1 },
    wisdom: { value: 16, modifier: 3 },
    charisma: { value: 8, modifier: -1 }
  },
  skills: [
    { name: "Animal Handling", ability: "wisdom", proficient: true, expertise: false },
    { name: "Nature", ability: "intelligence", proficient: true, expertise: true },
    { name: "Perception", ability: "wisdom", proficient: true, expertise: true },
    { name: "Stealth", ability: "dexterity", proficient: true, expertise: false },
    { name: "Survival", ability: "wisdom", proficient: true, expertise: true }
  ],
  equipment: [
    { definition: { name: "Longbow +1", filterType: "Weapon" }, quantity: 1 },
    { definition: { name: "Shortsword", filterType: "Weapon" }, quantity: 1 },
    { definition: { name: "Studded Leather", filterType: "Armor" }, quantity: 1 }
  ],
  spells: {
    class: [
      { definition: { name: "Hunter's Mark" } },
      { definition: { name: "Cure Wounds" } }
    ]
  },
  features: [
    {
      name: "Favored Enemy (Undead)",
      source: "Ranger",
      description: "You have advantage on Survival checks to track undead."
    },
    {
      name: "Sneak Attack",
      source: "Rogue", 
      description: "Deal extra 2d6 damage once per turn with advantage."
    }
  ]
};

// Alpine.js component
Alpine.data('characterPreviewDisclosure', (): CharacterPreviewDisclosureData => ({
  characterData: null,
  sections: [],
  isLoading: false,
  error: null,

  init() {
    console.log('🎭 Character Preview Disclosure initialized');
    
    // Listen for character data events
    window.addEventListener('characterDataLoaded', (event: any) => {
      if (event.detail && event.detail.characterData) {
        this.characterData = event.detail.characterData;
        this.sections = this.generateSections(this.characterData);
        console.log('📊 Character sections generated:', this.sections.length);
      }
    });
    
    // Generate sample sections for demo purposes
    this.sections = this.generateSections(sampleCharacterData);
  },

  async loadCharacterData(characterId: string) {
    this.isLoading = true;
    this.error = null;
    
    try {
      // In a real implementation, this would fetch from the character service
      console.log('🔄 Loading character data for ID:', characterId);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use sample data for now
      this.characterData = sampleCharacterData;
      this.sections = this.generateSections(this.characterData);
      
    } catch (error) {
      console.error('❌ Failed to load character data:', error);
      this.error = error instanceof Error ? error.message : 'Failed to load character';
    } finally {
      this.isLoading = false;
    }
  },

  generateSections(data: CharacterData): DisclosureSection[] {
    const sections: DisclosureSection[] = [
      {
        id: 'character-identity',
        title: 'Character Identity',
        icon: '🧙‍♂️',
        badge: '4 items',
        expanded: true,
        loading: false,
        content: {
          type: 'identity',
          description: `${data.name || 'Unknown'} - Level ${this.calculateTotalLevel(data)} ${this.getPrimaryClass(data)}`
        }
      },
      {
        id: 'character-abilities',
        title: 'Ability Scores',
        icon: '💪',
        badge: '6 abilities',
        expanded: false,
        loading: false,
        content: {
          type: 'abilities',
          description: 'Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma'
        }
      },
      {
        id: 'character-skills',
        title: 'Skills & Proficiencies',
        icon: '🎯',
        badge: `${data.skills?.length || 0} skills`,
        expanded: false,
        loading: false,
        content: {
          type: 'skills',
          description: `${data.skills?.filter(s => s.proficient).length || 0} proficient, ${data.skills?.filter(s => s.expertise).length || 0} expertise`
        }
      },
      {
        id: 'character-equipment',
        title: 'Equipment & Inventory',
        icon: '⚔️',
        badge: `${data.equipment?.length || 0} items`,
        expanded: false,
        loading: false,
        content: {
          type: 'equipment',
          description: 'Weapons, armor, and adventuring gear'
        }
      },
      {
        id: 'character-spells',
        title: 'Spells & Magic',
        icon: '✨',
        badge: `${data.spells?.class?.length || 0} spells`,
        expanded: false,
        loading: false,
        content: {
          type: 'spells',
          description: 'Known spells and magical abilities'
        }
      },
      {
        id: 'character-features',
        title: 'Features & Traits',
        icon: '🌟',
        badge: `${data.features?.length || 0} features`,
        expanded: false,
        loading: false,
        content: {
          type: 'features',
          description: 'Class features, racial traits, and special abilities'
        }
      }
    ];

    return sections;
  },

  updateSectionContent(sectionId: string, content: any) {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.content = { ...section.content, ...content };
      console.log(`📝 Section ${sectionId} content updated`);
    }
  },

  toggleSection(sectionId: string) {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.expanded = !section.expanded;
      console.log(`🔄 Section ${sectionId} ${section.expanded ? 'expanded' : 'collapsed'}`);
    }
  },

  expandAll() {
    this.sections.forEach(section => {
      section.expanded = true;
    });
    console.log('📈 All sections expanded');
  },

  collapseAll() {
    this.sections.forEach(section => {
      section.expanded = false;
    });
    console.log('📉 All sections collapsed');
  },

  async refreshSection(sectionId: string) {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section) return;

    section.loading = true;
    section.error = undefined;

    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`🔄 Section ${sectionId} refreshed`);
    } catch (error) {
      section.error = error instanceof Error ? error.message : 'Refresh failed';
      console.error(`❌ Section ${sectionId} refresh failed:`, error);
    } finally {
      section.loading = false;
    }
  },

  // Helper methods
  calculateTotalLevel(data: CharacterData): number {
    const classes = data.classes || [];
    return classes.reduce((total, cls) => total + (cls.level || 0), 0);
  },

  getPrimaryClass(data: CharacterData): string {
    const classes = data.classes || [];
    if (classes.length === 0) return 'Unknown';
    
    // Return the class with the highest level
    const primaryClass = classes.reduce((prev, current) => 
      (current.level > prev.level) ? current : prev
    );
    
    return primaryClass.definition.name;
  }
}));

console.log('🎭 Character Preview Disclosure component registered');